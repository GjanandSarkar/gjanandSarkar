# Running this branch against your real backend (local only)

This branch is **dev-only**: no production build is produced for it and nothing is
deployed. Your Supabase project is untouched — no schema, RLS, policy or migration
changes are included here.

---

## 1. Get the branch

```bash
git fetch origin
git checkout arena/38a97cb0-gjanandsarkar   # based on current main (f4bc625)
cd dairydirect/frontend
npm ci
npm run dev                                  # http://localhost:3000
```

Why not `ui/ux-improvements`: that remote branch is 98 commits of separate history
with **no common ancestor** with `main`, so it cannot be fast-forwarded or safely
merged from here. Pull this branch, or create your own from it
(`git checkout -b ui/ux-improvements`) once you have it locally.

> `npm run dev`, not `npm run build && npm run start`. The dev server picks up
> `.env.local` changes without a rebuild, which is what you want while testing states.

---

## 2. Environment variables your `.env` / `.env.local` needs

Everything below is already read by the existing code — nothing new was introduced.

### Required for real data

| Variable | Used for | If missing |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | every Supabase client + SSR fetch | storefront renders empty states |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser reads, RLS-scoped | storefront renders empty states |
| `SUPABASE_SERVICE_ROLE_KEY` | server routes: orders, admin, seller, refunds, inventory | server code silently falls back to the anon key, so RLS blocks every admin/seller write |
| `NEXT_PUBLIC_APP_URL` | auth callback, checkout return URLs | OTP + payment redirects break |
| `NEXT_PUBLIC_SITE_URL` | canonical/meta URLs | minor |

### Role gating (needed to see admin & seller modules at all)

| Variable | Used for |
| --- | --- |
| `ADMIN_EMAILS` (or `ADMIN_EMAIL`) | who gets the admin console |
| `ADMIN_PHONES` | phone-OTP admins |

If your account is neither, `/admin` and `/seller/*` will redirect — that is
expected behaviour, not a bug.

### Payments (UPI / COD)

`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`,
`RAZORPAY_WEBHOOK_SECRET`. COD works without any Razorpay key; the UPI path
returns `Razorpay credentials not configured` until they are set. For a local
walkthrough use **test-mode keys** (`rzp_test_…`).

### Optional — the app degrades instead of failing

| Variable | Fallback |
| --- | --- |
| `REDIS_URL` | in-memory cache/rate limit (per instance) — check `/api/health/redis` |
| `IMAGEKIT_PRIVATE_KEY` | falls back to Supabase Storage uploads |
| `AWS_*` (S3/CloudFront/SES) | no CDN transform, no transactional mail |
| `POSTHOG_*`, `NEXT_PUBLIC_SENTRY_DSN` | analytics/error reporting off |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | address map picker disabled |
| `CRON_SECRET` | `/api/cron/*` returns 401 |
| `NEXT_PUBLIC_SUPPORT_PHONE/EMAIL` | support copy hides the contact |
| `ALLOW_PREVIEW_EMBED` | **do not set on your machine** — it only exists so the hosted preview iframe can embed the app locally |

---

## 3. Confirm it is actually connected

1. `GET /api/health/redis` — says plainly whether Redis is set, reachable, or
   falling back to memory. This one is accurate for a Supabase setup.
2. `GET /api/health` — checks **AWS RDS + Redis only**. On a Supabase backend it
   will report `503 / database: down` even when everything works, because the RDS
   path is not the live one. Do not use it to judge the connection.
3. The real check is the app itself: open `/products` and see your own rows
   (anon key + RLS are working). Then sign in with an `ADMIN_PHONES` /
   `ADMIN_EMAILS` account and open `/admin` — if the approval queue loads, the
   service-role key is working too.

---

## 4. State checklist — every module, every phase

Use this as the click-through script. Each row is a state the UI must handle.

### Customer

| Module | States to exercise |
| --- | --- |
| Auth | OTP sent, wrong OTP, expired OTP, resend, logout, session expiry → `/login` |
| Catalogue | category with products, empty category, search hit, search miss, out of stock, low stock, multi-variant |
| Cart | empty cart, add, increment past stock, remove last item, stock drops while item sits in cart |
| Checkout | saved address, new address, coupon valid, coupon invalid, COD, UPI success, UPI dismiss/failure |
| Orders | pending, confirmed, packed, out for delivery, delivered, cancelled, refund initiated |
| Returns | return window open, window closed, request submitted, approved, rejected, refunded |
| Subscription | build a plan, skip a day, pause, resume, cancel, empty-plan state |
| Profile | addresses, saved addresses, quality reports, notifications |

### Seller

| Module | States to exercise |
| --- | --- |
| Products | draft, pending approval, approved, rejected, out of stock, edit, delete |
| Orders | new, accepted, packed, ready for pickup, delivered, cancelled |
| Returns | requested, approved, rejected, picked up |
| Store | profile saved, verification pending/verified |
| Activity | audit log populated, empty |

### Admin

| Module | States to exercise |
| --- | --- |
| Approvals | seller product queue empty / populated / approve / reject |
| Orders | all statuses, force status change, cancel |
| Returns | queue, approve, reject, trigger refund |
| Refunds | reconcile run (`/api/cron/refund-reconcile` with `CRON_SECRET`) |
| Vendor inquiries | new, replied, closed |
| Quality reports | uploaded, missing |
| Health | `/api/health`, `/api/health/redis` |

Anything that cannot change state in your project without touching Supabase
(e.g. a stale `stock` value) should be driven from the admin/seller UI — the
backend stays exactly as it is.

---

## 5. Deliberately not done

- No Supabase migration, policy or RLS change. `20261120_security_hardening.sql`
  in `dairydirect/database/supabase/migrations/` remains **unapplied**; applying
  it is your decision.
- No production build, no deploy, no CI changes.
- No backend code changed — all edits in this branch are frontend
  (`dairydirect/frontend/src`) plus this document.
