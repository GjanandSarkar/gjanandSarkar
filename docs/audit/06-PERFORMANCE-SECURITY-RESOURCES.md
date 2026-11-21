# 06 — Performance, Security & Resource Optimisation

Three budgets that must be enforced in CI, not remembered: **milliseconds**, **bytes**, and **rupees per order**.

---

## 1. Measured baseline (local production build)

Environment: `next build` + `next start`, Node 22, no Supabase/Redis credentials (so dynamic paths fail after their network timeout).

| Page | Status | TTFB | Total | HTML | Cache |
|---|---:|---:|---:|---:|---|
| `/` (rewrite → `/home`) | 200 | 12 ms | 12 ms | 82.4 KB | `x-nextjs-cache: HIT` |
| `/home` | 200 | 13 ms | 13 ms | 82.4 KB | HIT |
| `/login` | 200 | 18 ms | 18 ms | 16.6 KB | HIT |
| `/cart` | 200 | 17 ms | 17 ms | 65.0 KB | HIT |
| `/products` | 200 | 285 ms | **7.32 s** | 75.6 KB | `no-store` |
| `/offers` | 200 | 44 ms | **7.12 s** | 71.6 KB | `no-store` |

**Assets on the home page**

| Asset | Value | Note |
|---|---:|---|
| JS chunks | **19** | All requested on first load |
| Raw JS | **1,075 KB** | ~300–350 KB gzipped; above a 250 KB gz budget |
| CSS | 2 files | Tailwind v4, reasonable |
| Logo | **263 KB PNG** | Rendered at 48–56px; no dimensions |
| Fonts | 1 woff2, preloaded | ✅ correct approach |
| Product images | `next/image` with `sizes` | ✅ good, no images in this empty run |
| `framer-motion` imports | 45 files | Included in the customer critical path |
| Core Web Vitals | **not measured** | No Lighthouse/Playwright available in this sandbox — **verify with data** |

**Thresholds:** LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at p75 ([DigitalApplied](https://www.digitalapplied.com/blog/core-web-vitals-2026-inp-lcp-cls-optimization-guide)). Internal budgets should be stricter: **LCP ≤ 2.0 s, INP ≤ 150 ms, CLS ≤ 0.05**, initial JS ≤ 250 KB gz, HTML ≤ 50 KB, hero image ≤ 200 KB.

---

## 2. Performance plan

### 2.1 P0 — timeouts and graceful degradation (fix today)

Every network call in a Server Component must fail fast. Add:

```ts
// lib/utils/timeout.ts
export async function withTimeout<T>(p: PromiseLike<T>, ms = 3000, label = 'upstream'): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  try { return await Promise.race([p, timeout]); }
  finally { clearTimeout(timer!); }
}
```

Wrap: Supabase queries, RDS `query()`, Redis, ImageKit, Razorpay. On failure, return a typed degraded result and render a cached shell + retry. Add `export const dynamic = 'force-dynamic'` only where truly needed; prefer `revalidate`.

Target: **no page exceeds 1.5 s server time** under a 3 s dependency outage.

### 2.2 JavaScript budget

| Action | Expected saving |
|---|---|
| Replace `framer-motion` in `ProductCard`, home sections, order summary with CSS `.reveal`/`.pressable` | 30–60 KB gz on the critical path |
| Load `SupportChat` on first open (`next/dynamic`) | 15–25 KB |
| Load cart drawer only when opened | 10–15 KB |
| Split the `i18n.ts` static map (~1,300 lines × 3 languages) into a language chunk | 20–30 KB |
| Dynamic-import Recharts behind one boundary in admin (currently 7 primitives) | Faster admin TTI |
| Audit `lucide-react` imports; use `optimizePackageImports` (already on) | Fewer icons in shared chunks |
| Remove the admin `ProductEditModal` from the card path (already dynamic — keep) | ✅ already done |

Target: **≤ 8 chunks, ≤ 250 KB gz initial JS** on `/home`.

### 2.3 HTML and RSC payload

- 80 KB with zero products is high. Reduce by removing below-the-fold client components from the initial tree and trimming serialised props.
- Do not serialise full product objects into client components; pass the six fields the card uses.
- Avoid preloading every route's chunk; let Next prefetch on intent.

### 2.4 Images and media

- Logo → SVG + 512/192/180 PNG, `< 20 KB`; use `next/image` with width/height for the raster fallback.
- Product images: ImageKit transformations (`tr:w-400,q-75,f-auto`) and `sizes` matching the grid (already correct).
- Add a strict `ProductMedia` component with a warm-white plate and a fallback; never render a raw URL.
- Preconnect to `ik.imagekit.io` and the Supabase storage host.
- Lazy-load everything below the first rail; `priority` only on the LCP image.

### 2.5 Caching

What is already good: `unstable_cache` with tags for home/catalog/category, 60 s CDN caching on `/api/products` and `/search`, 5-minute revalidate.

What to add:

- Cache `getFreeDeliveryThreshold()` / business settings with a `settings` tag (currently a blocking call in `TopBar` on every page).
- Cache categories server-side (currently client-fetched after hydration, causing pop-in).
- Add `stale-while-revalidate` for product detail pages (ISR with tag invalidation on edit).
- Add cache tags to seller storefront pages.
- Never cache authenticated responses at the CDN (`private, no-store` — already correct).

### 2.6 Database

- Reuse the existing indexes; verify `EXPLAIN ANALYZE` for the home feed, category page, order list and seller dashboard.
- Keep explicit column lists (already done in `products.server.ts`).
- Add keyset pagination only above ~10k products; `LIMIT/OFFSET` is fine now.
- Avoid N+1 in seller/admin lists: fetch orders + items in one query with a join, not per order.
- Pool connections (Supavisor) and set `statement_timeout` per role.
- Add a slow-query log and alert on p95 > 300 ms.

### 2.7 Perceived performance

- Skeletons that match the final layout (already used in cart/checkout/PDP).
- Optimistic cart updates (already implemented) + a toast.
- Reserve space for rails so nothing jumps.
- Show the delivery window and price immediately, not after a pricing round-trip.
- Prefetch the top three product routes on home hover/intent.

---

## 3. Security

### 3.1 The three critical holes

| # | Hole | Fix | Verify |
|---|---|---|---|
| 1 | Demo admin JWT mint | Delete branch + UI; gate on non-production env + read-only sandbox | `curl -X POST /api/auth/sync -d '{"type":"demo","role":"admin"}'` → 403 in prod |
| 2 | `profiles` world-readable + `anon` grants | Scoped RLS + revoke anon; audit all `USING (true)` | `anon` select on profiles returns 0 rows without auth |
| 3 | Default UPI rejected | Remove method; server+client contract test | Every rendered method accepted by API |

### 3.2 Authentication and session

- One canonical login route; one redirect-parameter contract; validate redirect targets are relative paths.
- Derive role **only** from `profiles.role` server-side. Remove `email.includes('admin')` and hardcoded emails.
- Custom JWT: HS256 with a ≥32-byte secret, 15-minute access token, 7-day refresh, rotation with `jti` revocation in Redis.
- Cookies: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, narrow `Max-Age`; add `__Host-` prefix where possible.
- Supabase session and custom session must resolve to the same `userId`. Add a reconciliation check; log mismatches.
- Brute force: Redis-backed limits on OTP send/verify (already) — **fail closed** in production if Redis is down (currently falls back to memory).
- Admin MFA: TOTP for admin accounts. Non-negotiable before real money.

### 3.3 Authorization

- Keep `requireAdmin/requireSeller` on every route (verified: all `/api/admin/*` handlers check).
- Add a route-level test that enumerates `src/app/api/admin/**/route.ts` and fails if a handler lacks an admin check.
- Implement `ROLE_PERMISSIONS` or delete it (currently decorative).
- Admin/seller pages: verify in a Server Component layout, not only client state.
- Middleware: verify the JWT signature via Web Crypto for `/admin` and `/seller` (currently decodes only).

### 3.4 Payments

- Keep the five-step Razorpay verification — it is strong.
- Webhook: HMAC + `timingSafeEqual` (already) + idempotency + amount/currency check (already) + replay protection (store event ids, TTL 7 days).
- Never mark an order paid from the client. Never accept a client-supplied amount (already server-computed).
- Automatic reconciliation job: every 15 minutes, find `payment.captured` webhooks without an order and orders paid without a webhook; alert.
- Refund: one idempotent service, one audit record, one gateway reference.

### 3.5 Browser hardening

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-…' https://checkout.razorpay.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://ik.imagekit.io https://<project>.supabase.co;
  connect-src 'self' https://<project>.supabase.co wss://<project>.supabase.co https://api.razorpay.com https://*.sentry.io;
  frame-src https://api.razorpay.com https://checkout.razorpay.com;
  object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';
```

Add `Cross-Origin-Opener-Policy: same-origin`, `X-DNS-Prefetch-Control: off`, keep `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`. Remove `unsafe-eval` after verifying Razorpay/maplibre. Roll out with `Content-Security-Policy-Report-Only` for 72 hours.

**Other**: sanitise all rich text/review input server-side; validate file uploads (MIME, size, magic bytes); never trust `sellerId` from the client; rate-limit image uploads; scan uploads for malware if public.

### 3.6 Privacy and DPDP Act 2023

Required before launch ([Consent.in](https://www.consent.in/blog/dpdp-act), [IndiaConsent](https://www.indiaconsent.com/resources/blog/dpdp-for-ecommerce)):

1. **Itemised notice** — what data, why, for how long, how to withdraw, grievance officer.
2. **Separate, unticked consent** for fulfilment, personalisation, marketing and analytics. Store consent version + timestamp + IP.
3. **Data minimisation** — don't persist identity in `localStorage`; don't log phone/email/address; don't collect DOB unless needed.
4. **Rights** — access, correction, erasure, withdrawal, grievance. A self-serve Account → Privacy page is acceptable for a small platform; a 48-hour acknowledgement SLA is required from 2026 rules.
5. **Security safeguards** — encryption at rest (Supabase), TLS, least privilege, audit logs, breach notification to the Data Protection Board within 72 hours.
6. **Retention** — orders for tax (8 years), marketing data until withdrawal, analytics anonymised after 13 months, inactive accounts erased per the 2027 e-commerce rules.
7. **Children** — no targeted advertising to under-18s; age gate where relevant.

### 3.7 Compliance calendar

| Date | Requirement |
|---|---|
| Now | CCPA dark-pattern guidelines (in force) |
| 13 Nov 2026 | Consent Manager framework under DPDP Rules |
| 1 Jan 2027 | E-Commerce Amendment Rules: dark-pattern self-audit certificate, grievance SLA, sponsored-listing labels, no search manipulation |
| 13 May 2027 | Substantive DPDP obligations |

Plan the consent + grievance workflow in Q1 2027; don't wait for the deadline.

---

## 4. Resource and cost optimisation

| Resource | Current risk | Action | Expected effect |
|---|---|---|---|
| **Supabase** | Service-role queries on every uncached path; no query timeouts; 44 tables | Cache settings/categories; add timeouts; pool; monitor egress | 30–50% fewer DB calls at peak |
| **Redis / Upstash** | In-memory fallback in production | Require Redis in prod; use per-command TTLs; cap cache sizes | Correct limits, stable memory |
| **Vercel/serverless** | Cold starts from heavy bundles; 74 routes | Reduce initial JS; keep server-only deps external (already); use Node runtime only where needed | Lower duration cost, faster TTFB |
| **ImageKit** | Unbounded original uploads; no transformation policy | Enforce max dimensions/format at upload; serve transformed variants | 40–70% image bandwidth |
| **Sentry** | Likely 100% sampling by default | `tracesSampleRate 0.1`, `replaysSessionSampleRate 0.01`, error-only in prod | Predictable cost |
| **Razorpay** | Refund/webhook retries may duplicate | Idempotency keys + event store | Fewer support calls |
| **Email/SMS** | OTP + notifications without provider-level rate limits | Per-phone/per-IP limits, template caching | Prevent SMS-pumping fraud |
| **Logs** | 398 console calls, possible PII | Structured logger with redaction + sampling | Lower log cost, safer |

**Cost per order** should be a dashboard metric: DB + hosting + image CDN + SMS/email + payment fee + support minutes. At a ₹640 AOV with ~2% payment fees, infrastructure above ₹12/order starts to hurt; caching and image discipline are the levers.

---

## 5. Observability

- **Errors:** Sentry with release, route, `requestId`, user id (hashed), payment/order ids redacted.
- **Traces:** OpenTelemetry for API routes; p50/p95/p99 by route; DB span per query.
- **Product:** the 12 canonical events in [UX Psychology §10](./02-UX-PSYCHOLOGY.md#10-measuring-whether-it-worked).
- **Business alerts:** payment failure rate > 3%, order creation failure > 1%, stock-out on top 10 SKUs, refund pending > 48 h, webhook backlog > 5, Redis down, p95 LCP > 2.5 s.
- **Synthetic:** Playwright (or a hosted monitor) hitting home → PDP → cart → checkout every 15 minutes from Mumbai and Ahmedabad.
- **Status page** and an incident runbook (who does what, how to pause ordering, how to refund in bulk).

---

## 6. Backup, recovery and launch safety

| Control | Current | Needed |
|---|---|---|
| DB backups | Supabase Pro daily | Verify restore monthly; PITR if available |
| Secrets | `.env.local` template | Rotate `JWT_SECRET`, Razorpay, service role; store in a manager; never in repo |
| Migrations | 38 SQL files, applied manually | Supabase CLI migration history; forward-only; tested on a branch DB |
| Rollback | Vercel instant rollback | Documented runbook + feature flags for risky paths |
| Kill switches | `is_ordering_enabled` in settings | Wire it to checkout, banner and API; test quarterly |
| Load test | None | k6/Artillery: 100 concurrent checkout attempts, verify no oversell |
| Pen test | None | At minimum an OWASP ASVS L2 checklist before launch |

---

## 7. Launch gate (must all be true)

- [ ] No public admin path; demo code removed
- [ ] `anon` cannot read PII; RLS verified with the anon key
- [ ] Every payment method rendered is accepted by the API
- [ ] Subscription either ships or is fully hidden
- [ ] Pincode/serviceability and delivery slots live
- [ ] No `alert()` in customer flows; recovery screen exists
- [ ] `localStorage` contains no PII
- [ ] Timeouts on every upstream call; degraded pages render
- [ ] p75 LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 on a mid-range Android
- [ ] Logo and hero optimised; initial JS ≤ 300 KB gz
- [ ] Consent + privacy + grievance officer live
- [ ] Backup restore tested; kill switch tested
- [ ] On-call rota and support SLA published

---

*Next: [Roadmap](./07-ROADMAP.md) — the six-week sequence that gets from here to that gate.*
