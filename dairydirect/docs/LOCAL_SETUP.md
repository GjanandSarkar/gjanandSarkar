# Running Gjanand Sarkar locally

Step-by-step setup for a fresh clone. Every command below was run and verified
against this branch.

- App: Next.js 16.2.10 (App Router, React 19, Tailwind v4, Turbopack)
- Database: Supabase (hosted Postgres)
- Frontend lives in `dairydirect/frontend` — **not** the repo root

---

## Step 0 — Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | **20.9+ or 22.x** (22 recommended) | `node -v` |
| npm | 10+ | `npm -v` |
| Git | any | `git --version` |

Next.js 16 will not run on Node 18. If `node -v` prints v18 or lower, install
Node 22 (via [nvm](https://github.com/nvm-sh/nvm): `nvm install 22 && nvm use 22`).

You do **not** need Docker, Redis, or an AWS account to run this locally.
Both degrade gracefully (see Step 6).

---

## Step 1 — Get on the right branch

```bash
git clone https://github.com/GjanandSarkar/gjanandSarkar.git
cd gjanandSarkar
git checkout arena/a653c785-gjanandsarkar
```

If you already cloned it:

```bash
cd gjanandSarkar
git fetch origin
git checkout arena/a653c785-gjanandsarkar
git pull
```

Confirm you are in the right place:

```bash
git log --oneline -1
# 4b61d9f ui: remove invented social proof, fix review ratings, rebuild search
```

---

## Step 2 — Install dependencies

**All frontend commands run from `dairydirect/frontend`.** This is the most
common mistake — running `npm install` at the repo root does nothing useful.

```bash
cd dairydirect/frontend
npm install
```

Takes about 20–60 seconds and installs ~757 packages. Deprecation warnings
about `uuid` and `imagekit` are expected and harmless.

---

## Step 3 — Create your Supabase project

The app reads its catalogue from Supabase, so you need a project before the
storefront will show anything.

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a
   new project (the free tier is fine).
2. Set the region to **South Asia (Mumbai) `ap-south-1`** — the audience is
   India and this is the single biggest latency win available.
3. Save the database password somewhere; you cannot see it again.
4. Wait for provisioning (about two minutes).

Then collect three values from **Project Settings → API**:

| Dashboard label | Goes into |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` `secret` key | `SUPABASE_SERVICE_ROLE_KEY` |

> The `service_role` key bypasses all row-level security. It is server-only.
> Never give it a `NEXT_PUBLIC_` prefix and never paste it into client code.

---

## Step 4 — Create the `.env.local` file

### Which file, and where

Create **one** file at exactly this path:

```
dairydirect/frontend/.env.local
```

Not the repo root. Not `dairydirect/.env.local`. It must sit next to
`package.json`. It is already gitignored, so it will never be committed.

The repo ships `.env.local.example` as a reference. There are also
`.env.aws.example` and `.env.supabase.example` files — **ignore those**, they
are deployment templates for a different hosting path and will confuse you.

### Fastest route

```bash
cd dairydirect/frontend
cp .env.local.example .env.local
```

Then open `.env.local` and replace the four values marked **REQUIRED** below.

### Minimum working file

This is the smallest `.env.local` that boots the app. Verified: with only
these set, `/`, `/home`, `/products`, `/login`, `/cart` and `/checkout` all
return HTTP 200, and phone login works.

```bash
# ─── App ─────────────────────────────────────────────────────────────
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# ─── Supabase — REQUIRED ─────────────────────────────────────────────
# Supabase Dashboard -> Project Settings -> API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste-your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=paste-your-service-role-key-here

# ─── Session secrets — REQUIRED ──────────────────────────────────────
# Generate each with:  openssl rand -base64 32
JWT_SECRET=replace-with-32-plus-random-chars
JWT_REFRESH_SECRET=replace-with-a-different-32-plus-random-chars

# ─── Admin access ────────────────────────────────────────────────────
# Accounts matching these get the admin role on first login.
# Put the email and phone you intend to log in with here.
ADMIN_EMAILS=you@example.com
ADMIN_EMAIL=you@example.com
ADMIN_PHONES=+919876543210
```

Generate the two secrets:

```bash
openssl rand -base64 32   # -> JWT_SECRET
openssl rand -base64 32   # -> JWT_REFRESH_SECRET
```

### Optional variables

Leave these out entirely until you need the feature. Every one of them
degrades gracefully when absent.

| Variable | Unlocks | Without it |
|---|---|---|
| `REDIS_URL` | Shared cache, OTP store, distributed rate limiting | Falls back to in-memory. Fine for one dev machine. |
| `RAZORPAY_KEY_ID` / `_SECRET` / `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Online card/UPI payment | Checkout still works via Cash on Delivery. |
| `AWS_*` | Real SMS, email, S3 uploads | OTP is printed to the terminal instead (see Step 6). |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Live order-tracking map | Map area stays blank; rest of the page is fine. |
| `NEXT_PUBLIC_SENTRY_DSN` | Error reporting | No error reporting. Not wanted in dev anyway. |
| `IMAGEKIT_PRIVATE_KEY` | Image CDN transforms | Images serve directly from Supabase storage. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | "Sign in with Google" | Use phone OTP login instead. |
| `DATABASE_URL` / `DIRECT_URL` | Direct SQL tooling | Not needed; the app talks to Supabase over HTTP. |

---

## Step 5 — Set up the database

Open **SQL Editor** in your Supabase dashboard and run these files from
`dairydirect/database/supabase/migrations/` **in this exact order**. Paste the
contents of each into a new query and click Run. Order matters — later files
depend on tables created by earlier ones.

```
 1. 001_schema.sql
 2. 002_create_users.sql
 3. 003_functions_rls_storage.sql
 4. 20260802_saas_marketplace.sql
 5. 20260802_seller_inquiries.sql
 6. 20260802_user_addresses_fk_and_soft_delete.sql
 7. 20260912_support_tickets.sql
 8. 20260917_upgrade_user_addresses.sql
 9. 20260930_inventory_synchronization_system.sql
10. 20261004_create_categories_table.sql
11. 20261004_seller_lifecycle.sql
12. 20261006_product_ownership_columns.sql      <- new on this branch
13. 20261006_catalog_performance_indexes.sql    <- new on this branch
```

The last two are new in this branch and have **not** been applied to any live
project yet:

- `20261006_product_ownership_columns.sql` backs the security fix that stops
  the product-creation endpoint trusting a seller id from the request body.
  The hardening is incomplete without it.
- `20261006_catalog_performance_indexes.sql` adds the catalogue read-path
  indexes behind the measured speed-ups.

### Load sample data

Then run `dairydirect/database/supabase/seed.sql` the same way. It inserts
8 products with variants, one seller, business settings, delivery slots,
coupons and translations. It is idempotent, so running it twice is safe.

**Do not skip the seed.** Without it the database is empty, and the storefront
renders correctly but with zero products — which looks like a bug and is not.

---

## Step 6 — Start the dev server

```bash
cd dairydirect/frontend
npm run dev
```

Expected output:

```
▲ Next.js 16.2.10 (Turbopack)
- Local:        http://localhost:3000
- Environments: .env.local
✓ Ready in ~500ms
```

Open **http://localhost:3000**. It redirects to `/home`.

Confirm the line `- Environments: .env.local` appears. If it does not, your
env file is in the wrong directory and nothing else will work.

### Logging in

There is no SMS provider in development. The OTP is returned directly:

1. Go to `/login` and enter a phone number.
2. Read the code from your **terminal**, where it prints as:
   `[DEV] OTP for +919876543210: 966157`
   (it is also in the API response, which the login form fills in for you).
3. Enter it to sign in.

To get an admin account, log in with the phone or email you listed in
`ADMIN_PHONES` / `ADMIN_EMAILS`, then visit `/admin`.

### Useful routes

| Route | What it is |
|---|---|
| `/home` | Customer storefront |
| `/products`, `/search?q=ghee` | Catalogue and search |
| `/admin` | Admin dashboard (admin accounts only) |
| `/seller/dashboard` | Seller/partner portal |
| `/design-reference` | Component styleguide. **Dev only** — 404s in production by design. Useful when the DB is empty. |

---

## Step 7 — Production build (optional)

```bash
npm run build
npm start
```

A healthy build ends with `✓ Generating static pages (79/79)`.

---

## Troubleshooting

**`Error: supabaseKey is required` during build, at "Collecting page data"**
`.env.local` is missing, in the wrong folder, or lacks
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. It must be at
`dairydirect/frontend/.env.local`.

**`Cannot find module '@sentry/nextjs'`**
You skipped `npm install`, or ran it in the wrong directory. Run it inside
`dairydirect/frontend`.

**Pages load but show no products**
The seed has not been run. See Step 5. Check it worked with
`select count(*) from products;` in the SQL Editor — it should return 8.

**`getaddrinfo ENOTFOUND <something>.supabase.co` in the terminal**
`NEXT_PUBLIC_SUPABASE_URL` is wrong or a placeholder. Copy the Project URL
from the dashboard exactly, including `https://` and no trailing slash.

**Port 3000 already in use**
`npm run dev -- -p 3001`. If you do, update `NEXT_PUBLIC_APP_URL` and
`NEXT_PUBLIC_SITE_URL` to match, or OAuth redirects will break.

**Changing `.env.local` seems to have no effect**
Next.js only reads it at startup. Stop the server and restart it.

**Migration fails: `42703: column "building" does not exist`**
Fixed on this branch. `20260917_upgrade_user_addresses.sql` backfilled from
`building`, `street` and `instructions`, which have never existed on
`user_addresses`. `git pull` and re-run that file.

**Migration fails: `42P01: relation "seller_product" does not exist`**
Fixed on this branch. `seller_product` is written to by the product API but
was never created by any migration. `20260930_inventory_synchronization_system.sql`
now creates and backfills it before first use. `git pull` and re-run that file.

**`column product_variants_1.available_quantity does not exist`**
A migration that errors part-way is rolled back **in full** — the Supabase SQL
Editor runs each script in one transaction. When
`20260930_inventory_synchronization_system.sql` failed on the missing
`seller_product` table, the `available_quantity`, `reserved_quantity` and
`version` columns it had added moments earlier were undone with it. The file
reported an error but left no trace, which is why the app then complained
about a column from a migration you thought had run.

`git pull` and re-run that whole file. Re-running is safe: every statement in
it is guarded with `IF NOT EXISTS` / `CREATE OR REPLACE`. Confirm with:

```sql
select column_name from information_schema.columns
where table_name = 'product_variants' and column_name = 'available_quantity';
```

This also clears the `500`s on `/api/inventory/status`.

**`PGRST204: Could not find the 'landmark' column of 'user_addresses'`**
Fixed on this branch. `20260917_upgrade_user_addresses.sql` now adds it.
Re-run that file.

**Admin pages are empty (Orders, Customers, Subscriptions, Deliveries)**
Usually correct behaviour on a fresh install, not a bug:
- *Orders* and *Deliveries* read the `orders` table. Place a test order first.
- *Subscriptions* reads `subscriptions`. Nothing seeds it.
- *Customers* deliberately excludes `role = 'admin'`. If your admin account is
  the only profile, the list is empty by design. Log in with a second phone
  number to see a row.
- *Categories* was genuinely empty: nothing populated the `categories` table.
  `seed.sql` now inserts the twelve canonical categories. Re-run it.

**Google login: `Unsupported provider: provider is not enabled`**
Supabase config, not a code problem. See "Enabling Google login" below.

**Node version errors / cryptic build failures**
`node -v` must be 20.9+. Next.js 16 does not support Node 18.


---

## Enabling Google login

A fresh Supabase project has every OAuth provider switched off, so
`supabase.auth.signInWithOAuth({ provider: 'google' })` returns:

```json
{ "code": 400, "error_code": "validation_failed",
  "msg": "Unsupported provider: provider is not enabled" }
```

Nothing is wrong with the app. Phone OTP login works without any of this, so
only do it if you specifically need Google sign-in.

### 1. Create a Google OAuth client

1. [Google Cloud Console](https://console.cloud.google.com/) -> create or pick
   a project.
2. **APIs & Services -> OAuth consent screen**. Choose **External**, fill in
   app name and support email, save. While the app is in **Testing**, add your
   own Google account under **Test users** or sign-in will be refused.
3. **APIs & Services -> Credentials -> Create Credentials -> OAuth client ID**.
   Application type: **Web application**.
4. Under **Authorised redirect URIs** add exactly one entry:

   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```

   `<your-project-ref>` is the subdomain from `NEXT_PUBLIC_SUPABASE_URL`.

   This is the single most common mistake: the redirect URI points at
   **Supabase**, not at `localhost`. Google hands the code to Supabase, and
   Supabase then redirects to your app. Putting
   `http://localhost:3000/auth/callback` here produces `redirect_uri_mismatch`.
5. Copy the **Client ID** and **Client secret**.

### 2. Enable the provider in Supabase

**Authentication -> Providers -> Google**: toggle **Enable**, paste the Client
ID and Client secret, Save.

### 3. Allow your local URL to be redirected to

**Authentication -> URL Configuration**:

- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: add `http://localhost:3000/**`

The app sends users to `/auth/callback`, and Supabase refuses to redirect
anywhere not on this allowlist. Without the wildcard entry you land back on
the home page silently logged out.

### 4. Restart and test

Changes apply immediately; no redeploy needed. Hard-refresh the browser,
since the old failing response may be cached.

> Add the deployed origin to both **Site URL** / **Redirect URLs** and the
> Google client when you ship. `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `.env.local`
> is **not** required for this flow; Supabase holds the credentials.
