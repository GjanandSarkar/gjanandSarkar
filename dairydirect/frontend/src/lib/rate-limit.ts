// src/lib/rate-limit.ts

/**
 * Distributed rate limiter — Redis-backed when Redis is available, in-memory fallback otherwise.
 *
 * Redis path: Uses INCR + EXPIRE sliding window (see checkRateLimit in @/lib/aws/redis).
 * Memory path: In-process map — state is instance-local and resets on cold starts.
 *
 * USAGE:
 *   const limiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 100 });
 *   await limiter.check(10, 'identifier');
 *
 * SCALING:
 * Redis is already integrated — this module will automatically use distributed limits
 * when REDIS_URL is configured and Redis is reachable.
 */

import { checkRateLimit } from '@/lib/aws/redis';

type RateLimitOptions = {
  interval: number;            // window in milliseconds
  uniqueTokenPerInterval: number; // kept for API compatibility
};

export function rateLimit(options: RateLimitOptions) {
  const windowSeconds = Math.ceil(options.interval / 1000);

  return {
    check: async (limit: number, token: string): Promise<void> => {
      const result = await checkRateLimit(token, 'generic', limit, windowSeconds);
      if (!result.allowed) {
        throw new Error('Rate limit exceeded');
      }
    },
  };
}
