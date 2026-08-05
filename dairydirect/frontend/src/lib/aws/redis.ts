/**
 * Redis Client — ElastiCache (AWS) or Local Redis
 * Used for: OTP storage, rate limiting, session caching
 * 
 * Env vars required:
 *   REDIS_URL (e.g. redis://your-elasticache-endpoint:6379)
 *   Or for TLS: rediss://...
 */

import { Redis } from 'ioredis';

// ─── Singleton Redis Client ───────────────────────────────────
const globalForRedis = globalThis as unknown as { _redis: Redis | undefined };

function createRedisClient(): Redis {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
    retryStrategy(times) {
      if (times > 5) {
        console.error('[Redis] Max retries reached. Connection failed.');
        return null;
      }
      return Math.min(times * 200, 2000);
    },
  });

  client.on('error', (err) => {
    // Don't crash the server on Redis errors — degrade gracefully
    if (!err.message.includes('ECONNREFUSED')) {
      console.error('[Redis] Error:', err.message);
    }
  });

  client.on('ready', () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Redis] Connected');
    }
  });

  return client;
}

export const redis = globalForRedis._redis ?? createRedisClient();
if (process.env.NODE_ENV !== 'production') globalForRedis._redis = redis;

// ─── OTP Operations ─────────────────────────────────────────

const OTP_TTL_SECONDS = 600; // 10 minutes
const OTP_MAX_ATTEMPTS = 5;

/**
 * Store OTP for a phone number. Returns false if rate limited.
 */
export async function storeOTP(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
  try {
    const attemptsKey = `otp:attempts:${phone}`;
    const attempts = await redis.get(attemptsKey);

    if (parseInt(attempts || '0') >= OTP_MAX_ATTEMPTS) {
      return { success: false, error: 'Too many OTP requests. Please try again in 10 minutes.' };
    }

    // Store the OTP
    await redis.setex(`otp:${phone}`, OTP_TTL_SECONDS, otp);
    // Increment attempt counter
    await redis.multi()
      .incr(attemptsKey)
      .expire(attemptsKey, OTP_TTL_SECONDS)
      .exec();

    return { success: true };
  } catch (err: any) {
    console.error('[Redis] storeOTP error:', err.message);
    // Fallback: allow OTP if Redis is down (in-memory alternative would be needed in prod)
    return { success: true };
  }
}

/**
 * Verify OTP for a phone number. Deletes OTP on success.
 */
export async function verifyOTP(phone: string, submittedOtp: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const storedOtp = await redis.get(`otp:${phone}`);

    if (!storedOtp) {
      return { valid: false, error: 'OTP expired or not found. Please request a new one.' };
    }

    if (storedOtp !== submittedOtp) {
      return { valid: false, error: 'Invalid OTP. Please check and try again.' };
    }

    // Delete OTP so it can't be reused
    await redis.del(`otp:${phone}`);
    await redis.del(`otp:attempts:${phone}`);

    return { valid: true };
  } catch (err: any) {
    console.error('[Redis] verifyOTP error:', err.message);
    // If Redis is down, we can't verify — reject for security
    return { valid: false, error: 'Verification service unavailable. Please try again.' };
  }
}

// ─── Session Cache ───────────────────────────────────────────

/**
 * Cache user profile in Redis for 15 minutes to reduce DB hits
 */
export async function cacheUserProfile(userId: string, profile: any): Promise<void> {
  try {
    await redis.setex(`profile:${userId}`, 900, JSON.stringify(profile));
  } catch {}
}

export async function getCachedUserProfile(userId: string): Promise<any | null> {
  try {
    const cached = await redis.get(`profile:${userId}`);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

export async function invalidateUserProfileCache(userId: string): Promise<void> {
  try {
    await redis.del(`profile:${userId}`);
  } catch {}
}

// ─── Rate Limiting ───────────────────────────────────────────

/**
 * IP-based rate limiter using Redis sliding window
 * Returns true if the request should be allowed, false if rate limited
 */
export async function checkRateLimit(
  identifier: string, // IP address or user ID
  action: string,     // e.g. 'otp', 'order', 'api'
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const key = `ratelimit:${action}:${identifier}`;

  try {
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    const ttl = await redis.ttl(key);

    if (current > maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: ttl,
      };
    }

    return {
      allowed: true,
      remaining: maxRequests - current,
      resetIn: ttl,
    };
  } catch {
    // If Redis is down, allow the request (fail open for non-critical paths)
    return { allowed: true, remaining: maxRequests, resetIn: windowSeconds };
  }
}

// ─── Product Cache ───────────────────────────────────────────

export async function cacheProducts(key: string, data: any, ttlSeconds = 60): Promise<void> {
  try {
    await redis.setex(`products:${key}`, ttlSeconds, JSON.stringify(data));
  } catch {}
}

export async function getCachedProducts(key: string): Promise<any | null> {
  try {
    const cached = await redis.get(`products:${key}`);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

export async function invalidateProductsCache(): Promise<void> {
  try {
    const keys = await redis.keys('products:*');
    if (keys.length > 0) await redis.del(...keys);
  } catch {}
}

// ─── Health Check ────────────────────────────────────────────

export async function checkRedisConnection(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}
