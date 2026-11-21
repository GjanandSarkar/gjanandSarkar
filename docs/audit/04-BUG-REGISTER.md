# 04 — Bug Register

**64 findings.** Ordered by severity, then by user impact. Every item has a location, an impact and a concrete fix. Nothing here is theoretical unless marked **verify with data**.

**Severity:** `P0` launch blocker · `P1` fix before marketing · `P2` craft/polish · `P3` internal quality.

**Quick index**

| P0 | P1 | P2 | P3 |
|---|---|---|---|
| [F-01](#f-01) · [F-02](#f-02) · [F-03](#f-03) · [F-04](#f-04) | [F-05](#f-05) – [F-12](#f-12), [F-19](#f-19), [F-20](#f-20), [F-24](#f-24), [F-30](#f-30), [F-31](#f-31), [F-34](#f-34), [F-36](#f-36), [F-41](#f-41), [F-42](#f-42), [F-44](#f-44), [F-45](#f-45), [F-48](#f-48), [F-52](#f-52), [F-55](#f-55) | [F-13](#f-13) – [F-18](#f-18), [F-21](#f-21) – [F-23](#f-23), [F-25](#f-25) – [F-29](#f-29), [F-32](#f-32), [F-33](#f-33), [F-35](#f-35), [F-37](#f-37) – [F-40](#f-40), [F-43](#f-43), [F-46](#f-46), [F-47](#f-47), [F-49](#f-49) – [F-51](#f-51), [F-53](#f-53), [F-54](#f-54), [F-56](#f-56) – [F-60](#f-60) | [F-61](#f-61) – [F-64](#f-64) |

---

## P0 — Launch blockers

<a id="f-01"></a>
### F-01 — Anyone can mint an admin session
**Security · critical · confirmed by code + runtime probe**

`app/api/auth/sync/route.ts:36–89` accepts `{ "type": "demo", "role": "admin" }`, signs a JWT with `role: "admin"`, and sets it as the `gs_access_token` HttpOnly cookie. `components/auth/LoginView.tsx:141–206, 435–444` exposes this as a public **"Instant Access → Super Admin"** button on `/login` and `/auth/login`. In the local probe the endpoint reached the signing step and only failed because `JWT_SECRET` is unset; any real deployment with a secret issues a valid admin token.

**Impact:** full platform takeover — customer PII, orders, refunds, payouts, catalogue, settings. Also destroys investor/customer trust in any live demo.

**Fix:** remove the demo branch and the UI entirely. If a demo is required, gate it on `process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEMO === 'true'`, restrict to a read-only sandbox dataset, add a visible "DEMO" watermark, and never issue a role higher than `customer`. Add a CI grep that fails if `type === 'demo'` exists in `src/app/api`.

---

<a id="f-02"></a>
### F-02 — Every customer's personal data is world-readable
**Security · critical · confirmed by SQL + grants**

`database/supabase/migrations/003_functions_rls_storage.sql:263–264`:
```sql
CREATE POLICY "Profiles: public read" ON profiles FOR SELECT USING (true);
```
and line 415 grants `ALL` on all tables to `anon`. Combined, the public anon key (shipped to every browser) can enumerate `profiles`: name, phone, email, address, role, loyalty points, referral code, default UPI id. `orders` also allows anonymous inserts (`line 331: auth.uid() = user_id OR auth.uid() IS NULL`).

**Impact:** a complete customer database leak, trivially scriptable; DPDP Act 2023 security-safeguard failure; competitive and harassment risk. This is worse than the admin bypass because it needs no login at all.

**Fix:**
```sql
DROP POLICY "Profiles: public read" ON profiles;
CREATE POLICY "Profiles: own read" ON profiles
  FOR SELECT USING (auth.uid() = id OR is_admin(auth.uid()));
REVOKE ALL ON profiles FROM anon;
GRANT SELECT (id, name, avatar_url) ON profiles TO anon; -- only if a public seller page needs it
DROP POLICY "Orders: own insert" ON orders;
CREATE POLICY "Orders: own insert" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```
Then audit every `GRANT ALL ... TO anon` and every `USING (true)` policy. Add a migration test that fails if any policy on a PII table is `USING (true)`.

---

<a id="f-03"></a>
### F-03 — The default payment method is rejected by the server
**Commerce · critical · confirmed by code**

`store/useStore.ts:242` defaults `checkoutPaymentMethod` to `'upi'`. `components/checkout/PaymentSelection.tsx:29` renders "Direct UPI ID". `components/checkout/CheckoutScreen` collects a VPA and calls `placeOrder` with `paymentMethod: 'upi'`. `app/api/orders/place/route.ts:80` returns HTTP 400 for that value. `order-confirmed` also resets the method to `'upi'` (`app/(customer)/order-confirmed/[id]/page.tsx:27`).

**Impact:** the most common first-order path fails after the customer has chosen an address and entered payment details. Direct conversion loss on every new customer.

**Fix:** remove the `upi` option and the `upiId` state; default to `razorpay`; map any persisted `'upi'` to `'razorpay'`; add an integration test asserting every rendered method is accepted by `PlaceOrderSchema` and the route.

---

<a id="f-04"></a>
### F-04 — The subscription module does not exist
**Product · critical · confirmed by code**

`app/(customer)/subscribe/page.tsx` and `subscribe/new/page.tsx` are client components whose only effect is `router.replace('/home')`. Yet `SubscriptionUpsellBanner` links to `/subscribe/new`, `SubscriptionCard` links to `/subscribe/new?edit=…`, profile and notifications link to `/subscribe`, and `/admin/subscriptions` exists.

**Impact:** an advertised core pillar is a dead end; dairy retention engine missing; admin screen operates data customers cannot create.

**Fix:** ship a 4-step builder (product → schedule → address → payment) or remove every entry point until it ships. Do not leave the redirects live with marketing banners.

---

## P1 — Fix before spending on growth

<a id="f-05"></a>
### F-05 — Role is inferred from an email substring
**Security · high · confirmed**

`components/auth/LoginView.tsx:83` and `app/auth/callback/page.tsx:77` treat any email containing `"admin"` (or two hardcoded addresses) as an administrator in client state. Server APIs still check the DB role, so this is not a full bypass — but it grants the admin shell, confuses users, and is one careless API away from privilege escalation. Hardcoded personal emails are also a privacy and bus-factor problem.

**Fix:** never infer roles client-side. Read `profile.role` from `/api/auth/sync` and nothing else. Remove hardcoded emails; bootstrap admins via `ADMIN_EMAILS` server-side only.

<a id="f-06"></a>
### F-06 — No pincode or serviceability check; the FAQ says there is one
**Product · high**

`app/(customer)/faq/page.tsx:48` promises "Enter your pincode at checkout to see the delivery window and charges." Checkout has no pincode field and no serviceability API. Addresses have `pincode` in some paths but it is not used for eligibility.

**Impact:** orders accepted outside the delivery area; angry calls; refunds; broken promise in a trust document.

**Fix:** `GET /api/serviceability?pincode=` backed by a `serviceable_pincodes` table (pincode, city, slots, cutoff, fee). Gate "Add to cart"/checkout on a serviceable address. Capture pincode in the header ("Deliver to 380015") before login.

<a id="f-07"></a>
### F-07 — Admins and sellers cannot use the storefront
**Product · high**

`components/auth/AuthGuard.tsx:39–64` redirects any `admin` to `/admin` and any `seller` to `/seller/dashboard` from every non-module route.

**Impact:** staff cannot test the customer journey, demo it, or reproduce a bug; sellers (who are also customers) are locked out of shopping; support cannot verify an order visually.

**Fix:** remove the role partitioning. Authorization belongs on admin/seller *routes* (already enforced), not on the customer storefront. Add a role switcher in the account menu ("View storefront", "Seller hub", "Admin").

<a id="f-08"></a>
### F-08 — Server render blocks on network calls with no timeout
**Reliability · high · measured**

With the origin unavailable, `/products` returned in **7.32 s** and `/offers` in **7.12 s**; `/home` was cached at 12 ms. Server components and API helpers call Supabase/RDS/ImageKit directly with no `AbortSignal` or timeout. The homepage catches errors; several dynamic routes do not degrade.

**Impact:** one slow dependency turns into a blank page and a failed Core Web Vital. On 4G, the customer leaves before the first byte of content.

**Fix:** a shared `withTimeout(promise, 3000)` helper; `AbortSignal.timeout` on every fetch; per-route `error.tsx` and `loading.tsx`; serve a cached/stale shell with a retry banner instead of waiting.

<a id="f-09"></a>
### F-09 — Five admin screens are unreachable; two order lists compete
**Information architecture · high**

`admin/layout.tsx` + `AdminSidebar.tsx` link 16 of 23 routes. Missing: `/admin/inventory`, `/admin/settings`, `/admin/subscriptions`, `/admin/reports`, `/admin/vendors`. `/admin/orders` filters to platform-owned products only; `/admin/seller-orders` is the other half. Labels are internal ("All Seller Orders List").

**Impact:** operators cannot find stock, settings or subscription ops; order lookup has a coin-flip failure rate during peak.

**Fix:** one orders screen with an owner filter (`All / Platform / Seller`); group the sidebar into Overview · Catalogue · Fulfilment · Growth · People · Settings; add a command palette; add route/link coverage to CI.

<a id="f-10"></a>
### F-10 — Identity is persisted in `localStorage`
**Privacy · high**

`store/useStore.ts:246–254` persists `user` (name, phone, email, addresses, role, loyalty) and `sellerStore` to `localStorage` under `gjanand-sarkar-storage`.

**Impact:** shared-device leakage, XSS-readable PII, stale roles after admin changes, DPDP exposure.

**Fix:** persist only `language`, guest `cart` and guest `wishlist`. Rehydrate identity from `/api/auth/session` into memory; clear on logout *and* on `visibilitychange` after inactivity. Provide a "not you? sign out" affordance.

<a id="f-11"></a>
### F-11 — Native `alert()` and 398 raw console calls
**Craft / reliability · high**

`alert()` appears 22 times (checkout alone has 6), e.g. `checkout/page.tsx:146,152,156,251,260,317,321`; `console.*` appears 398 times, including PII-adjacent order details and raw errors.

**Impact:** destroys the premium illusion at the worst moments; no structured telemetry; potential PII in logs.

**Fix:** a `Toast` + `InlineError` + `RecoveryScreen` system; a `logger` wrapper that redacts and forwards to Sentry; ban `alert`/`console` via ESLint in `src/app` and `src/components`.

<a id="f-12"></a>
### F-12 — No installable app, despite "app later"
**Platform · high**

There is no `manifest.webmanifest`, no 192/512/maskable icons, no service worker/offline shell, no install prompt, no app shortcuts. `appleWebApp.capable` is set, but iOS needs an Apple touch icon and a manifest for Android.

**Impact:** "website now, app later" has no bridge; no home-screen icon, no fast repeat visits, no offline resilience.

**Fix:** `app/manifest.ts` with name, colours, icons (SVG + 192/512 + maskable), shortcuts (`/search`, `/cart`, `/orders`); a minimal service worker (precache shell + offline page); capture `beforeinstallprompt` and offer install after the second order.

<a id="f-13"></a>
### F-13 — The home screen has no promise
**UX · high**

`HeroBanner` exists but is not mounted in `app/(customer)/home/page.tsx`. The first screen is a category rail, a trust bar and product rails. The tagline lives only in metadata.

**Impact:** a first-time visitor cannot answer "what is this, why trust it, when will it arrive" in five seconds.

**Fix:** mount a compact hero: one promise, one proof, pincode + delivery window, one primary CTA, one product/quality image. Keep it under 40% of the mobile viewport.

<a id="f-14"></a>
### F-14 — Cart is missing from the bottom navigation
**UX · high**

`components/shared/BottomNav.tsx` has Home / Categories / Search / Account. Cart appears in the header only when `totalItems > 0`.

**Impact:** users cannot find their basket; contradicts every Indian commerce app they know.

**Fix:** four or five slots: Home · Categories · **Cart (badge)** · Orders · Account. Keep search in the sticky header. Mirror the badge in the header on desktop.

<a id="f-19"></a>
### F-19 — Language is a permanent three-button pill
**UX · high**

`Header.tsx:239–261` renders `EN / हि / ગુ` on every page, next to theme, address, cart and profile. Translation coverage is partial and DB-backed.

**Impact:** header clutter on 360px; signals "demo settings"; language choice is not persisted server-side.

**Fix:** move to Account → Language; auto-detect on first visit; one-time dismissible prompt; persist to `profiles.language`; human-review the Gujarati/Hindi strings.

<a id="f-20"></a>
### F-20 — No delivery slot selection; ETA is hardcoded
**Commerce · high**

`components/cart/OrderSummary.tsx:102` always renders `t('tomorrowDelivery')` = "Tomorrow, 7:00 – 9:00 AM". `delivery_slots` and `deliverySlot` exist in the schema and admin views, but checkout never asks. Cutoff times live in `business_settings` and are unused in the UI.

**Impact:** false promise, missed cutoffs, support load, no ability to plan routes.

**Fix:** slot picker at checkout driven by pincode + cutoff + capacity; show "Order in 42 min for tomorrow's first slot"; store `delivery_slot` on the order; show it on confirmation and tracking.

<a id="f-24"></a>
### F-24 — No recovery path after a paid-but-unconfirmed order
**Commerce · high**

`checkout/page.tsx:251` shows an `alert()` containing a raw `pay_…` id and tells the customer to contact support. There is no page that reconciles the payment, completes the order, or issues an automatic refund.

**Impact:** chargebacks, panic, 1-star reviews, manual support cost.

**Fix:** `/checkout/recovery?ref=` screen with server-side lookup, "Complete order" / "Refund now", human handoff, and a human-readable reference. Automate reconciliation in the payment webhook.

<a id="f-30"></a>
### F-30 — Text too small and error contrast too low
**Accessibility · high · measured**

10px labels in 8 files (seller layout/sidebar, admin products/quality, recent orders, quality report). Error chip `#DC2626` on `#FEE2E2` measures **3.95:1**, below WCAG AA 4.5:1 for normal text.

**Impact:** older customers and low-vision users cannot read status or errors; accessibility failure.

**Fix:** 12px minimum for meta, 14px body, 16px inputs; darken error to `#B91C1C` on `#FEE2E2` (≥ 5.9:1) or use a border + icon; add a text-size preference.

<a id="f-31"></a>
### F-31 — No consent, notice or data controls
**Compliance · high**

No itemised consent at sign-up, no purpose toggles, no consent record, no download/delete account path, privacy policy is static.

**Impact:** DPDP Act 2023 non-compliance; penalties up to ₹250 crore for safeguard failures ([Consent.in](https://www.consent.in/blog/dpdp-act)).

**Fix:** a consent screen with separate, unticked toggles (fulfilment, personalisation, marketing, analytics), stored with timestamp/version; Account → Privacy (download, delete, withdraw); grievance officer contact and 48-hour acknowledgement.

<a id="f-34"></a>
### F-34 — Sellers have analytics, not an operations brief
**Seller UX · high**

`seller/dashboard` opens on a generic overview with charts. At 5 a.m. a dairy seller needs today's litres, orders by slot, stock-outs and returns.

**Impact:** the person who fulfils the promise cannot see what to do first; errors happen at dawn.

**Fix:** "Today" tab as default: volume, order count by slot, pack list (printable), stock alerts, returns to collect, payout status, one primary action.

<a id="f-36"></a>
### F-36 — Admin is desktop-shaped on mobile
**Admin UX · high**

Dense tables with horizontal scroll, 10px text, hover-only actions, chart-first dashboard (`admin/page.tsx`). The requirement is that admin *works* on a phone in an emergency.

**Impact:** the ops lead cannot manage a rush from the floor.

**Fix:** responsive table → card list under `md`; sticky filter bar; bottom-sheet row actions; exception-first dashboard; 44px targets; test at 360×640.

<a id="f-41"></a>
### F-41 — Dropdowns lack menu semantics and keyboard behaviour
**Accessibility · high**

`Header.tsx` profile/address menus open on hover and click, but have no `aria-expanded`, `aria-haspopup`, `role="menu"`, Escape handling or focus management. Outside-click closes them; keyboard users can tab into invisible content.

**Impact:** unusable with a keyboard or screen reader; WCAG 2.1.1 / 2.4.3 failures.

**Fix:** use the existing Radix primitives (`@radix-ui/react-dropdown-menu` is already a dependency) instead of bespoke divs.

<a id="f-42"></a>
### F-42 — Payment methods are not radio buttons
**Accessibility · high**

`PaymentSelection.tsx:44` uses clickable `<div>`s with no role, tabindex, name or arrow-key behaviour.

**Impact:** screen-reader and keyboard users cannot select a method; form is not announced.

**Fix:** `@radix-ui/react-radio-group` (already installed) with labelled items and a visible focus ring.

<a id="f-44"></a>
### F-44 — The logo is a 263 KB PNG used as an `<img>`
**Performance · high**

`public/application logo/gjanand sarkar logo.png` is 263 KB, rendered at 48–56px with no width/height, preloaded as an image, and used as the favicon and Apple icon. The path contains spaces, so it is percent-encoded inconsistently (`next.config` metadata uses `%20`, JSX uses raw spaces).

**Impact:** LCP competitor, wasted bandwidth on every page, CLS from missing dimensions, broken icon risk on some CDNs.

**Fix:** export an SVG mark + a 512 PNG + Apple 180 icon into `/public/brand/` with kebab-case names; use `next/image` with explicit dimensions for the raster fallback; remove the raw-space path.

<a id="f-45"></a>
### F-45 — Production CSP allows `unsafe-eval`
**Security · high**

`next.config.ts:102` ships `script-src 'self' 'unsafe-inline' 'unsafe-eval' …` in production. `unsafe-inline` is needed by Next inline bootstrap; `unsafe-eval` generally is not.

**Impact:** any injection becomes code execution; weakens the otherwise good security posture.

**Fix:** remove `unsafe-eval` and verify Razorpay/maplibre still work; adopt a nonce-based CSP via middleware for `script-src`; keep a report-only phase first. Add `Cross-Origin-Opener-Policy`, `X-DNS-Prefetch-Control`.

<a id="f-48"></a>
### F-48 — 1.07 MB of raw JavaScript and 45 framer-motion imports
**Performance · high · measured**

Home ships **19 chunks / 1,075 KB raw**. `framer-motion` is imported in 45 files, including `ProductCard`, where a CSS transition would suffice; the home page also mounts support chat, cart drawer and recommendation rails before interaction.

**Impact:** slow first load on mid-range Android, high INP, battery cost.

**Fix:** budget ≤ 250 KB gzipped initial JS; replace card/section entrance animations with the existing CSS `.reveal`/`.pressable` utilities; keep framer-motion for sheets/modals only; dynamically import the support chat on first open; audit `lucide-react` imports.

<a id="f-52"></a>
### F-52 — The admin shell is a client-side gate; middleware trusts an unverified token
**Security · high**

`admin/layout.tsx` gates on Zustand. `middleware.ts` decodes the JWT payload without verifying the signature (documented as intentional). API routes do verify — so data is protected — but the shell and route structure are not a boundary, and any client-state bug reveals the console.

**Impact:** defence-in-depth failure; a single API mistake becomes full exposure; confusing redirects.

**Fix:** verify the JWT in middleware with a Web Crypto HMAC check (or call `/api/auth/session` at the edge for admin routes); derive role server-side in a layout Server Component; treat the client gate as UX only.

<a id="f-55"></a>
### F-55 — Six test files for 74 API routes
**Reliability · high**

`tests/` contains 6 files (cancel order, cart merge, COD, security phase 1, sellable, lighthouse notes). Order placement, payment verification, RLS, pricing and subscription lifecycle have no automated coverage.

**Impact:** the most dangerous code is the least tested; refactors are risky; regressions like F-03 ship.

**Fix:** Vitest unit tests for pricing/coupons/cancel rules; integration tests for `/api/orders/place` (each payment method), webhook signature, RLS policies (pgTAP or a seeded Supabase test project); Playwright for the 5 critical journeys once a browser is available in CI.

---

## P2 — Craft and polish

<a id="f-15"></a>
### F-15 — Reorder is not first-class
`BuyAgainCarousel` exists but is not the first rail for returning users. Persist preferred quantity per variant; add "Repeat last order" to the home header and order confirmation.

<a id="f-16"></a>
### F-16 — Search has no suggestions, recents or empty state
Search submits to `/search?search=`; no debounce/suggest endpoint, no recent searches, no popular products, no typo tolerance in the UI (FTS exists server-side). Add `/api/search/suggest` with trigram, recent searches in `localStorage` (non-PII), and a designed empty query screen.

<a id="f-17"></a>
### F-17 — Empty catalogue has no designed state
With no sellable products, rails render empty or nothing. Add a launch-aware state: "Our dairy partner's first batch arrives Friday" + notify-me capture, instead of an empty shop.

<a id="f-18"></a>
### F-18 — The best trust content is switched off
`qualityReports: false`, `rewards: false`, `heritageBanner: false`, `whyGjanandSarkar: false`. The quality report component is built but not visible; rewards are shown in profile while the flag is off. Ship the quality report (it is the differentiator) and either ship or remove rewards.

<a id="f-21"></a>
### F-21 — No saved payment or one-tap checkout
Every order opens the Razorpay modal. Add saved UPI intent/cards via Razorpay, and a "Pay with saved method" path for returning customers. Target < 30 s reorder-to-pay.

<a id="f-22"></a>
### F-22 — Subscription notification routes to a dead page
`NotificationPanel.tsx:85` and `notifications/page.tsx:75` route subscription notifications to `/subscribe` (redirects home). Fix with F-04.

<a id="f-23"></a>
### F-23 — UPI ID validation is cosmetic
`checkout/page.tsx:152–157` only checks for `@`. If direct UPI is retained, validate the VPA server-side and never mark it paid without a verified collect request. (Recommended: remove it — see F-03.)

<a id="f-25"></a>
### F-25 — Refund paths are fragmented
`lib/refund-helper.ts`, `lib/refunds.ts`, `lib/razorpay-refund.ts`, `/api/cron/refund-reconcile` and admin actions overlap. Consolidate into one idempotent `refundOrder(orderId, reason, actor)` service with a single state machine and an audit entry.

<a id="f-26"></a>
### F-26 — COD has no rules
No COD limit, fee, pincode restriction or OTP. Add eligibility rules in `business_settings`, show them before selection, and a delivery OTP for high-value COD.

<a id="f-27"></a>
### F-27 — No rider/assignment model
Orders have statuses but no rider entity, assignment, ETA or proof of delivery. Add `delivery_agents`, `delivery_assignments`, `delivered_at`, `proof_photo`, and surface rider name/ETA to the customer.

<a id="f-28"></a>
### F-28 — Returns are hard to find at the moment of disappointment
Returns are a separate route linked from order details. Add "Problem with this order?" on the order card, tracking page and confirmation email, and pre-fill the item.

<a id="f-29"></a>
### F-29 — Return SLA is invisible
Statuses exist but no promised date. Show "Replacement tomorrow 7 a.m." or "Refund by Fri 22 Nov" on creation, with a 4-step tracker.

<a id="f-32"></a>
### F-32 — Seller onboarding is a form, not a journey
No save-and-resume, document checklist, SLA, or "what happens next". Build a 5-step wizard with progress and notifications; then a go-live checklist.

<a id="f-33"></a>
### F-33 — KYC and compliance fields are thin
GSTIN/PAN exist; FSSAI licence, bank verification, address proof and expiry are not modelled. Add a `seller_documents` table with type, number, expiry, file, verification status.

<a id="f-35"></a>
### F-35 — Seller navigation is triplicated
Desktop sidebar + mobile header + 7-pill nav + in-page tabs. One nav config, one mobile pattern (bottom nav or segmented tabs), routes instead of query-param tabs.

<a id="f-37"></a>
### F-37 — No global admin search or command palette
Finding an order/customer/product requires navigating a screen first. Add `⌘K` with server search across order number, phone, customer name, product, seller; recent items; keyboard-first.

<a id="f-38"></a>
### F-38 — No money reconciliation screen
No single view of collected/settled/refunded/COD pending/unmatched. Build a Money screen with daily totals, gateway ids, mismatch flags and CSV export.

<a id="f-39"></a>
### F-39 — Admin permissions are decorative
`lib/admin-roles.ts` defines four personas and permissions; nothing consults them. Either implement route/action checks (recommended) or delete the file to avoid a false sense of safety.

<a id="f-40"></a>
### F-40 — Launch flags are ignored at the render boundary
`SECTIONS.circularCategories === false` but `HomeScreen` renders `<CircularCategories/>`. `DAIRY_ONLY = true` while brand copy promises twelve categories. Make `isSectionEnabled` mandatory for gated sections, and align copy with live categories.

<a id="f-43"></a>
### F-43 — Missing skip link and live regions
No skip-to-content link; cart count changes, add-to-cart, and status updates are not announced. Add `aria-live="polite"` regions and a skip link as the first focusable element.

<a id="f-46"></a>
### F-46 — Rate limiting degrades silently in production
`lib/aws/redis.ts` falls back to an in-memory map when `REDIS_URL` is missing ("rate limits are NOT shared across instances"). On serverless this means per-instance limits and OTP brute-force exposure.

**Fix:** fail closed for OTP/payment routes in production if Redis is unavailable; alert on fallback; use Upstash REST for edge.

<a id="f-47"></a>
### F-47 — Hardcoded Supabase project hosts
`next.config.ts:40,45` and the CSP allow-list hardcode two project refs. Preview/staging/production on different projects will silently break images and connections.

**Fix:** derive the host from `NEXT_PUBLIC_SUPABASE_URL` at config time; allow `*.supabase.co/storage/v1/object/public/**` for images only.

<a id="f-49"></a>
### F-49 — The HTML payload is 80 KB with an empty catalogue
Nineteen script tags, inline JSON-LD, theme bootstrap and preloads. Add `experimental.optimizePackageImports` for more packages; avoid preloading below-the-fold components; measure RSC payload with `next build --profile`.

<a id="f-50"></a>
### F-50 — Asset path contains spaces
`/application logo/gjanand sarkar logo.png` appears in metadata, favicon and multiple `<img>` tags. Rename to `/brand/gjanand-sarkar.svg` and update all references; add a build-time check for spaces in public paths.

<a id="f-51"></a>
### F-51 — Two login routes and mismatched redirect parameters
`/login` and `/auth/login` render the same view. Middleware redirects to `/login?redirect=…`; `AuthGuard` redirects to `/auth/login?redirect=…`. Both read `redirect`/`next`, but the inconsistency creates double hops and dead ends.

**Fix:** one canonical `/login` with a permanent redirect from `/auth/login`; one redirect-parameter contract; validate that the target is a relative in-app path (open-redirect protection).

<a id="f-53"></a>
### F-53 — Admin screens query Supabase from the browser
`admin/delivery/page.tsx:18` selects orders, profiles and items directly with the anon client. This depends on a Supabase session that the custom-cookie auth may not establish, and on RLS.

**Fix:** move to `/api/admin/deliveries` with `requireAdmin`; never query PII tables from the client, even with RLS.

<a id="f-54"></a>
### F-54 — `TopBar` blocks every page on a settings query
`components/navigation/TopBar.tsx` is an async Server Component calling `getFreeDeliveryThreshold()`. If settings are slow, every page is slow, including static ones.

**Fix:** hardcode a safe default and revalidate the threshold in the background; or move it into the cached home feed/config with a 5-minute tag.

<a id="f-56"></a>
### F-56 — 1,699-line seller dashboard
One component owns ten tabs, six modals, multiple fetches and all rendering. Extract to `features/seller/{overview,products,inventory,orders,returns,quality,analytics}` with one hook per feature; convert tabs to routes.

<a id="f-57"></a>
### F-57 — Documentation contradicts the code
`DESIGN_SYSTEM.md` colours, `STRUCTURE.md` backend folder, README "production-ready", and multiple phase docs describe removed behaviour. Add a `docs/README` with "last verified" dates, and delete or archive stale files.

<a id="f-58"></a>
### F-58 — Two token systems live side by side
Legacy aliases (`bg-cream` 8, `border-sand` 84, `text-dark` 86, `text-muted` 106, `bg-mint` 19, `bg-sand` 56) coexist with `surface`/`foreground` tokens. Dark mode inherits inconsistencies.

**Fix:** codemod legacy → core tokens; then delete aliases; add a stylelint rule banning raw hex in TSX.

<a id="f-59"></a>
### F-59 — 516 arbitrary Tailwind values
311 `text-[…px]` and 205 `rounded-[…px]` usages. This is why the UI feels subtly uneven: every screen invents its own scale.

**Fix:** define the scale in `@theme` (type, radius, spacing, shadow) and replace arbitrary values; add an ESLint rule that warns on `text-[`/`rounded-[` in `components/`.

<a id="f-60"></a>
### F-60 — Misleading or unverified claims
Hardcoded ETA (F-20); "100% Made in India" and "One verified brand per category" with one dairy partner; "100% Secure & Encrypted" on login; quality promise with no published reports. Keep claims true at launch scale or soften them.

---

## P3 — Internal quality

<a id="f-61"></a>
### F-61 — Type escapes hide API drift
590 `any`/`as any` occurrences. The Supabase database types are not generated. Generate `database.types.ts`, type every API response, and ban new `any` in `src/app`/`src/lib`.

<a id="f-62"></a>
### F-62 — No structured logging or request ids
398 raw console calls, no correlation id, no redaction. Add a logger with `requestId`, route, userId (hashed), latency, outcome; ship to Sentry/Logtail; alert on 5xx and payment failures.

<a id="f-63"></a>
### F-63 — No CI quality gates for the product
The repo has GitHub Actions for build/deploy, but no bundle-size budget, no Lighthouse CI, no link crawler, no `alert()` ban, no migration-policy test. Add them; they would have caught F-03 and F-04.

<a id="f-64"></a>
### F-64 — No analytics contract
Events exist (`Analytics.trackEvent`, `product_events`) but no schema, no funnel definition, no consent gating. Define 12 canonical events with properties and document them; gate on analytics consent.

---

## Fix sequence (dependency-aware)

```
Day 0–1   F-01 → F-02 → F-03 → F-04        (security + money + dead promise)
Day 2–3   F-05, F-06, F-07, F-10, F-31     (identity, serviceability, privacy)
Week 1    F-08, F-11, F-20, F-24, F-46     (reliability + recovery)
Week 2    F-13, F-14, F-19, F-30, F-41,42  (customer shell + a11y)
Week 3    F-44, F-45, F-48, F-49, F-50     (performance + security headers)
Week 4    F-09, F-34, F-36, F-37, F-53     (seller/admin workspaces)
Week 5    F-12, F-25, F-26, F-27, F-28,29  (PWA + operations)
Week 6    F-55, F-59, F-61, F-62, F-63     (quality system)
```

---

*Next: [Design System v2](./05-DESIGN-SYSTEM-V2.md) — the visual language that makes the fixed product feel expensive.*
