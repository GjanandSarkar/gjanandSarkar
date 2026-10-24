# Connecting Redis (Upstash) — step by step

Redis is an **optional optimisation layer**. PostgreSQL/Supabase remains the
source of truth, and every Redis call falls back to an in-memory store, so the
site never returns a 500 just because Redis is down.

What you gain by connecting it:

| Feature | Without Redis | With Redis |
|---|---|---|
| Caching | Per server instance. Each serverless instance has a cold cache. | Shared across all instances. |
| Rate limiting (OTP, login, orders) | Counted **per instance** — the effective limit multiplies by the number of running instances. | Correct, shared limits. |
| OTP storage | Lost if the instance that issued the code does not handle the verify request. | Reliable. |

The rate-limiting row is the important one: on Vercel, several instances run at
once, so today a limit of "5 OTPs per 10 minutes" is really "5 × number of
instances".

---

## Step 1 — Create an Upstash database (about 2 minutes)

1. Go to <https://console.upstash.com> and sign up (GitHub login is fine).
2. Click **Create Database**.
3. Fill in:
   - **Name**: `gjanand-sarkar`
   - **Type**: Regional (cheaper and faster than Global for a single-country
     marketplace)
   - **Region**: **`ap-south-1` (Mumbai)** — your customers are in India, and
     this keeps the round trip in single-digit milliseconds.
   - **TLS**: leave **enabled**.
4. Click **Create**.

## Step 2 — Copy the connection URL

On the database page, find the **Connect** section.

- Choose the **`ioredis`** / **Node (TCP)** tab — **not** the "REST API" tab.
  This codebase uses the standard Redis protocol via `ioredis`, so the REST
  token will not work.
- Copy the URL. It looks like:

  ```
  rediss://default:AbCdEf0123456789@apn1-xxxx-12345.upstash.io:6379
  ```

It **must** start with `rediss://` (two s's = TLS). Upstash requires TLS; a
plain `redis://` URL will fail to connect.

## Step 3 — Local development

Add the URL to `dairydirect/frontend/.env.local`:

```bash
REDIS_URL=rediss://default:YOUR_PASSWORD@your-host.upstash.io:6379
```

Restart the dev server (environment variables are only read at startup):

```bash
npm run dev
```

You should now see this on boot:

```
[REDIS] Connected and ready
```

and cache lines **without** the `[mem]` marker:

```
[REDIS] HIT products:list:all_true      ← Redis
[REDIS] HIT [mem]products:list:all_true ← in-memory fallback
```

## Step 4 — Verify it properly

Open <http://localhost:3000/api/health/redis>. Connected looks like:

```json
{
  "configured": true,
  "connectionState": "ready",
  "ready": true,
  "ping": "PONG",
  "latencyMs": 32,
  "usingFallback": false
}
```

If `usingFallback` is `true`, read the `hint` field — it says exactly what is
wrong.

## Step 5 — Production (Vercel)

1. Vercel dashboard → your project → **Settings** → **Environment Variables**.
2. Add:
   - **Key**: `REDIS_URL`
   - **Value**: the same `rediss://...` URL
   - **Environments**: tick **Production**, **Preview** and **Development**.
3. **Redeploy.** Vercel only injects environment variables at build/boot, so an
   existing deployment will not pick it up.
4. Check `https://your-domain.com/api/health/redis`.

> Consider a **separate Upstash database for Preview** if you do not want
> preview deployments sharing a cache with production.

---

## Troubleshooting

**`connectionState` is `wait` and `configured` is false**
`REDIS_URL` is not reaching the process. Locally: is it in `.env.local` (not
`.env.example`) and did you restart? On Vercel: did you redeploy after adding
it?

**`ENOTFOUND` or `ETIMEDOUT`**
Hostname is wrong or truncated. Re-copy the whole URL.

**`WRONGPASS` / `NOAUTH`**
Password is wrong. Note that it is part of the URL, between `default:` and `@`.

**Connection closes immediately**
You probably used `redis://` instead of `rediss://`. Upstash requires TLS.

**Everything still logs `[mem]`**
Hit `/api/health/redis`. If it reports `ready: true` but logs still say `[mem]`,
tell the maintainers — that combination should now be impossible (see the
readiness note in `src/lib/aws/redis.ts`).

**Free tier limits**
Upstash's free tier allows 10,000 commands/day. The caches here are
deliberately short-lived (products 2 min, seller profile 5 min), so normal
traffic sits far below that, but watch the Upstash dashboard after launch.

---

## Security notes

- `REDIS_URL` contains a password. It is a server-only variable: it is **not**
  prefixed `NEXT_PUBLIC_`, so it is never shipped to the browser. Keep it that
  way.
- Never commit a real URL. `.env.local` is git-ignored; `.env.example` holds
  only placeholders.
- Do not cache passwords, bank details, PAN or GSTIN in Redis — see the comment
  above `cacheSellerProfile` in `src/lib/aws/redis.ts`.
- To rotate credentials, reset the password in the Upstash console, update the
  variable in Vercel and locally, then redeploy.
