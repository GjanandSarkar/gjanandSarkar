# 07 — Roadmap

**Sequenced by risk, not by excitement.** Safety and money first; beauty second; operations third; hardening last.

Assumed team: 1–2 full-stack engineers, 1 designer (part-time), 1 founder/PM, access to a support person. Effort in engineer-days (ed).

---

## Phase 0 — Stop the bleeding (24–48 hours)

> Do not announce, advertise or demo the product until this is done.

| # | Task | ed | Acceptance |
|---|---|---:|---|
| 0.1 | Remove demo login UI + `/api/auth/sync` demo branch; CI grep guard | 0.5 | POST demo returns 403 in production build; no "Instant Access" string |
| 0.2 | Fix `profiles` RLS + revoke `anon`; fix anonymous order insert | 0.5 | Anon key returns 0 profile rows; authenticated user reads only self |
| 0.3 | Remove "Direct UPI ID"; default Razorpay; migrate stored selection | 0.5 | Every rendered method places an order in test mode |
| 0.4 | ~~Hide or ship subscriptions~~ **Shipped** (hub + 4-step builder + pause/skip/cancel) | 0.5 | No link resolves to a redirect-to-home page |
| 0.5 | Remove email-based admin inference + hardcoded emails | 0.25 | Role only from `/api/auth/sync` |
| 0.6 | Add network timeouts + degraded shells | 1 | `/products` and `/offers` < 1.5 s with DB down |

**Exit criteria:** the five P0s in the [Executive Audit](./00-EXECUTIVE-AUDIT.md#5-the-five-things-to-do-before-anything-else) are closed and verified by a second person.

---

## Phase 1 — Trust & checkout (Week 1)

**Goal:** a first-time customer can get a real order, with certainty, without hitting a dead end.

| # | Task | ed | Acceptance |
|---|---|---:|---|
| 1.1 | Pincode + serviceability API + header capture | 2 | Unserviceable pincode blocked before cart; fee/window shown |
| 1.2 | Delivery slot picker (pincode + cutoff + capacity) | 2 | Slot stored on order, shown on confirmation/tracking, enforced cutoff |
| 1.3 | Toast + inline error + recovery screen system | 2 | Zero `alert()` in customer flows; paid-but-unconfirmed has a recovery page |
| 1.4 | Payment failure analytics + retry | 1 | Failure rate by method visible daily |
| 1.5 | Remove PII from `localStorage`; session rehydrate | 1 | Device switch shows no previous user data |
| 1.6 | Consent screen + account privacy controls | 2 | Consent version stored; delete/withdraw works |
| 1.7 | Admin/seller can view storefront | 0.5 | Role switcher; no forced redirect |
| 1.8 | Refund reconciliation job + alerts | 1 | Captured-without-order auto-detected within 15 min |

**Metrics to move:** checkout completion +15 pts, payment failure < 3%, support contacts per 100 orders < 12.

**Gate:** place 20 real test orders across UPI, card, netbanking and COD; 3 refunds; 3 cancellations.

---

## Phase 2 — Premium customer surface (Weeks 2–3)

**Goal:** it looks and feels like a funded Indian commerce product on a 360px phone.

| # | Task | ed | Acceptance |
|---|---|---:|---|
| 2.1 | Apply Design System v2 tokens; delete legacy aliases | 2 | No `bg-cream`/`border-sand`; zero arbitrary radius in top 10 surfaces |
| 2.2 | Rebuild customer shell: header ≤ 132px, search sticky, 5-slot bottom nav with cart | 2 | Cart reachable in one tap from any screen |
| 2.3 | Home: hero promise + pincode + window; reorder-first for returning users; 5 sections max | 3 | First screen answers what/trust/when; LCP < 2.0 s |
| 2.4 | Product card + PDP redesign (photography, batch, quality report, savings, subscribe & save) | 3 | Add-to-cart > 18%; CLS < 0.05 |
| 2.5 | Cart + checkout redesign (slot, savings, trust row, one CTA, no surprises) | 3 | Cart→paid > 80% mobile |
| 2.6 | Search: suggestions, recents, popular, designed empty state | 2 | p95 suggest < 150 ms |
| 2.7 | Order tracking: 4-step timeline, rider/ETA placeholder, plain-language status | 2 | Works at 320px, no horizontal scroll |
| 2.8 | Rebuild returns as a 3-tap flow with SLA date | 2 | Return completion > 70% |
| 2.9 | Accessibility pass: Radix dropdown/radio, skip link, aria-live, 12px minimum | 2 | axe clean; keyboard-only checkout completes |
| 2.10 | Performance: JS ≤ 250 KB gz, 8 chunks, logo SVG, framer-motion removed from cards | 3 | Budgets enforced in CI |
| 2.11 | PWA: manifest, icons, offline shell, install prompt | 1.5 | Installable on Android; Lighthouse PWA pass |

**Design reviews:** every screen reviewed at 360, 768 and 1280, light and dark, with a real product image and a long Gujarati string.

**Gate:** 10 usability tests (5 existing customers, 5 first-time) — 8/10 complete an order unaided in under 4 minutes.

---

## Phase 3 — Seller & admin workspaces (Weeks 4–5)

**Goal:** the people who keep the promise can do their job at 5 a.m. and during a festival rush.

### Seller

| # | Task | ed | Acceptance |
|---|---|---:|---|
| 3.1 | Split 1,699-line dashboard into routes + feature modules | 3 | Each route < 300 lines; tabs are URLs |
| 3.2 | "Today" operations brief (litres, orders by slot, pack list, stock-outs, returns) | 2 | A seller can start packing in 2 taps |
| 3.3 | Guided onboarding (5 steps, save & resume, documents, SLA) | 3 | New seller reaches first product in < 20 min |
| 3.4 | Lifecycle banner + capability matrix (what you can do when suspended) | 1 | No submit-then-fail surprises |
| 3.5 | Mobile shell: one nav, bottom bar + More sheet | 1 | No duplicated pill strip |
| 3.6 | Payouts & deductions statement | 1.5 | Downloadable CSV/PDF with period |

### Admin

| # | Task | ed | Acceptance |
|---|---|---:|---|
| 3.7 | Grouped sidebar + route coverage + `⌘K` search | 2 | Every route reachable; order search by number/phone |
| 3.8 | One orders model with owner filter | 2 | One screen answers "where is order #1042" |
| 3.9 | Mobile exception dashboard (late, failed, stock-out, returns) | 2 | Ops can act one-thumbed |
| 3.10 | Tables → cards under `md`; 13px minimum | 2 | No horizontal scroll on 360px |
| 3.11 | Money screen (collected, settled, refunded, COD, unmatched, export) | 2 | Daily reconciliation in < 15 min |
| 3.12 | Implement or delete `ROLE_PERMISSIONS` | 1 | Actions gated by persona |
| 3.13 | Move browser Supabase queries to admin APIs | 1 | No PII table queried from the client |

**Gate:** ops runs a simulated 3× volume day on phones; seller packs a simulated morning in under 10 minutes.

---

## Phase 4 — Harden & launch (Week 6)

| # | Task | ed | Acceptance |
|---|---|---:|---|
| 4.1 | Test suite: pricing, every payment method, webhook, RLS, cancel/return, subscription | 4 | Critical paths covered; CI blocks regressions |
| 4.2 | CSP nonce, remove `unsafe-eval`, COOP, CSRF review | 1 | A-grade security headers; Razorpay works |
| 4.3 | Redis mandatory in prod; fail closed for OTP/payment | 0.5 | No in-memory fallback in production |
| 4.4 | Structured logging + request ids + redaction | 1 | No PII in logs; 5xx alerts |
| 4.5 | Load test + oversell test | 1 | 100 concurrent checkouts, stock never negative |
| 4.6 | Backup restore drill + kill switch drill | 0.5 | RTO < 2 h, ordering can be paused in < 1 min |
| 4.7 | SEO: product schema, canonical, sitemap, OG images, robots | 1 | Rich results valid; no duplicate titles |
| 4.8 | Docs refresh + runbook + on-call | 1 | A new engineer can deploy and roll back |
| 4.9 | Analytics contract + dashboard | 1 | 12 events documented and queryable |

**Launch gate:** every item in [Performance, Security & Resources §7](./06-PERFORMANCE-SECURITY-RESOURCES.md#7-launch-gate-must-all-be-true) is true.

---

## If you only have two days

Do exactly this, in order:

1. Kill the demo admin path and the UI (0.5 ed).
2. Fix profiles RLS + anon grants (0.5 ed).
3. Remove Direct UPI and default to Razorpay (0.5 ed).
4. Hide subscriptions everywhere (0.5 ed).
5. Remove PII from `localStorage` (0.5 ed).
6. Add a 3-second timeout to server data calls (0.5 ed).

That is ~3 engineer-days and removes every existential risk in this audit.

---

## If you have six weeks

Follow the phases. The critical path is **0 → 1 → 2.2/2.3/2.4/2.5 → 3.7/3.8/3.9 → 4.1/4.2**. Everything else can slip a week without blocking launch.

---

## Sequencing risks

| Risk | Mitigation |
|---|---|
| Redesign starts before security fixes | Hard gate: Phase 0 signed off by a second pair of eyes |
| Token migration breaks dark mode | Codemod + visual regression screenshots at 360/1280 in both themes |
| Subscription ship slips again | Timebox to 5 ed; if not ready by end of Week 3, permanently hide until V2 |
| Seller refactor destabilises orders | Extract behind route-level tests; ship read-only first, then actions |
| Admin redesign becomes a research project | Ship IA + mobile cards + search only; no visual fantasy |
| Performance budgets ignored under deadline | CI fails the build on budget breach from Week 2 onward |

---

## Definition of done (per feature)

- Works at 360px, 768px, 1280px; light and dark.
- Loading, empty, error and offline states designed.
- Keyboard path and screen-reader labels verified.
- No `alert`, no raw error, no database term.
- Analytics event emitted.
- Unit/integration test for the happy path + one failure path.
- Performance budget respected (no new heavy dependency without a note).
- Copy reviewed in English, Hindi and Gujarati.
- Documentation updated in `docs/audit/` or the relevant architecture doc.

---

## Success dashboard (review weekly)

| Metric | Baseline | 6-week target |
|---|---:|---:|
| Checkout completion (mobile) | unknown | > 80% |
| Payment failure rate | unknown (broken UPI) | < 3% |
| Add-to-cart rate | unknown | > 18% |
| 7-day repeat (dairy) | unknown | > 35% |
| Subscription attach | 0% (dead) | > 20% |
| Support contacts / 100 orders | unknown | < 8 |
| p75 LCP / INP / CLS | unmeasured | 2.0 s / 150 ms / 0.05 |
| Initial JS (gz) | ~300–350 KB | < 250 KB |
| Admin task: find order | > 30 s, 2 screens | < 10 s, 1 screen |
| Seller time-to-pack | unknown | < 10 min |
| P0/P1 open bugs | 40 | 0 |

---

*Next: [Project Context for AI](./08-PROJECT-CONTEXT-FOR-AI.md) — the compact brief to reload in a future session.*
