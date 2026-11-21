# Gjanand Sarkar — Product & Experience Audit 2026

> **Status:** Complete first pass · **Date:** 20 Nov 2026 · **Scope:** Customer, Seller, Admin (web, mobile-web, future app) · **Mode:** Local-only, nothing pushed.
>
> **Verdict in one line:** the engineering bones are real and unusually mature for a pre-launch marketplace, but the product was not *safe* to launch (two critical security holes), not yet *complete* (an entire subscription pillar redirected to home), and not yet *premium* (a good palette applied with inconsistent craft).
>
> **Update — 20 Nov 2026, P0 pass landed:** demo admin login and the `DEMO_MODE` OTP echo are gone; admin role is server-authoritative; the `anon` role is revoked from personal tables (new migration `20261120_security_hardening.sql`); checkout no longer offers a payment method the server rejects; `/products` and `/offers` no longer hang on an unreachable database (`withTimeout`); the subscription hub and 4-step plan builder are implemented. The **design direction is "Bright q-commerce"** (white canvas, `#0A7B3E` accent), and `05-DESIGN-SYSTEM-V2.md` + this report has been reworked around it. The critique in sections below describes the state *at audit time* and is retained as the record of why the fixes were needed.

---

## 1. What this audit is

This is a **product audit**, not a code review. It asks three questions:

1. **Does it work?** — every flow, every role, every edge case, on a phone and on a desktop.
2. **Does it feel trustworthy and expensive?** — the psychology of Indian commerce, the craft of the interface, the speed of the first five seconds.
3. **Will it survive real life?** — festival traffic, flaky payments, a rider who is late, a seller who uploads a bad photo, a customer on a shared phone.

It is written so that a designer, an engineer, a founder and a future AI assistant can all use the same document as context.

---

## 2. How the audit was performed

| Method | What was actually done |
|---|---|
| **Static architecture read** | 188 `.tsx` files, 64 routes, 74 API route handlers, 38 SQL migrations, ~70,000 lines of application code read or sampled. |
| **Build verification** | `npm ci` + `next build` executed locally. Build passes (Next 16.2.10, Turbopack, 95 pages, TypeScript clean). |
| **Runtime probing** | Production server started locally; `/`, `/home`, `/products`, `/login`, `/cart`, `/offers` requested and measured; headers, caching and HTML payload inspected. |
| **Security probing** | Auth middleware, JWT issuance, RBAC helpers, RLS policies, Razorpay verification and webhook handling inspected; demo-session endpoint exercised. |
| **Design token audit** | Palette contrast ratios computed; legacy-token and arbitrary-value usage counted; type scale and radii catalogued. |
| **Journey simulation** | 14 real-life scenarios written from the perspective of named Indian users, traced against the actual implementation. |
| **External research** | Indian q-commerce UX patterns, DPDP Act 2023 / DPDP Rules 2025, CCPA dark-pattern guidelines, and 2026 Core Web Vitals thresholds. Sources are cited inline. |

**What was *not* possible:** browser screenshots (no Chromium download in this sandbox) and live Supabase/Razorpay calls (no credentials). Every finding that depends on those is labelled **"verify with data"** rather than stated as fact.

---

## 3. Reading order

| # | Document | Use it when you need… |
|---|---|---|
| **00** | [Executive Audit](./00-EXECUTIVE-AUDIT.md) | The verdict, the scorecard, the 12 findings that matter, and what to do first. |
| **01** | [Architecture & Modules](./01-ARCHITECTURE-AND-MODULES.md) | How the three modules actually work, route maps, data flow, where the seams are. |
| **02** | [UX Psychology](./02-UX-PSYCHOLOGY.md) | Why premium feels premium, the Indian trust equation, ethical persuasion, dark-pattern guardrails. |
| **03** | [Scenarios & Glitches](./03-SCENARIOS-AND-GLITCHES.md) | 14 named users, step-by-step journeys, what breaks, what they feel, what to fix. |
| **04** | [Bug Register](./04-BUG-REGISTER.md) | 64 prioritised defects with file evidence, impact and fix. |
| **05** | [Design System v2](./05-DESIGN-SYSTEM-V2.md) | The new premium visual language: tokens, type, motion, components, module shells, responsive rules. |
| **06** | [Performance, Security & Resources](./06-PERFORMANCE-SECURITY-RESOURCES.md) | Measured budgets, hardening plan, compliance, cost control. |
| **07** | [Roadmap](./07-ROADMAP.md) | A 6-week plan with acceptance criteria and success metrics. |
| **08** | [Project Context for AI](./08-PROJECT-CONTEXT-FOR-AI.md) | The compact context file to load into a future session. |
| — | [Visual Direction (HTML)](./index.html) | The same story as a designed, navigable report. |

---

## 4. Scorecard (blunt)

Scores are out of 10 and calibrated against a **funded Indian D2C/q-commerce product**, not against a hobby project.

| Dimension | Score | One-line reason |
|---|---:|---|
| **Security & compliance** | **3.0** | A public "Super Admin" login mints an admin JWT for anyone; `profiles` is world-readable. |
| **Reliability** | **5.0** | Atomic stock and payment verification are genuinely good; there are no network timeouts and 398 raw console statements. |
| **Performance** | **6.0** | Excellent caching/SSR instincts undermined by 1.07 MB of raw JS, a 263 KB logo and blocking origin calls. |
| **Architecture** | **6.5** | Clean server/browser split and schema discipline, weakened by dual auth paths and 1,700-line screens. |
| **Information architecture** | **5.0** | Three modules exist, but five admin pages are unreachable and two order models compete. |
| **Customer UX** | **5.5** | Good primitives, trust copy and skeletons; broken default payment, dead subscriptions, no pincode check. |
| **Seller experience** | **5.0** | Genuinely deep tooling hidden inside one monolithic tabbed screen. |
| **Admin experience** | **5.5** | Operationally capable, discoverability-poor, desktop-shaped on mobile. |
| **Visual craft / premium feel** | **6.0** | The palette is distinctive and non-generic; execution is inconsistent (10px text, 311 arbitrary values, border noise). |
| **Accessibility** | **5.0** | Strong focus and touch-target intent; tiny text, 3.95:1 error chips, unlabelled clickable divs. |
| **Documentation** | **7.0** | Unusually thorough, but stale in places and over-claims "production-ready". |
| **Overall** | **5.4 / 10** | **Strong bones. Unfinished product. Dangerous defaults.** |

---

## 5. The five things to do before anything else

These are not design improvements. They are stop-the-bleeding actions.

1. **Delete the demo login path** (`/api/auth/sync` `type: "demo"`) or gate it behind `NODE_ENV !== "production"` **and** remove the "Instant Access → Super Admin" UI. Right now anyone can become an admin. See [F-01](./04-BUG-REGISTER.md#f-01).
2. **Fix the `profiles` RLS policy.** `USING (true)` exposes every customer's name, phone, email, address and role to the public anon key. This is a DPDP Act 2023 problem, not just a bug. See [F-02](./04-BUG-REGISTER.md#f-02).
3. **Remove "Direct UPI ID" from checkout** (or wire it properly). It is the *default* payment method and the API rejects it with HTTP 400, so the most common first order fails at the last step. See [F-03](./04-BUG-REGISTER.md#f-03).
4. **Fix or hide subscriptions.** `/subscribe` and `/subscribe/new` redirect to `/home`, while the home page, profile and notifications all advertise subscriptions. See [F-04](./04-BUG-REGISTER.md#f-04).
5. **Stop trusting the browser for identity.** Role is inferred from `email.includes("admin")` in two places. Always derive role server-side from `profiles.role`. See [F-05](./04-BUG-REGISTER.md#f-05).

After those five, the **premium programme** in [Design System v2](./05-DESIGN-SYSTEM-V2.md) and the [Roadmap](./07-ROADMAP.md) can proceed safely.

---

## 6. Evidence conventions

- **File references** are relative to `dairydirect/frontend/` unless stated otherwise, with line numbers where the finding is a single point.
- **Severity**
  - `P0` — blocks launch; security, money, or a broken core flow for most users.
  - `P1` — seriously damages trust or conversion; fix before marketing spend.
  - `P2` — polish/craft; visible to users, fix in the design pass.
  - `P3` — internal quality, maintainability, future-proofing.
- **"Verify with data"** marks a finding that depends on production telemetry or a seeded database.
- **No claim about visual appearance was made from a screenshot.** Visual findings come from code, tokens, rendered HTML and measured payloads.

---

## 7. Research anchors

- Quick-commerce expectations in India — speed, persistent search, repeat-order grouping, single-tap checkout, and the trust cost of false urgency and basket sneaking. [StartupChai teardown](https://www.startupchai.in/p/the-weekend-insight-quick-commerce-showdown-zepto-vs-blinkit-vs-instamart-vs-bigbasket), [ProductGrowth teardown](https://productgrowth.in/tools/compare/blinkit-vs-zepto-vs-instamart/), [UX analysis](https://medium.com/@tanmayvatsa1507/quick-commerce-indian-users-mindset-ux-345287c4d858).
- DPDP Act 2023 / DPDP Rules 2025 — itemised notice, purpose limitation, data minimisation, easy withdrawal, security safeguards; penalties up to ₹250 crore. [Consent.in](https://www.consent.in/blog/dpdp-act), [IndiaConsent e-commerce guide](https://www.indiaconsent.com/resources/blog/dpdp-for-ecommerce), [DPDP compliance guide](https://www.incorpx.io/guide/dpdp-act-2023-compliance-guide-businesses).
- CCPA Guidelines for Prevention and Regulation of Dark Patterns (2023) and the 2026 E-Commerce Amendment Rules — false urgency, basket sneaking, subscription traps; annual dark-pattern self-audit from 1 Jan 2027. [IndiaConsent](https://www.indiaconsent.com/resources/blog/dpdp-for-ecommerce).
- Core Web Vitals 2026: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at the 75th percentile. [DigitalApplied](https://www.digitalapplied.com/blog/core-web-vitals-2026-inp-lcp-cls-optimization-guide), [Prooflytics](https://prooflytics.io/blog/core-web-vitals-thresholds-2026-lcp-inp-cls).

---

*Nothing in this audit has been pushed to any remote. All artefacts live under `docs/audit/` in the local working tree.*
