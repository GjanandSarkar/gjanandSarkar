// src/lib/rate-limit.ts

/**
 * Lightweight, zero-dependency in-memory rate limiter.
 * Ideal for Startup MVP scale (0-10k customers).
 * 
 * IMPORTANT:
 * - State is kept in-memory, which means limits are INSTANCE-LOCAL on Vercel/Serverless.
 * - This will reset on cold starts.
 * - For a single or few serverless instances, this is sufficient to prevent blatant abuse and bot spam.
 * 
 * MIGRATION TO DISTRIBUTED RATE LIMITING (Redis/Upstash):
 * When scaling past the MVP phase or deploying horizontally across many regions:
 * 1. Install `@upstash/ratelimit` and `@upstash/redis`.
 * 2. Replace this implementation with `new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(...) })`.
 * 3. The exported `rateLimit` function signature can remain exactly the same.
 */

type RateLimitOptions = {
  interval: number; // in milliseconds
  uniqueTokenPerInterval: number; // Max requests per interval
};

const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

export function rateLimit(options: RateLimitOptions) {
  return {
    check: (limit: number, token: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const now = Date.now();
        const record = rateLimitMap.get(token);

        // Clean up expired records to prevent memory leaks
        if (rateLimitMap.size > 1000) {
          rateLimitMap.forEach((val, key) => {
            if (val.expiresAt < now) {
              rateLimitMap.delete(key);
            }
          });
        }

        if (record && record.expiresAt > now) {
          if (record.count >= limit) {
            return reject(new Error('Rate limit exceeded'));
          }
          record.count += 1;
          rateLimitMap.set(token, record);
          resolve();
        } else {
          rateLimitMap.set(token, { count: 1, expiresAt: now + options.interval });
          resolve();
        }
      });
    },
  };
}
