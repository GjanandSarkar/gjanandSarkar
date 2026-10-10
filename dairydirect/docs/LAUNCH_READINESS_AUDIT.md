# Gjanand Sarkar — Launch Readiness Audit

**Date:** 6 October 2026
**Scope:** Full codebase review (customer storefront, admin console, seller portal, API, database, build pipeline)
**Context:** Pre-launch. Goal is a startup-grade marketplace comparable to Blinkit / Swiggy / Amazon.in, not a prototype.

---

## 0. TL;DR

The product thinking is genuinely good — one-brand-per-category is a real differentiator and the feature surface (subscriptions, inventory reservation, seller lifecycle, audit logs, Razorpay, ImageKit) is far beyond a college project. **What makes it *feel* like one is the first five seconds**: a blank white screen on load, then a layout that pops in piece by piece, then prices appearing last.

That was an architecture problem, not a design problem, and it is now largely fixed (Section 1). What remains is one **security launch-blocker** (Section 2.1), a set of structural improvements (Section 3), and the UI/UX work (Section 5).

---

## 1. Performance — what was wrong and what changed

### 1.1 The landing page rendered nothing until JavaScript finished — *fixed*

This was the single biggest cause of "takes too much time on first open".

`src/app/page.tsx` — the page served at `gjanandsarkar.com/` — was a client component whose entire output was:

```tsx
return <div className="min-h-screen bg-surface" />;   // an empty box
```

It then waited, in series, for:

1. the browser to download ~1.4MB of JavaScript,
2. React to hydrate,
3. `AuthProvider` to load the Supabase SDK,
4. a network round-trip to `/api/auth/sync` to resolve `isAuthLoading`,
5. a **client-side redirect** to `/home`,
6. `/home`'s route bundle to download,
7. `/home` to query the database and render.

Only after step 7 did a single pixel of content exist. Every first-time visitor — and every ad click, every WhatsApp share, every Google result — paid that full chain as a white screen.

**Fix:** `/` is now a rewrite to the real storefront, which is statically rendered. The HTML arrives complete, immediately, with no JavaScript required to paint and no redirect hop. Admin/seller redirection still happens, but *after* content is visible instead of blocking it.

| | Before | After |
|---|---|---|
| `/` response | empty `<div>`, 307-equivalent client redirect | full storefront HTML, 200 |
| Time to first byte | DB query per request | **~8 ms** (prerendered) |
| Content visible without JS | none | entire page |

### 1.2 The homepage was uncacheable by design — *fixed*

```ts
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

Combined with `select('*, product_variants(*)')` over the **entire catalogue with no limit**. So every visitor triggered a full-table read, the server serialised every column of every product (descriptions, `cost_price`, audit columns) into the HTML, and nothing could be cached at the CDN edge.

**Fix:** ISR with a 300-second window, an explicit column list, and `LIMIT 24` (the homepage renders at most ~20 cards). Crucially, `revalidateTag('products')` is now wired into the existing `invalidateProductsCache()` helper — so when an admin edits a product, every cached catalogue surface refreshes **immediately**. You get caching without staleness.

> **Note on `cost_price`:** the old `select('*')` was shipping your per-unit cost price to the browser on every page load. Anyone could read your margins from view-source. The explicit column lists close that.

### 1.3 `/products` fetched the whole catalogue from the browser — *fixed*

Your main catalogue page was a pure client component: skeleton → hydrate → `fetch` the full catalogue → render. Users saw an empty grid for the duration of a network round-trip, and **Google saw an empty grid permanently** — none of your product listings could rank.

**Fix:** server-rendered and cached, with the client component seeded from server data so the grid paints on the first frame. Filtering and sorting still happen instantly in the browser. `/categories/[slug]` got the same treatment.

### 1.4 180KB of Supabase on every page — *fixed*

`src/lib/api/products.ts` did `import { supabase } from '@/lib/supabase'` at the top level. That module is imported by `useCartDetails` → `Header` → the root layout, so the Supabase SDK was in the critical bundle of **every single route**, including fully public pages that never touch a session.

It also mixed server-only, service-role queries (`getProductsServer`) into a module that client components import.

**Fix:** server-only queries moved to `products.server.ts`, marked with the `server-only` package so this mistake becomes a build error instead of a silent regression. Browser-side Supabase usage now goes through a lazy accessor (`lib/supabase/lazy.ts`) that code-splits the SDK.

### 1.5 525KB of Sentry blocking first paint — *fixed*

`instrumentation-client.ts` imported Sentry eagerly and ran `Sentry.init()` before the page was interactive, with `tracesSampleRate: 1` (100% of sessions traced, in production).

**Fix:** Sentry is code-split and initialised on browser idle. Errors thrown before it loads are buffered and replayed into Sentry on arrival, so early crashes — the ones that matter most — are still captured. Production sampling dropped to 10%.

### 1.6 Fonts fetched from Google at build time — *fixed*

`next/font/google` with **seven separate static weights** of Inter. That is seven font files, plus a hard build-time dependency on `fonts.googleapis.com` — the build fails outright if that host is unreachable.

**Fix:** one self-hosted 48KB variable woff2 covering the full 100–900 range. Fewer requests, no third-party dependency, no build-time network call. (Also removed `maximumScale: 1, userScalable: false` from the viewport — that blocks pinch-zoom and is an accessibility failure.)

### 1.7 The admin editor shipped to every customer — *fixed*

`ProductCard` statically imported `ProductEditModal` (a large form with image upload and category fetching). Every product card on the homepage, category pages and search results carried the full admin editor — for customers who can never open it. Now lazy-loaded on demand.

### 1.8 The build was forced onto the slow bundler — *fixed*

`"dev": "next dev --webpack"` and `"build": "next build --webpack"` explicitly opted out of Turbopack. Verified Turbopack builds this project cleanly, including Sentry source maps:

| | webpack | Turbopack |
|---|---|---|
| Production build | 110–165 s | **50 s** |

Both scripts now use Turbopack; `npm run build:webpack` is kept as an escape hatch. Dev-server hot reload benefits even more than the production build does.

### 1.9 The database had no usable index for how you query it — *fixed (migration added)*

Every catalogue query filters with `ILIKE '%term%'`. **A leading wildcard can never use a btree index** — so your search, and your category filter, were doing full sequential scans of `products` on every request. `seller_id` had no index at all despite being filtered by the seller dashboard, the store pages and the products API.

`database/supabase/migrations/20261006_catalog_performance_indexes.sql` adds:

- `pg_trgm` GIN indexes on `name`, `description`, `category` — makes `ILIKE '%...%'` an index lookup instead of a table scan
- partial `(created_at DESC) WHERE is_active = true` indexes — serves the listing hot path with no sort step
- `(category, created_at DESC) WHERE is_active` for category pages
- `seller_id`, `(product_id, price)`, `(user_id, created_at DESC)` on orders

**This migration has not been applied to your Supabase project — you need to run it.** At your current catalogue size the effect is modest; the point is that without it latency grows linearly with the catalogue and will become the dominant cost well before you have 10,000 SKUs.

### 1.10 Measured result

Homepage, production build, JavaScript actually downloaded by a modern browser:

| Metric | Before | After | Change |
|---|---|---|---|
| Critical-path JS (raw) | 1,377 KB | 933 KB | **−32%** |
| Critical-path JS (gzip) | ~430 KB | ~298 KB | **−31%** |
| TTFB (`/home`) | 1 DB query/request | ~8 ms, cached | — |
| `/` time to first content | JS + hydrate + auth + redirect | immediate HTML | — |
| Production build | 110–165 s | 50 s | **~3×** |

Numbers are from this sandbox with a stub database. On real infrastructure the *relative* gains hold; the absolute first-paint improvement will be larger, because the removed work (auth round-trip, client redirect, uncached DB query) is exactly the work that is slowest over an Indian mobile network.

### 1.11 Still on the table (not done)

- **framer-motion, 220KB raw (~70KB gzip), on every page.** Used in 37 files, so converting to `LazyMotion` + `m` is a mechanical but wide change. Biggest remaining bundle item. Worth doing before launch.
- **`/search` is still `force-dynamic`** — correct for a user-typed query, but it should move to Postgres full-text search (`tsvector`) rather than `ILIKE`, with a short cache on popular terms.
- **`/products` still loads up to 500 products and filters client-side.** Fine today, needs server-side filtering + pagination before the catalogue grows.
- **No image dimensions / blur placeholders** in several card components → layout shift (CLS) as images load. Cheap, visible win.

---

## 2. Security

### 2.1 ~~🔴 LAUNCH BLOCKER~~ ✅ FIXED — anyone could create products

`src/app/api/products/route.ts`, `POST` handler:

```ts
const auth = await getAuthUser(request);   // result is never checked
const body = await request.json();
if (!name || !category) return 400;        // ...then it inserts
```

`PUT` and `DELETE` on `/api/products/[id]` both correctly check `auth?.isAdmin`. **`POST` checks nothing** — not admin, not seller, not even that the caller is logged in (`auth` may be `null`, and the code handles that path). An unauthenticated `curl` can publish a live product with arbitrary name, price, image and description onto your storefront.

This is especially damaging for your business model: the entire value proposition is *curated, one verified brand per category*. An open write endpoint destroys exactly the trust you are selling.

**Fixed.** `POST` now enforces:

- unauthenticated → `401`
- authenticated customer with no seller record → `403`
- seller whose status is not `active` → `403`, naming the current status
- seller listing outside their contracted category → `403`
- admin → allowed in any category

Seller identity is now resolved **server-side** from the authenticated user.
The old code read `sellerId` out of the request body and then tried to match
it against `sellers.id`, then `sellers.user_id`, then `profiles.id` — three
speculative lookups that would happily attribute a product to someone else's
store. That whole block is gone.

Verified against the running build:

```
POST /api/products  (no auth)            --> 401 {"error":"Authentication required"}
POST /api/products  (forged bearer)      --> 401 {"error":"Authentication required"}
GET  /api/products                       --> 200  (public reads unaffected)
```

**Related bug found while fixing this:** `getAuthUser()` was destroying the
`seller` role. In the Redis-cached branch it returned
`role: isAdmin ? 'admin' : 'customer'`, and the final fallback branch never
consulted the `profiles` table at all — it only trusted a custom JWT. Since
you run Supabase (not RDS), that fallback is the path almost every request
takes, so **every seller was being seen as a plain customer** and every
database-assigned admin was downgraded too. Any authorisation built on top of
that would have failed open or locked sellers out. Fixed: the role now
survives caching, and Supabase `profiles` is consulted when RDS is absent.

### 2.2 ✅ FIXED — runtime schema migration inside a request handler

The same `POST` handler executes:

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_by TEXT;
```

DDL on every product creation. This takes an `ACCESS EXCLUSIVE` lock on your products table — on a live site, under concurrency, that will stall every read. Schema changes belong in migrations, which you already have a proper directory for.

**Fixed.** Removed from the handler. The columns are created by
`20261006_product_ownership_columns.sql`, now with proper `UUID` types and
foreign keys to `sellers(id)` and `profiles(id)` instead of bare `TEXT`.

That migration also adds a partial unique index,
`uniq_active_seller_per_category`, enforcing **at most one active seller per
category** in the database. Your defining business rule was previously a
convention held only in people's heads — nothing stopped two active
Electronics partners being created. (Scoped to `status = 'active'` so
suspended or replaced partners stay in the table for history without blocking
a successor.)

### 2.3 ✅ FIXED — auth token readable by JavaScript

Worse than first described. The server was *already* setting the session
cookie correctly in some places (`getAccessTokenCookieOptions()` →
`httpOnly: true`), but:

- `/api/auth/sync` and `/api/auth/profile` explicitly overrode it with
  `httpOnly: false` and a 7-day lifetime
- `AuthProvider` and the OAuth callback page then **re-wrote the same cookie
  from JavaScript** via `document.cookie`, which strips `httpOnly` even when
  the server set it — silently undoing the protection on the very same
  response

So a 7-day session token was readable by any injected script.

**Fixed.** Both routes now set `httpOnly: true`, and all three
`document.cookie` writes are gone. This is safe because the browser never
needed to read that cookie: `lib/api/client.ts` takes its bearer token from
the Supabase session, and the cookie exists purely so the server and
middleware can authenticate a request. Logout now calls
`DELETE /api/auth/session` to expire the cookies server-side, since
JavaScript can no longer clear them.

### 2.4 Dual-database fallback is a correctness risk

Several routes try AWS RDS (`isPgConfigured`), and on *any* error — including a transient timeout — silently fall through to Supabase. In `/api/products` the fallback also triggers whenever the RDS result is simply **empty**, which is indistinguishable from "no products match". Two sources of truth that can disagree, with the switch driven by error handling, is a data-integrity bug waiting to happen. Pick one database.

---

## 3. Architecture & product observations

### 3.1 The codebase still thinks it is a dairy company

This is the most direct contributor to the "college project" feeling, and it is pure presentation.

- Root metadata: *"Gjanand Sarkar — Farm Fresh Dairy, Delivered Daily"*, description about A2 milk and paneer, keywords `["dairy delivery", "fresh milk", "A2 milk", "paneer"]`
- `DBProduct.category` is typed as a closed union: `'Milk' | 'Paneer' | 'Ghee' | 'Buttermilk' | 'Curd' | 'Lassi'` — while the UI offers Electronics, Fashion, Books, Sports
- Hero badges hardcode `'VEDIC BILONA GHEE'`, `'PROBIOTIC PURITY'` and rotate them over *whatever* product is in the carousel — an Electronics item will be labelled "100% ORGANIC"
- Default product image fallback is `/milk.png` everywhere
- The application directory is literally `dairydirect/`

A customer who lands expecting a multi-category Indian marketplace and reads "Farm Fresh Dairy" in the tab title immediately downgrades their trust. This is a half-day of work with a disproportionate payoff.

### 3.2 Your actual differentiator is invisible

"One category, one verified brand" is a strong, unusual promise. Nothing on the storefront communicates it. There is a generic `TrustBar` with five pillars, but no "Official Partner" badge, no partner brand story, no explanation of *why* there is only one ghee brand. Right now it reads as a thin catalogue rather than a curated marketplace.

Concretely: a `PartnerBadge` on every product card and a partner brand page per category would turn your constraint into the headline feature.

### 3.3 Category taxonomy is defined in four places

Hardcoded arrays in `ProductsClient.tsx`, a different list in `CategoryNavBar`, fuzzy string matching in `getProductsServer` (`'dairy & essentials'` → six `ILIKE` clauses), plus a real `categories` table. They disagree. Category routing is matched by `ILIKE '%slug%'` rather than by `category_id`, so "Oil" matches "Cold-Pressed Oils" *and* "Boiler Oil Filters". With one brand per category, your category table should be the single authority and products should join to it by foreign key.

### 3.4 Dependency surface is very wide for a pre-launch product

Five AWS SDK packages, `pg`, `ioredis`, `puppeteer-core`, `maplibre-gl` + `react-map-gl`, `recharts`, `imagekit` *and* `@imagekit/nodejs`, plus Supabase. `puppeteer-core` in particular (a headless Chrome driver) has no business in a Next.js app's dependency list and will bloat your deployment image. Every one of these is an upgrade path, a CVE surface and a cold-start cost.

### 3.5 Operational gaps for a real launch

- No test suite of any kind — no unit, integration or E2E tests. For a checkout flow handling real money, at minimum: place-order, payment-verify and inventory-reservation need integration tests.
- ~~No rate limiting on auth endpoints.~~ **Correction: this was wrong.** On
  closer reading `send-otp` does rate-limit, per IP (10/10min) *and* per phone
  number (5/10min), and `verify-otp` limits per IP. This is correctly done.
- ~~`/api/test-sentry` and `/test-payment` routes are live in production.~~
  ✅ **FIXED** — `/api/test-sentry` (a route whose entire body is
  `throw new Error(...)`), `/test-sentry` and `/test-payment` have been
  deleted. Nothing referenced them.
- Health check exists (`/api/health`) but no uptime monitoring or alerting is configured.

---

## 4. Tech stack recommendation

You asked whether to stay on Supabase. **Yes — stay, and stop hedging.**

Your slowness was never Supabase. It was an uncacheable homepage, a blank client-side landing redirect, unindexed `ILIKE` scans and 1.4MB of JavaScript. Migrating to RDS/Neon would have fixed none of those, and would have cost weeks before launch.

What to actually spend money on:

| Layer | Recommendation | Approx cost | Why |
|---|---|---|---|
| Database/Auth/Storage | **Supabase Pro** | ~$25/mo | You already use it. Pro gives daily backups, no project pausing, and a connection pooler. Pick the **`ap-south-1` (Mumbai)** region — if you are currently on a US/EU region, every query pays ~200ms of transatlantic latency and that alone could be your biggest remaining win. **Worth checking today.** |
| Hosting | **Vercel Pro** | ~$20/user/mo | Native Next.js ISR + edge CDN. The caching work in Section 1 only pays off fully behind a CDN that honours it. Ensure the deployment region is Mumbai too. |
| Cache | **Upstash Redis** | ~$10/mo | You already have `ioredis` code paths. Serverless-friendly; `ioredis` holds TCP connections that don't suit serverless well — Upstash's HTTP client does. |
| Images | **ImageKit** (keep) | ~$20/mo | Already integrated. Make sure every `<Image>` goes through it with explicit width/height. |
| Search | Postgres FTS now; **Typesense/Algolia** later | $0 → ~$30/mo | `tsvector` will carry you to a few thousand SKUs. Move when you need typo tolerance and instant-search. |
| Payments | **Razorpay** (keep) | per-txn | Correct choice for India. |
| Email/SMS | **Resend** + **MSG91** | ~$20/mo | Drop the AWS SES/SNS SDKs; MSG91 has better Indian DLT compliance. |

Total ≈ **$100–130/month** for a properly hosted, monitored, production marketplace. The one change with the highest ratio of impact to effort is **confirming both Supabase and Vercel are in Mumbai.**

**What I would remove:** the AWS RDS path, the five AWS SDKs, `puppeteer-core`, and one of the two ImageKit packages. That is a large reduction in complexity for zero loss of capability.

---

## 5. UI/UX — why it reads as "static and unvibey"

Design direction is a conversation to have with you rather than something to decide unilaterally, so this is a diagnosis plus a proposed plan.

### 5.1 Diagnosis

**Nothing acknowledges the user.** Blinkit feels alive because every action has instant feedback: tap "add" and the number changes *before* the server responds. Here, cart actions `await` the network before the UI updates. On a 4G connection in Gandhinagar that is 300–800ms of a button that looks broken. **Optimistic UI is the single highest-impact UX change available to you.**

**No skeletons, so the page assembles visibly.** There is a `loading.tsx`, but sections pop in at different times. Real apps reserve the space first.

**No empty states.** `TrendingProducts` and `DealsAndBrands` `return null` when there is no data — so sections silently vanish and the page has holes in it.

**Decoration instead of hierarchy.** Heavy use of `font-black`, gold-on-green, and `uppercase tracking-wider` micro-labels on nearly every section. When everything shouts, nothing reads as important. Swiggy uses *one* accent colour and lets whitespace and photography carry the design.

**Fake data undermines trust.** The "Deal of the Day" countdown resets to 12:00:00 when it expires. Ratings are computed as `120 + product.name.length * 5`. If a customer notices, every other claim on the page becomes suspect — and on a marketplace whose pitch is *verified authenticity*, that is a brand-level risk, not a cosmetic one.

**Hardcoded dairy claims on non-dairy products** (Section 3.1) — "100% ORGANIC" over an electronics item is the kind of detail that makes a site feel unfinished.

**Mobile is an afterthought.** Desktop-first breakpoints, a bottom nav that overlaps content on some pages, and `userScalable: false` (now removed). Your traffic will be ~85% mobile.

### 5.2 Proposed plan, in impact order

1. **Optimistic cart/wishlist updates everywhere** — instant feedback, rollback on error. Biggest perceived-speed win available, larger than any remaining bundle work.
2. **Design tokens + skeletons** — one accent colour, a 4px spacing scale, two font weights, and a real skeleton for every async surface.
3. **Rebrand to multi-category** (Section 3.1) — metadata, copy, category-aware hero badges and fallback imagery.
4. **Make "one brand per category" visible** — `PartnerBadge` on cards, partner story on category pages, "Official Partner" on product detail.
5. **Replace fake data with real or nothing** — real ratings from the `reviews` table, real deal windows from the DB, honest empty states.
6. **Mobile-first rebuild of the top 5 screens** — home, category, product, cart, checkout.
7. **Micro-interactions** — add-to-cart fly animation, pull-to-refresh, haptic-style button states.

Steps 1–2 are where "college project" turns into "startup". I would do those next.

---

## 6. Recommended order of work

**Before launch (blocking):**
1. ✅ ~~Fix the open `POST /api/products` endpoint~~ (§2.1)
2. ✅ ~~Remove runtime `ALTER TABLE`~~ (§2.2)
3. ✅ ~~`httpOnly` auth cookie~~ (§2.3)
4. ✅ ~~Remove `/api/test-sentry` and `/test-payment`~~ (§3.5)
5. 🔲 **Apply both new migrations to Supabase** (§1.9, §2.2) — *requires you*
6. 🔲 Confirm Supabase + hosting are both in Mumbai (§4) — *requires you*
7. 🔲 Rebrand away from dairy (§3.1) — *next*
8. 🔲 Integration tests for checkout and payment (§3.5)

**Launch week:**
9. Optimistic cart UI (§5.2.1)
10. Skeletons + design tokens (§5.2.2)

**Shortly after:**
12. `LazyMotion` for framer-motion (§1.11)
13. Postgres full-text search (§1.11)
14. Server-side catalogue pagination (§1.11)
15. Retire the RDS path and unused AWS SDKs (§2.4, §3.4)
16. Unify the category taxonomy behind `category_id` (§3.3)

---

## 7. Changes already committed on this branch

| Commit | Contents |
|---|---|
| `7cce040` | Landing-page rewrite, homepage ISR + tag invalidation, Supabase/Sentry code-splitting, self-hosted variable font, lazy admin modal |
| `d389261` | Server-rendered `/products` and `/categories/[slug]`, catalogue performance index migration |
| `962b368` | Turbopack for dev + build, removed conflicting static-asset cache header |
| *(this commit)* | **Security:** closed the open product-creation endpoint, fixed seller/admin role resolution, httpOnly session cookie, removed runtime DDL, deleted test routes, added ownership + one-seller-per-category migration |

No behaviour was changed other than what is described above. TypeScript passes clean and the production build succeeds.
