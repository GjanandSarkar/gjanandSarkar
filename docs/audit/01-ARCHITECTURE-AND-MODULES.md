# 01 — Architecture & Modules

A factual map of what exists, how the three modules are actually wired, and where the seams are. Read this before changing anything.

---

## 1. System overview

```
Browser (phone / desktop / future PWA)
│
│  ── HTML + RSC payload ────────────────  Next.js 16 App Router (Node runtime)
│  ── /api/* fetch (cookies) ────────────  Route handlers (74)
│  ── Supabase Realtime (wss) ───────────  inventory, notifications, orders
▼
┌─────────────────────────────────────────────────────────────────────┐
│  Next.js server                                                      │
│                                                                     │
│  Server Components        Client Components        Route handlers   │
│  ├ home feed (cached)     ├ cart / checkout        ├ auth (JWT+OTP)  │
│  ├ product / category     ├ admin & seller screens ├ orders / stock  │
│  ├ metadata / SEO         ├ search / filters       ├ payments / hooks│
│  └ TopBar settings        └ realtime hooks         └ admin / seller   │
│                                                                     │
│  lib/api/*  ── server data access (service role) + browser helpers   │
│  lib/aws/*  ── RDS (pg), Redis (ioredis), S3, SES, SNS               │
│  lib/auth/* ── custom JWT (gs_access_token, gs_refresh_token)        │
└───────────────┬──────────────────────────┬──────────────────────────┘
                │                          │
        ┌───────▼────────┐        ┌────────▼─────────┐
        │ Supabase       │        │ Redis / Upstash  │
        │ Postgres + RLS │        │ cache, OTP, rate │
        │ Auth, Storage  │        │ limit, sessions  │
        │ Realtime       │        └──────────────────┘
        └───────┬────────┘
                │
        ┌───────▼────────┐   ┌──────────────┐   ┌──────────────┐
        │ Razorpay       │   │ ImageKit CDN │   │ Sentry       │
        │ orders/webhook │   │ product img  │   │ errors       │
        └────────────────┘   └──────────────┘   └──────────────┘
```

**Two identity systems coexist.** Supabase Auth (Google OAuth, email/password) creates the Supabase session; `/api/auth/sync` then mints a *custom* JWT in `gs_access_token` (HttpOnly) which is what the API routes and middleware actually trust. Phone OTP uses Redis + RDS/Supabase directly, bypassing Supabase Auth. This dual model is the root cause of several inconsistencies (see §7).

**Two data-access paths coexist.** Server components and API routes use `getAdminSupabase()` (service role, bypasses RLS). Several client screens (`/admin/delivery`, some inventory views) call `supabase.from(...)` directly from the browser, relying on RLS and a Supabase session that may not match the custom session.

---

## 2. Repository shape

```
gjanandSarkar/
├── ARCHITECTURE.md, DEPLOYMENT.md, LOCAL_SETUP.md, README.md
├── dairydirect/
│   ├── frontend/                 ← the only running application
│   │   ├── src/app/              ← 64 pages, 74 API routes
│   │   ├── src/components/       ← 112 components (admin, seller, cart, checkout…)
│   │   ├── src/lib/              ← api, auth, aws, pricing, recommendations, security
│   │   ├── src/store/useStore.ts ← Zustand + localStorage persistence
│   │   ├── middleware.ts         ← edge route guard (unverified JWT decode)
│   │   └── next.config.ts        ← CSP, headers, image domains, Sentry
│   ├── database/
│   │   ├── supabase/migrations/   ← 38 SQL migrations, 44 tables
│   │   ├── supabase/functions/    ← send-otp / verify-otp edge functions
│   │   └── rds/                   ← legacy RDS schema + migration script
│   └── docs/                      ← 39 historical architecture docs (partly stale)
└── docs/audit/                    ← this audit
```

**Stale documentation warning:** `dairydirect/STRUCTURE.md` describes a `/backend` Express service that does not exist. `dairydirect/docs/DESIGN_SYSTEM.md` lists primary `#3f6530` and secondary `#8a5025`; the running tokens are `#0c3c26` and `#9c6819`. `README.md` claims "production-ready"; the audit disagrees. Treat `src/` as the source of truth.

---

## 3. Module 1 — Customer storefront

### Route map (39 pages)

| Group | Routes |
|---|---|
| **Discovery** | `/` (rewrite → `/home`), `/home`, `/categories/[category]`, `/products`, `/products/[id]`, `/search`, `/offers`, `/store/[sellerId]` |
| **Commerce** | `/cart`, `/checkout`, `/order-confirmed/[id]`, `/orders`, `/orders/[id]`, `/tracking/[id]`, `/returns`, `/returns/[id]` |
| **Account** | `/profile`, `/profile/saved-addresses`, `/profile/quality-reports`, `/wishlist`, `/notifications`, `/subscribe`*, `/subscribe/new`* |
| **Trust / content** | `/about`, `/faq`, `/contact`, `/support`, `/terms`, `/privacy`, `/become-seller` |
| **Auth / onboarding** | `/login`, `/auth/login`, `/auth/callback`, `/onboarding`, `/onboarding/address`, `/onboarding/profile`* |

`*` = redirects to `/home` (stub).

### Shell composition

`app/(customer)/layout.tsx` renders, in order:

1. `AuthGuard` (client redirects, role partitioning)
2. `TopBar` (server component; fetches free-delivery threshold from settings on every render)
3. `Header` (logo, search, seller link, language pill, theme toggle, address dropdown, cart, profile)
4. `CategoryNavBar` (second horizontal nav)
5. `<main>` capped at 1600px
6. `Footer`, `CartContainer` (floating bar + drawer), `BottomNav` (mobile), `SupportChat` (floating)

**That is seven persistent UI competitiors before the first product.** On a 390px phone the header alone consumes ~176px (announcement 32 + brand row 72 + search 52 + category strip 40), plus the bottom nav 64px. The effective shopping canvas is ~55% of the screen.

### Data flow: home

```
request /home
  → RSC HomeScreen (revalidate 300)
  → getHomeFeed()  [unstable_cache, tags: products, home-feed, 24 rows, explicit columns]
      → filterSellable()  (drops ₹0 / no-variant products)
  → <CircularCategories/>  (client: fetches /api/categories after hydration)
  → <TrustBar/>
  → <TrendingProducts/> <DealsAndBrands/> <LanguageTrustBadge/>
  → <RecommendationRail/> (client fetch)
  → <AdSlot/> (client fetch)
```

The important consequence: **the only product data in the first HTML is the server feed; categories and recommendations arrive after hydration**, causing the rails to pop in and shift the layout. Also `HomeScreen` renders `CircularCategories` unconditionally even though `SECTIONS.circularCategories === false` in `lib/config/launch.ts`.

### State model

`store/useStore.ts` (Zustand + `persist`):

- persisted: `user`, `sellerStore`, `language`, `cart`, `wishlist`
- transient: auth/cart/order loading flags, `checkoutAddressId`, `checkoutPaymentMethod` (default **`'upi'`**)
- `user` includes name, phone, email, avatar, role, loyalty points, saved addresses → all written to `localStorage` under `gjanand-sarkar-storage`.

Cart is a local mirror of `cart_items`, merged on login (`mergeCarts`, keeps higher quantity). This is the right pattern; the persistence of identity is not.

### Catalogue and search

`getProductsPage()` applies Postgres filtering, FTS (`textSearch`) with trigram fallback, sort and `LIMIT/OFFSET` (24 per page). `ProductsClient` filters additionally in the browser for some dimensions. `/search` is server-rendered with a 60 s CDN cache header. There is **no debounced suggest API** and no recent-search state.

### Checkout flow (as implemented)

```
cart (local) ──► /checkout
  ├─ GET addresses + all active products (client, parallel)
  ├─ POST /api/coupons/validate  → recompute pricing
  ├─ POST /api/inventory/reserve → 10-minute hold
  ├─ if razorpay: Razorpay SDK modal → /api/payments/razorpay/verify
  │     └─ onSuccess → /api/orders/place (5-step verification) → /order-confirmed
  ├─ if upi:      /api/orders/place → HTTP 400 "UPI must go through Razorpay"   ← dead path
  └─ if cod:      /api/orders/place → pending payment
```

Failure handling uses `alert()` for six different outcomes, including the dangerous "payment verified but order creation failed — contact support with your payment ID".

---

## 4. Module 2 — Seller hub

### Route map

| Route | Purpose | Notes |
|---|---|---|
| `/seller/dashboard` | 10 tabs: overview, profile, products, rejections, inventory, orders, returns, quality-reports, analytics, notifications, store | 1,699 lines, tab driven by `?tab=` |
| `/seller/orders` | Seller order manager | Wraps `SellerOrdersManager` |
| `/seller/returns` | Returns & replacements | Wraps `SellerReturnsManager` |
| `/seller/store` | Store profile / settings | Separate page despite `?tab=store` alias |
| `/seller/activity` | Audit/status history | |
| `/become-seller` | Public application + inquiry | Not authenticated |

### Shell

`app/seller/layout.tsx` is a client component that gates on Zustand, renders `SellerSidebar` (desktop drawer) and, on mobile, **both** a compact header and a seven-item horizontal pill nav. Tabs then repeat inside the dashboard. Three navigation surfaces for one module.

### Lifecycle and authorization

Seller states: `pending`, `pending_kyc`, `pending_inquiry`, `under_review`, `active`, `suspended`, `deactivated`, `permanently_deactivated`, `reactivation_requested`, `rejected`.

`getSellerForUser()` always reads the seller row from the DB and never trusts a client-supplied id — good. `sellerCanWrite()` requires `status === 'active'`. Product approval is a separate admin workflow with `seller_product_approval`, `seller_product_rejected`, `approve_seller_product()`, `reject_seller_product()` and `product_status_history`.

**Gap:** the seller UI does not reflect this state machine consistently. A `suspended` seller can still open product modals and only discovers the write block on submit. There is no always-visible status banner with "what you can/can't do right now".

---

## 5. Module 3 — Admin console

### Route map (23 pages) vs sidebar (16 links)

| Route | In sidebar? | Purpose |
|---|---|---|
| `/admin` | ✅ | Dashboard: revenue, orders, chart, top products, inventory, recent orders |
| `/admin/sellers` | ✅ | Seller list |
| `/admin/vendor-inquiries` | ✅ | Applications |
| `/admin/products/approvals` | ✅ | Product approval queue |
| `/admin/quality-reports` | ✅ | Lab/quality reports |
| `/admin/products` | ✅ | Catalogue |
| `/admin/products/add`, `/edit/[id]` | ↳ | Product forms |
| `/admin/categories` | ✅ | Taxonomy |
| `/admin/orders` | ✅ | **Admin-owned orders only** |
| `/admin/seller-orders` | ✅ | **All seller orders** |
| `/admin/returns` | ✅ | Returns & cancellations |
| `/admin/customers` | ✅ | Customer list |
| `/admin/delivery` | ✅ | Delivery board (browser query) |
| `/admin/analytics` | ✅ | BI |
| `/admin/coupons` | ✅ | Coupons |
| `/admin/audit` | ✅ | Audit log |
| `/admin/campaigns` | ✅ | Ad campaigns |
| `/admin/inventory` | ❌ | Stock control |
| `/admin/settings` | ❌ | Business settings, cutoff times, windows |
| `/admin/subscriptions` | ❌ | Subscription operations |
| `/admin/reports` | ❌ | Secondary reports screen |
| `/admin/vendors` | ❌ | Legacy vendor screen |

### Shell

`app/admin/layout.tsx` is client-side. It blocks render behind a centred spinner while `isAuthLoading`, then checks `user.role`. `AdminSidebar` is a 16-item flat list with no grouping, no search and no badges. The content cap is 1400px.

### Analytics

`/api/admin/reports` + `/api/admin/stats` + `/api/admin/analytics` supply MRR, churn, AOV, cohort and daily series. Recharts is dynamically imported *per primitive* (seven `dynamic()` calls) which is well-intentioned but fragments the chart chunk; a single dynamic boundary around a chart module would be cleaner.

---

## 6. Database map

**44 tables.** Grouped by domain:

| Domain | Tables |
|---|---|
| Identity | `profiles`, `users`, `user_addresses`, `translations` |
| Catalogue | `products`, `product_variants`, `categories`, `product_status_history`, `reviews` |
| Marketplace | `sellers`, `seller_product`, `seller_status_history`, `seller_inquiries`, `seller_payouts`, `seller_product_approval`, `seller_product_rejected` |
| Commerce | `orders`, `order_items`, `cart_items`, `wishlists`, `subscriptions`, `modification_reports` |
| Operations | `inventory_reservations`, `inventory_transactions`, `delivery_slots`, `return_requests`, `refunds`, `status_events` |
| Growth | `coupons`, `ad_campaigns`, `ad_events`, `product_events`, `notifications` |
| Platform | `business_settings`, `audit_logs`, `otp_store`, `support_tickets`, `razorpay_pending_orders` |

**Functions/RPCs:** `place_order_atomic`, `reserve_inventory_reservation_atomic`, `release_inventory_reservation_atomic`, `cleanup_expired_reservations_atomic`, `cancel_order_atomic`, `cancel_order_item_atomic`, `confirm_cod_payment_atomic`, `adjust_seller_stock_atomic`, `consume_replacement_stock`, `advance_order_status`, `approve_seller_product`, `reject_seller_product`, `is_admin`.

This is a serious schema. The maturity is visible in idempotency keys, reservation expiry, seller stock synchronisation triggers and audit tables.

**Three RLS problems** (details in the register): `profiles` is world-readable; `orders` allows `auth.uid() IS NULL` inserts; the browser-side admin delivery query depends on a Supabase session that the custom-cookie auth may not establish.

---

## 7. The seams (where bugs come from)

| Seam | Why it exists | Symptom |
|---|---|---|
| **Dual auth** — Supabase Auth + custom JWT + phone OTP + demo JWT | Incremental adoption of three auth strategies | Role drift, redirect mismatch (`/login` vs `/auth/login`), client-side role inference, demo bypass |
| **Dual data access** — service role on server, anon client in two admin screens | Different teams/phases | Screens that silently return empty, RLS assumptions |
| **Dual order models** — admin products vs seller products | Marketplace added after single-brand store | Operators cannot find orders; "Admin Orders" vs "Seller Orders" |
| **Config vs render** — `launch.ts` gates some sections, pages ignore it | Feature flags added late | Disabled `circularCategories` still renders; `DAIRY_ONLY` conflicts with multi-category brand copy |
| **Local mirror vs DB** — Zustand cart & user persisted | Offline-friendly UX | PII on disk; cross-account leakage; stale roles |
| **Design tokens vs legacy aliases** — `--color-cream`, `border-sand` | Migration half-finished | Two visual languages in one app; theme bugs |
| **Monolith vs routes** — seller dashboard tabs vs real routes | Speed of delivery | Duplicated nav, broken back button, unshareable links |

---

## 8. Architecture recommendations (no rewrite required)

1. **One identity.** Make `profiles.role` the only source of truth. Delete email-based inference and the demo mint. Keep Supabase Auth for OAuth, but issue the custom JWT from a single, server-verified function.
2. **One order read model.** A single `/admin/orders` list with an owner filter (`All / Platform / Seller`), not two screens.
3. **One seller surface.** Convert dashboard tabs into routes (`/seller/products`, `/seller/orders`, …) with a shared layout, and extract the 1,699-line page into feature modules under `components/seller/`.
4. **One navigation config per module**, consumed by both sidebar and mobile nav. Group items: *Overview, Catalogue, Fulfilment, Growth, People, Settings*.
5. **One design-token source.** Remove legacy aliases only after a codemod; until then, map them explicitly in `@theme` so both names resolve to the same value.
6. **One server data gateway.** Ban direct `supabase.from()` in client components; route everything through `/api/*` or server components. This eliminates the session-divergence class of bugs.
7. **Explicit timeouts everywhere.** Wrap Supabase/RDS/Razorpay/ImageKit calls in a 3–5 s `AbortSignal.timeout`, with graceful degradation. The measured 7-second renders prove this is not theoretical.
8. **Feature-flag at the render boundary, not in config only.** `isSectionEnabled()` should be the only way a gated section can mount.

---

*Next: [UX Psychology](./02-UX-PSYCHOLOGY.md) — why the current interface feels careful but not expensive, and how to change that without dark patterns.*
