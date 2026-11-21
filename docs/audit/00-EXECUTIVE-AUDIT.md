# 00 — Executive Audit

**Product:** Gjanand Sarkar (DairyDirect) — an India-first, curated marketplace promising "one verified brand per category".
**Stack:** Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind v4, Supabase Postgres/Auth/Storage/Realtime, Razorpay, Redis, Sentry.
**Scale in repo:** 64 pages · 74 API routes · 188 components · 38 migrations · ~70k LOC · 6 test files.
**Audited:** 20 Nov 2026, build + local production run, security and database read-through.
**Overall:** **5.4 / 10** — *a credible product with a dangerous front door and an unfinished promise.*

---

## 1. The honest summary

This is not a beginner project. Someone has already done a serious performance, accessibility and trust pass: self-hosted fonts, server-side catalogue caching with tags, code-split admin editors, real stock reservation, five-step Razorpay verification, RLS on 40 tables, focus-visible rings, skeletons instead of spinners, reduced-motion support, and product copy that refuses to invent fake discounts or fake ratings. That is rare and it should not be thrown away.

But three things stop it from being a product you can put money behind:

1. **The door is unlocked.** The public login page ships a tab called **"Instant Access"** with a **"Super Admin"** button. It calls `/api/auth/sync` with `{type:"demo", role:"admin"}`, and that endpoint signs a valid admin JWT. In a deployment with `JWT_SECRET` configured (i.e. every real deployment), **any visitor can become an administrator**. The same page also infers admin status from an email address containing the word "admin".
2. **The shop is half-open.** The default payment method is a "Direct UPI ID" option that the order API explicitly rejects. `/subscribe` and `/subscribe/new` are stubs that redirect home while the storefront, profile and notifications all sell subscriptions. Five admin screens exist but are not in the sidebar. The FAQ promises pincode-based delivery windows that checkout never asks for.
3. **The interface is good, not premium.** At audit time the heritage palette (deep forest green, cream, ochre) was a genuinely differentiated direction — it does not look like a Tailwind template. But it is applied with 10px labels, 311 arbitrary sizes, 205 arbitrary radii, 84 uses of a legacy `border-sand` token, and a 263 KB unoptimised logo. Premium is not a colour; it is consistency, restraint and speed.

The gap between "this codebase is impressive" and "this product is ready" is almost entirely **product decisions and finishing**, not architecture.

---

## 2. What is genuinely strong (protect these)

| Strength | Evidence | Why it matters |
|---|---|---|
| **Server/client separation** | `server-only` on catalogue reads; `getAdminSupabase()` never imported by client components; auth cookie kept HttpOnly | Avoids the most common Next.js + Supabase data-leak mistake |
| **Payment verification depth** | Signature + Razorpay fetch + `captured` status + order-id match + amount match + user match (`api/orders/place/route.ts`) | Better than most production Indian storefronts |
| **Stock integrity** | `SELECT FOR UPDATE`, reservation holds, idempotency keys, atomic cancel/return RPCs | Prevents overselling and double refunds during festival spikes |
| **Caching instinct** | `unstable_cache` with tags, 5-minute revalidation, explicit column lists, 24-item pagination | Right shape for a catalogue that changes rarely |
| **Trust copy discipline** | No fake strikethrough prices, no default 4.8 ratings, scripted support assistant that refuses to invent refund timelines | Reduces legal and reputational risk |
| **Accessibility intent** | Focus-visible rings, 44px targets, aria-labels, `prefers-reduced-motion`, semantic skeletons | A real foundation to finish, not start |
| **Brand differentiation** | Forest/cream/ochre at audit time → **Bright q-commerce** chosen after the audit (white canvas, `#0A7B3E`, amber accents) | Not another purple-gradient startup |

---

## 3. The twelve findings that matter

Full detail, reproduction and fixes are in the [Bug Register](./04-BUG-REGISTER.md).

| ID | Sev | Finding | User/business impact |
|---|---|---|---|
| **F-01** | **P0** | Public demo endpoint mints admin JWT; "Super Admin" button on `/login` | Total takeover: orders, customers, payouts, settings |
| **F-02** | **P0** | `profiles` RLS is `USING (true)`; `orders` allows anonymous inserts | Every customer's PII is enumerable with the public anon key; DPDP exposure |
| **F-03** | **P0** | "Direct UPI ID" is default *and* rejected by `/api/orders/place` | The most likely first order fails after payment details are entered |
| **F-04** | **P0** | Subscription hub and plan builder redirect to `/home` | A core advertised pillar does not exist |
| **F-05** | **P1** | Admin role inferred from `email.includes("admin")` in login + callback | Privilege confusion; UI-level escalation path |
| **F-06** | **P1** | No pincode/serviceability check; FAQ claims there is one | Customer commits to an address you may not serve; refund/support cost |
| **F-07** | **P1** | Admin and seller accounts are blocked from the storefront | Staff cannot test, demo, or shop; support cannot reproduce issues |
| **F-08** | **P1** | Dynamic pages block on origin calls with no timeout (`/products`, `/offers` measured 7.1–7.3 s) | A slow database becomes a blank page; LCP collapses |
| **F-09** | **P1** | Five admin routes unreachable from navigation; two competing order screens | Operators cannot find inventory, settings, subscriptions |
| **F-10** | **P1** | User object (name, phone, email, addresses, role) persisted to `localStorage` | Shared-device privacy leak; no consent record |
| **F-11** | **P1** | 22 `alert()` error paths and 398 `console.*` calls | Native browser dialogs destroy the premium illusion; no error telemetry |
| **F-12** | **P1** | No web app manifest, maskable icons, offline shell, or install prompt | "Website now, app later" has no bridge; no installability |

---

## 4. The three modules, assessed separately

### 4.1 Customer storefront — the conversion engine

**What works:** the product card is genuinely well-built (stretched-link accessibility, real discount logic, variant sheet, stock badges, wishlist, quantity stepper). Cart handles unresolved items and stock issues. Checkout has skeletons, a free-delivery progress bar, coupon drawer, address sheet and Razorpay integration.

**What is missing for a premium Indian commerce feel:**

- **No first screen that explains the brand.** `/home` begins with a category rail, then a trust strip, then products. The `HeroBanner` component exists but is not used. A first-time visitor cannot answer "what is this, why should I trust it, what do I get in 10 minutes?" in five seconds.
- **No delivery promise.** No pincode check, no slot picker, no "delivering to Ahmedabad 380015" confidence. The ETA is hardcoded to "Tomorrow, 7:00 – 9:00 AM" on every cart.
- **No search intelligence.** Search submits to a results page. No suggestions, no recent searches, no popular products, no "did you mean", no empty-query discovery.
- **Bottom navigation has no Cart.** Four tabs: Home, Categories, Search, Account. Cart is only in the header, and only when it has items.
- **Language is a three-button pill in the header** (`EN / हि / ગુ`) on every screen. Premium apps put language in Account settings and auto-detect from the device.
- **Empty catalogue renders an empty rail**, not a designed "opening soon" state. In a dairy-only launch this is likely the first impression on a fresh environment.

### 4.2 Seller hub — the supply engine

**What works:** lifecycle states, KYC, product approval workflow, stock/price quick edit, orders, returns, quality reports, payouts, analytics, reactivation requests. It is closer to a real SaaS console than most seed-stage marketplaces.

**What is wrong:**

- One **1,699-line** dashboard page owns ten tabs (`overview`, `profile`, `products`, `rejections`, `inventory`, `orders`, `returns`, `quality-reports`, `analytics`, `notifications`, `store`). State, modals, fetches and rendering are interleaved. Any change risks the whole console.
- The mobile shell renders a **second navigation** (seven pill links) plus a drawer sidebar, with no clear hierarchy and no bottom nav. Tabs use query params inconsistently (`?tab=products`, `?tab=quality-reports`, but `/seller/orders` and `/seller/returns` are separate routes).
- Seller onboarding — the moment that decides supply — is a marketing page and an inquiry form, not a guided checklist with progress, document upload, approval SLA and "what happens next".
- No "morning brief": at 5 a.m. a dairy seller wants today's litres, orders to pack, routes, and stock-outs. The dashboard is an analytics dashboard, not an operations tool.

### 4.3 Admin console — the control room

**What works:** 23 screens covering orders, sellers, approvals, inventory, coupons, campaigns, returns, customers, analytics, audit, settings. Role helpers exist (`admin-roles.ts` with four admin personas, currently unused).

**What is wrong:**

- **Discoverability:** sidebar has 16 items; the app has 23 routes. Missing: `/admin/inventory`, `/admin/settings`, `/admin/subscriptions`, `/admin/reports`, `/admin/vendors`. Two of those (`subscriptions`, `vendors`) are linked from nowhere at all.
- **Two order models:** `/admin/orders` silently filters to *admin-owned product* orders only; `/admin/seller-orders` is a separate list. An operator looking for "order #1042" has a 50% chance of opening the wrong screen. The sidebar labels them "Admin Orders" and "All Seller Orders List" — internal language, not operator language.
- **Client-side gate:** `admin/layout.tsx` decides access from Zustand state. The middleware only decodes the JWT without verifying it. Server APIs do verify — but the shell itself is not a security boundary and should not pretend to be.
- **Direct browser queries:** `/admin/delivery` queries `orders`, `profiles` and `order_items` from the browser Supabase client. This depends entirely on RLS `is_admin(auth.uid())` matching a *Supabase* session, while the app's primary session is a custom `gs_access_token` cookie. If the two sessions diverge, the screen either shows nothing or relies on a permissive policy. **Verify with data.**
- **Desktop-shaped tables on mobile.** Many pages use wide tables with horizontal scroll, 10px text, and hover-only actions. The admin is "desktop-first" by design, but the requirement is that it still *works* on a phone during an emergency.
- **Persona permissions are decorative.** `ROLE_PERMISSIONS` exists but no route, button or query consults it. Every admin is a super-admin in practice.
- **No command palette.** For 23 screens and hundreds of orders, `⌘K` to jump to an order/customer/product is the single highest-leverage admin UX upgrade.

---

## 5. Visual and psychological verdict

### What it feels like today

A well-intentioned heritage grocery brand built by engineers. Calm colours, dense information, lots of thin borders, small type, repeated trust badges, and a dot-pattern background. It reads as **"careful"** but not **"expensive"**. The interface is *busy in a polite way*: too many 12px labels, too many boxes, too little imagery, and no single focal point on the home screen.

### What "premium Indian commerce" actually means

From Blinkit, Zepto, Instamart, Swiggy and Zomato, the premium signals are consistent:

1. **Certainty over choice.** One clear promise ("10 minutes", "fresh by 7 a.m."), repeated at the moment of doubt — not ten trust badges everywhere.
2. **Speed as a feature you can feel.** Sticky search, instant add, optimistic UI, no full-page spinners, no layout jumps.
3. **Photography does the selling.** Large, consistent, appetising product imagery; white or warm-neutral backgrounds; price and pack size as the only text that competes.
4. **A single saturated accent** used for action and value, on a near-white canvas. Restraint reads as confidence.
5. **Checkout in under 30 seconds** for a returning user: saved address, saved payment, one tap.
6. **Human recovery.** When something goes wrong, a named support path, a real timeline, and money-back language — not an `alert()`.

Gjanand Sarkar has (1) partially, (2) in the code but not in the pixels, (3) not at all, (4) no, (5) no, (6) partially (scripted support exists, but errors are native alerts).

The full thesis, including the Indian trust equation and dark-pattern guardrails, is in [UX Psychology](./02-UX-PSYCHOLOGY.md). The concrete visual language is in [Design System v2](./05-DESIGN-SYSTEM-V2.md).

---

## 6. Measured health snapshot

| Signal | Measured locally | Target | Verdict |
|---|---:|---:|---|
| Production build | Pass, 95 pages, TS clean | Pass | ✅ |
| Home HTML (no products) | **80.3 KB** | < 50 KB | ⚠️ |
| JS chunks on home | **19** | ≤ 8 | ❌ |
| Raw JS on home | **1,075 KB** | < 700 KB raw | ❌ |
| Cached home TTFB | 12 ms | < 200 ms | ✅ |
| `/products` full response | **7.32 s** (origin unavailable) | < 1.5 s | ❌ |
| `/offers` full response | **7.12 s** | < 1.5 s | ❌ |
| Logo asset | **263 KB PNG**, `<img>`, no dimensions | < 20 KB SVG/WebP | ❌ |
| Automated tests | **6 files** for 74 API routes | Critical paths covered | ❌ |
| `alert()` calls | **22** | 0 | ❌ |
| `console.*` calls | **398** | structured logger only | ❌ |
| Arbitrary Tailwind values | **516** (`text-[…]` 311 + `rounded-[…]` 205) | < 50 | ❌ |
| 10px text usages | 8 files | 0 | ❌ |

Core Web Vitals thresholds used: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at p75 ([DigitalApplied](https://www.digitalapplied.com/blog/core-web-vitals-2026-inp-lcp-cls-optimization-guide)). Recommended internal budgets are stricter: LCP ≤ 2.0 s, INP ≤ 150 ms, CLS ≤ 0.05.

---

## 7. Compliance exposure (India)

| Area | Current state | Risk |
|---|---|---|
| **DPDP Act 2023** | No itemised consent notice; role/name/phone persisted client-side; `profiles` publicly readable; no withdrawal or erasure path | High — security-safeguard failures carry penalties up to ₹250 crore ([Consent.in](https://www.consent.in/blog/dpdp-act)) |
| **E-Commerce Rules 2026** (effective 1 Jan 2027) | No grievance officer acknowledgement SLA, no sponsored-listing labelling, no dark-pattern self-audit | Medium–High — plan before January |
| **CCPA dark patterns (2023)** | No false urgency or basket sneaking found — genuinely good. But "Instant Access" and hidden fees risk is low; keep it that way | Low, with guardrails |
| **Legal Metrology / pricing** | Real MRP-only strikethroughs; no invented discounts | ✅ Strong |
| **Accessibility (WCAG 2.2 AA)** | Good focus/target intent; 10px text and 3.95:1 error chips fail | Medium |
| **Payment security** | Strong server-side verification; but `CSP` contains `unsafe-eval` and no CSRF token on cookie-auth mutations | Medium |

---

## 8. The product thesis to build toward

> **Gjanand Sarkar is the trustworthy Indian pantry, delivered before breakfast.**
>
> Not "another marketplace". Not "another 10-minute app". A curated shelf where every category has exactly one brand you can trust, every product has a lab report, every delivery has a named window, and every problem has a human who answers in under two hours.

This thesis resolves most open product questions:

- **Imagery over inventory count.** One brand per category means fewer SKUs; use the space for provenance, farm, batch, lab report, and a beautiful pack shot.
- **Certainty over speed theatre.** "At your door between 6:30 and 7:30 a.m." beats a fake 8-minute countdown.
- **Subscription as the hero, not a tab.** For milk and curd, the repeat plan *is* the product. It must be the primary home CTA, not a dead route.
- **Trust as a visible object.** A quality report, a return promise, a support SLA and a real address are premium features, not footer links.
- **Phone-first, app-ready.** 360px is the design canvas; the desktop is an enhancement. A manifest, install prompt and offline shell make "app later" a switch, not a rewrite.

---

## 9. What happens next

The [Roadmap](./07-ROADMAP.md) is sequenced so that **safety precedes beauty**:

| Phase | Duration | Outcome |
|---|---|---|
| **0 — Stop the bleeding** | 24–48 h | Close admin bypass, fix RLS, remove broken UPI, hide subscriptions |
| **1 — Trust & checkout** | Week 1 | Pincode + slots, payment success/failure recovery, toasts, error boundaries |
| **2 — Premium customer surface** | Weeks 2–3 | New design tokens, home, PDP, cart, checkout, bottom nav, search |
| **3 — Seller & admin workspaces** | Weeks 4–5 | Split monolith, fix IA, mobile tables, command palette, morning brief |
| **4 — Harden & launch** | Week 6 | Perf budgets, PWA, SEO, DPDP consent, test coverage, observability |

**Success metrics to instrument before Phase 2** (none are reliable today): home → PDP rate, PDP → add-to-cart, cart → checkout, checkout → paid, payment failure rate by method, first-order time, 7-day repeat rate, subscription attach rate, support contacts per 100 orders, p95 LCP/INP by device class.

---

*Read next: [Architecture & Modules](./01-ARCHITECTURE-AND-MODULES.md) for how it is built, or [Scenarios](./03-SCENARIOS-AND-GLITCHES.md) to see it fail in real life.*
