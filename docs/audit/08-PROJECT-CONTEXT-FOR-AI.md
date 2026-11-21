# 08 — Project Context for AI (load this first)

A compact, high-signal brief for any future assistant working on this repository. Facts verified against the code on **20 Nov 2026**. If code and this file disagree, the code wins — update this file.

---

## 1. What this project is

**Gjanand Sarkar** (internal name *DairyDirect*) is an India-first marketplace built on a "one verified brand per category" model. At launch it is a **dairy** business (`launch.ts`: `DAIRY_ONLY = true`, `LIVE_CATEGORY_KEYS = ['dairy']`). As of the Nov 2026 P0 pass, brand copy, the hero and metadata are dairy-first; multi-category promises must not return until a second partner signs.

Three modules:

1. **Customer storefront** — discovery, PDP, cart, checkout, orders, tracking, returns, **subscriptions (hub + 4-step builder + pause/skip/cancel)**, profile.
2. **Seller hub** — onboarding, products/approval, stock, orders, returns, quality reports, payouts, analytics.
3. **Admin console** — orders, sellers, approvals, catalogue, inventory, coupons, campaigns, returns, customers, delivery, analytics, audit, settings.

**Current state (post-P0):** build passes; core commerce is well engineered; demo-admin login, the OTP leak, the anon `profiles` exposure and the broken default payment are fixed; subscriptions are real; the visual system is **Bright q-commerce** (white canvas, `#0A7B3E` accent). Still open: unauthenticated seller/order mutations that rely on RLS alone, admin/seller IA, and the remaining P1/P2 register. Overall audit score at time of audit: **5.4/10**.

---

## 2. Stack and commands

```
Next.js 16.2.10 (App Router, Turbopack) · React 19 · TypeScript 5
Tailwind CSS v4 (@theme in globals.css) · Radix primitives · lucide-react · framer-motion
Supabase (Postgres 16, Auth, Storage, Realtime) · pg (RDS legacy) · ioredis
Razorpay · ImageKit · Sentry · Zustand · Zod · Vitest
```

```bash
cd dairydirect/frontend
npm ci
cp .env.local.example .env.local     # fill Supabase/Razorpay/JWT secrets
npm run dev                          # http://localhost:3000
npm run build && npm run start
npm test                             # vitest (6 files only)
```

There is no `/backend` service. `dairydirect/backend` does not exist. Ignore `STRUCTURE.md`'s monorepo claims.

**Env essentials:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`/`DIRECT_URL`, `JWT_SECRET` (≥32 chars), `RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET`, `REDIS_URL`, `IMAGEKIT_PRIVATE_KEY`, `ADMIN_EMAILS`. Without `JWT_SECRET`, all JWT-issuing routes fail.

---

## 3. Architecture in one screen

```
app/(customer)/*      customer shell: TopBar → Header → CategoryNavBar → main → Footer → Cart/BottomNav/SupportChat
app/seller/*          client-gated shell: SellerSidebar + mobile header + pill nav
app/admin/*           client-gated shell: AdminSidebar + mobile header
app/api/*             74 route handlers; server-side auth; service-role Supabase
src/lib/api/*         data helpers (server and browser mixed — check imports)
src/lib/aws/*         rds (pg), redis (cache/OTP/rate limit), s3, ses, sns
src/lib/auth/*        custom JWT (gs_access_token, gs_refresh_token)
src/store/useStore.ts Zustand + localStorage persist (language, cart, wishlist only — PII removed)
middleware.ts         edge guard for /admin and /seller; CSRF/origin gate for mutating /api/*
```

**Two identity systems:** Supabase Auth (Google/email) → `/api/auth/sync` mints a custom JWT; phone OTP uses Redis + RDS/Supabase directly. APIs trust the custom JWT. **Two data paths:** service-role Supabase on the server; some admin screens query Supabase from the browser (legacy).

**Database:** 44 tables, 38 migrations, serious RPCs (`place_order_atomic`, reservation, cancel, COD confirm, seller stock sync). See [Architecture](./01-ARCHITECTURE-AND-MODULES.md#6-database-map).

---

## 4. Invariants — do not break

0. **Never reintroduce demo credentials.** No hardcoded admin email/phone, no `DEMO_MODE` OTP echo, no client-side role inference. Roles come from `profiles.role` via `/api/auth/sync`; the dev OTP echo is gated on `NODE_ENV !== 'production'` only.
1. **`getAdminSupabase()` / `SUPABASE_SERVICE_ROLE_KEY` must never reach a client bundle.** `server-only` imports enforce this; keep them.
2. **Prices and totals are computed server-side.** Never trust a client amount. `calculateOrderPricing()` is the source of truth.
3. **Stock changes go through RPCs / reservations.** Never `UPDATE product_variants SET stock = …` directly from a route.
4. **Razorpay:** signature + `captured` status + order-id match + amount match + user match. Never mark paid from the client.
5. **Order status transitions** are constrained (`pending → confirmed → out_for_delivery → delivered`, cancel allowed before delivery). Use `advance_order_status` / cancel RPCs.
6. **Roles come from `profiles.role` server-side.** Never infer from email or client state.
7. **The design token names in `@theme` are the public API of the styling system.** Change values, not names, until the codemod is complete.
8. **Fixed bottom stacks are positioned in one CSS class each** (`floating-cart-bar`, `pdp-action-bar`, `checkout-action-bar`). Do not re-add Tailwind position utilities beside them.
9. **`/` is a rewrite to `/home`.** Do not replace it with a client redirect.
10. **`no-scrollbar` rails need `min-w-0` children and snap alignment.** Long Hindi/Gujarati strings are the test.

---

## 5. Landmines (known)

| Area | Landmine |
|---|---|
| Auth | `/api/auth/sync` `type:"demo"` mints any role. Public "Super Admin" button on `/login`. Email-substring admin inference. |
| RLS | `profiles` is `USING (true)` and `anon` has `GRANT ALL`. `orders` allows anonymous insert. |
| Checkout | `checkoutPaymentMethod` defaults to `'upi'`; the API rejects `'upi'`. 22 `alert()`s. Hardcoded ETA. No pincode. |
| Subscriptions | `/subscribe` and `/subscribe/new` redirect home; banners still link there. |
| Storage | Zustand persists name/phone/email/addresses/role in `localStorage`. |
| Admin | Five routes not in the sidebar; two order screens; client-side gate; direct browser Supabase query in `/admin/delivery`. |
| Seller | One 1,699-line dashboard; triple navigation. |
| Perf | 19 chunks / 1.07 MB raw JS on home; 263 KB logo; no upstream timeouts; `/products` 7.3 s with DB down. |
| Config | `SECTIONS.circularCategories = false` but home renders it. Hardcoded Supabase hosts in `next.config.ts`. CSP has `unsafe-eval`. |
| Docs | Several historical docs contradict the code. Trust `src/`. |

Full list: [Bug Register](./04-BUG-REGISTER.md).

---

## 6. File map (where to change what)

| Concern | File(s) |
|---|---|
| Design tokens / utilities | `src/app/globals.css` |
| Root metadata, fonts, theme bootstrap | `src/app/layout.tsx` |
| Customer shell | `src/app/(customer)/layout.tsx` |
| Header / nav / footer | `src/components/navigation/*`, `src/components/shared/BottomNav.tsx` |
| Product card / PDP | `src/components/shared/ProductCard.tsx`, `src/app/(customer)/products/[id]/*` |
| Cart / checkout | `src/app/(customer)/cart/page.tsx`, `checkout/page.tsx`, `src/components/cart/*`, `src/components/checkout/*` |
| Orders / tracking / returns | `src/app/(customer)/orders/*`, `tracking/*`, `returns/*` |
| Store / auth state | `src/store/useStore.ts`, `src/components/shared/AuthProvider.tsx`, `src/components/auth/*` |
| Auth APIs | `src/app/api/auth/*`, `src/lib/auth/jwt.ts`, `src/lib/api/auth-middleware.ts` |
| Payments | `src/app/api/orders/place/route.ts`, `src/app/api/payments/*`, `src/lib/razorpay*.ts` |
| Pricing / coupons | `src/lib/pricing.ts`, `src/app/api/coupons/*` |
| Catalogue reads | `src/lib/api/home.ts`, `products.server.ts`, `src/lib/catalog/sellable.ts` |
| Seller | `src/app/seller/*`, `src/components/seller/*`, `src/lib/api/sellers.ts` |
| Admin | `src/app/admin/*`, `src/components/admin/*`, `src/lib/admin-roles.ts` |
| DB | `dairydirect/database/supabase/migrations/*` |
| Audit docs | `docs/audit/*` |

---

## 7. Language and conventions

- **TypeScript strict**, path alias `@/*` → `src/*`. Avoid `any` (590 exist; don't add more).
- **Naming:** components PascalCase; hooks `use*`; API helpers `getX/updateX`; DB snake_case.
- **Comments:** explain *why*, especially when fixing a subtle bug. The codebase has a strong tradition of this — preserve it.
- **Money:** integer rupees in UI; Razorpay in paise; server recomputes. Format `en-IN`.
- **Dates:** `date-fns`; display `Tue, 25 Nov`; timestamps in IST.
- **Copy:** Indian English, warm, specific, no exclamation marks, no infrastructure terms.
- **Design:** 8pt spacing, 12px minimum text, 44px targets, one primary CTA, hairline borders.
- **Errors:** typed result objects; toast/inline/recovery UI; structured logger; never `alert`.

---

## 8. Glossary

| Term | Meaning |
|---|---|
| **Partner brand / seller** | The single verified company per category |
| **Variant** | A pack size with its own price/stock (`product_variants`) |
| **Reservation** | A 10-minute inventory hold during checkout |
| **Slot** | A delivery window (e.g. 6:30–7:30 a.m.) |
| **Quality report** | Batch-level lab/freshness document |
| **Lifecycle** | Seller state machine (`pending_kyc → active → suspended …`) |
| **Modification report** | A seller request to change a subscription/order |
| **GS reference** | Human-readable id to use in support copy (to be introduced) |

---

## 9. Current priorities (next 10 working days)

1. Phase 0 security + payment + subscription decisions ([Roadmap](./07-ROADMAP.md#phase-0--stop-the-bleeding-2448-hours)).
2. Pincode/serviceability + delivery slots + recovery screen.
3. Remove PII from `localStorage`; add consent.
4. Apply Design System v2 tokens; rebuild customer shell, home, product card, cart, checkout.
5. Add timeouts, remove `alert`, strip framer-motion from cards.

**Do not** start a visual redesign before Phase 0 is signed off. **Do not** push to any remote unless the user explicitly asks; this workspace is intentionally local-only.

---

## 10. How to verify a change

```bash
npm run build            # must pass, TypeScript clean
npm test                 # vitest
npx tsc --noEmit         # if needed
```

Manual gates for any customer-facing change:

- 360×640, 390×844, 768×1024, 1440×900.
- Light and dark.
- Keyboard-only path; Escape closes overlays; focus visible.
- Long Gujarati string; 200% zoom.
- Network throttled to Slow 4G; kill the DB and confirm a degraded page, not a blank one.
- No `alert`, no raw error, no PII in `localStorage`.

---

## 11. Source-of-truth documents

| Question | Document |
|---|---|
| What is wrong and how bad? | [Executive Audit](./00-EXECUTIVE-AUDIT.md) |
| How is it built? | [Architecture](./01-ARCHITECTURE-AND-MODULES.md) |
| Why does it feel this way? | [UX Psychology](./02-UX-PSYCHOLOGY.md) |
| What breaks for real users? | [Scenarios](./03-SCENARIOS-AND-GLITCHES.md) |
| Exact defects + fixes | [Bug Register](./04-BUG-REGISTER.md) |
| Visual language | [Design System v2](./05-DESIGN-SYSTEM-V2.md) |
| Budgets + hardening | [Performance, Security & Resources](./06-PERFORMANCE-SECURITY-RESOURCES.md) |
| Order of work | [Roadmap](./07-ROADMAP.md) |

---

*Last verified: 20 Nov 2026 · Branch: `arena/38a97cb0-gjanandsarkar` · Local-only, nothing pushed.*


---

## 12. P0 implementation log — 20 Nov 2026

What actually changed, so the next agent does not re-fix it:

| Area | Change | Files |
|---|---|---|
| Demo admin login | `{type:'demo'}` session minting deleted; no seeded admin | `api/auth/sync/route.ts` |
| Hardcoded admins | `ADMIN_EMAILS`/`ADMIN_PHONES` are env-only, empty default | `api/auth/sync`, `api/auth-middleware` |
| OTP leak | `otp` only returned when `NODE_ENV !== 'production'`; `DEMO_MODE` removed | `api/auth/send-otp/route.ts` |
| Role inference | Client no longer promotes `@gjanandsarkar` emails to admin; role comes from `/api/auth/sync` | `LoginView.tsx`, `auth/callback/page.tsx`, `AuthProvider.tsx` |
| Open redirect | `safeRedirect()` / same-origin absolute-path check on `redirect` & `next` | `LoginView.tsx`, `auth/callback/page.tsx` |
| PII in localStorage | Persist only `language`, `cart`, `wishlist`; identity restored from `GET /api/auth/session` | `store/useStore.ts`, `AuthProvider.tsx` |
| Payment method | Default `razorpay`; Direct-UPI option removed (server never accepted it); checkout clamps to `razorpay`/`cod` | `PaymentSelection.tsx`, `checkout/page.tsx`, `order-confirmed/[id]` |
| RLS exposure | `anon` revoked on 19 personal tables; `profiles` readable only by self/admin; no anonymous order inserts; default privileges revoked | `database/supabase/migrations/20261120_security_hardening.sql` |
| Unbounded awaits | `withTimeout` around catalogue, settings, coupons, subscription reads (3 s page budget) | `lib/utils/timeout.ts`, `lib/api/{home,products.server,settings,coupons.server}.ts` |
| CSRF | Edge origin/`Sec-Fetch-Site` gate on mutating `/api/*`; no-Origin (webhooks, native app) allowed | `middleware.ts`, `lib/security/same-origin.ts` |
| IDOR | Every subscription action verifies `user_id` (previously only `cancel` did) | `api/subscriptions/route.ts` |
| Offers page | Removed HTTP self-fetch; direct table read | `lib/api/coupons.server.ts`, `offers/page.tsx` |

### Subscription surface (new)

| Piece | Location | Notes |
|---|---|---|
| Hub | `/subscribe` → `components/subscribe/SubscriptionHub.tsx` | Active/paused plans, snapshot stats, 7-day timeline, skip/pause/resume/cancel with inline confirm |
| Builder | `/subscribe/new` → `components/subscribe/PlanBuilder.tsx` | 4 steps, sticky desktop summary, mobile action bar, success screen |
| Cadence maths | `lib/subscriptions/schedule.ts` | `daily` 1 d, `alternate` 2 d, `weekly` 7 d; 9 PM IST cutoff pushes the first delivery by a day |
| Server reads | `lib/subscriptions/server.ts` | Scoped to JWT `userId`; service role; timeouts |
| API | `GET/POST/PUT /api/subscriptions` | `PUT action ∈ {pause, resume, skip, cancel, modify}`; returns the patched `next_delivery_date` |
| Middleware | `middleware.ts` | `/subscribe*` redirects unauthenticated users before render |

**Known consequence:** browser Supabase Realtime on `orders` used the `anon` role with `auth.uid()` null, so it returned nothing even before the RLS change. Order tracking must move to RSC polling (`revalidateTag`) or a signed server channel; do not "fix" it by re-granting `anon`.

**Still open after this pass:** server-side rate limiting on vendor mutations, per-route CSRF tests, `: any` (590) removal, subscription discounts (none yet — pricing is per-delivery list price), and the admin/seller IA work from `07-ROADMAP.md`.
