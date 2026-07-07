# Startup Production Infrastructure

This document outlines the infrastructure, security, monitoring, and backup strategies implemented in Phase 22 to ensure Gjanand Sarkar operates reliably at startup scale (0-10k customers).

## 1. Security Architecture

### Environment Security
- Critical server-only secrets (e.g., `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`) are kept strictly on the backend and are **never** prefixed with `NEXT_PUBLIC_`.
- `NEXT_PUBLIC_` is reserved exclusively for non-sensitive client identifiers (e.g., Supabase Anon Key).

### Rate Limiting
- **Implementation**: A lightweight, zero-dependency in-memory Sliding Window / Token Bucket rate limiter (`src/lib/rate-limit.ts`) is applied to sensitive endpoints (Checkout, Subscriptions, Auth Sync).
- **Scale Considerations**: Since the application is hosted on Vercel (Serverless), state is kept in memory. This means limits are **Instance-Local**. For an MVP, this is highly effective at stopping naive bots and basic abuse without introducing the complexity of Redis.

#### Migration Path (Distributed Rate Limiting)
When scaling out horizontally across multiple Vercel regions:
1. Provision a Serverless Redis instance (via Upstash or Vercel KV).
2. Install `@upstash/ratelimit` and `@upstash/redis`.
3. Replace the `rateLimitMap` in `src/lib/rate-limit.ts` with `new Ratelimit({ redis: Redis.fromEnv(), ... })`. The middleware signature will remain identical.

## 2. Monitoring Architecture

### Sentry Error Tracking
- Integrated `@sentry/nextjs` across the entire stack (Client, Server, Edge).
- Automatically captures runtime exceptions, unhandled promises, and React render crashes.
- To activate, ensure `NEXT_PUBLIC_SENTRY_DSN` is populated in Vercel environment variables.

### Uptime Health Checks
- Exposes `GET /api/health` which performs a lightweight, 1-row database query (`limit(1)`) to verify End-to-End connectivity.
- **Action**: Add this endpoint to an uptime monitoring service like Datadog, UptimeRobot, or BetterStack.

## 3. Deployment Architecture

- **Platform**: Vercel (Next.js managed hosting).
- **CDN**: Next.js automatically distributes assets globally. Images are optimized into WebP/AVIF formats on the fly.
- **Security Headers**: Configured strictly in `next.config.ts` (XSS Protection, No-Sniff, Deny Framing).

## 4. Backup & Disaster Recovery Strategy

Because the application utilizes Supabase (Managed PostgreSQL), backups are handled at the infrastructure layer:
- **Point-in-Time Recovery (PITR)**: Supabase maintains a WAL (Write-Ahead Log) allowing restoration to any exact minute.
- **Daily Backups**: Automated backups occur nightly.

### Recovery Workflow
If catastrophic data corruption occurs:
1. Log into the Supabase Dashboard.
2. Navigate to **Database > Backups**.
3. Select **Restore to a specific time** (if PITR is enabled) or restore from the latest nightly snapshot.
4. Pause frontend traffic (via Vercel deployment pause) during the restoration window to prevent data desync.

## 5. Performance Strategy

- API responses and server-rendered pages utilize Next.js App Router caching.
- External dependencies (like `framer-motion` and `lucide-react`) are aggressively tree-shaken and optimized via `optimizePackageImports` in `next.config.ts`.
- Analytics Dashboard aggregations are performed safely client-side within browser memory to prevent Database N+1 queries.

## 6. Continuous Integration (CI/CD)

- GitHub Actions (`.github/workflows/production.yml`) runs automatically on Pull Requests and merges to `main`.
- Validates structural integrity through `npm ci`, strict TypeScript checking (`tsc --noEmit`), and full Next.js Production Build Verification before code can be deployed.
