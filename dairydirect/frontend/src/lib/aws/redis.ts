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
const globalForRedis = globalThis as unknown as { 
  _redis: Redis | undefined;
  _memoryCache: Map<string, { value: any; expiresAt: number }> | undefined;
};

// In-memory fallback cache
const memoryCache = globalForRedis._memoryCache ?? new Map<string, { value: any; expiresAt: number }>();
if (process.env.NODE_ENV !== 'production') globalForRedis._memoryCache = memoryCache;

function getMemory(key: string): any | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return item.value;
}

function setMemory(key: string, value: any, ttlSeconds: number) {
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

let redisIsAvailable = false;

function createRedisClient(): Redis {
  const redisUrl = process.env.REDIS_URL;

  const client = new Redis(redisUrl || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy(times) {
      if (!redisUrl && times > 1) {
        return null; // Don't spam retries if no REDIS_URL configured
      }
      if (times > 3) return null;
      return Math.min(times * 300, 2000);
    },
  });

  client.on('error', (err) => {
    redisIsAvailable = false;
    // Don't crash or spam logs on missing Redis in development
    if (process.env.REDIS_URL && !err.message.includes('ECONNREFUSED')) {
      console.error('[Redis] Error:', err.message);
    }
  });

  client.on('ready', () => {
    redisIsAvailable = true;
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
    if (redisIsAvailable) {
      const attemptsKey = `otp:attempts:${phone}`;
      const attempts = await redis.get(attemptsKey);

      if (parseInt(attempts || '0') >= OTP_MAX_ATTEMPTS) {
        return { success: false, error: 'Too many OTP requests. Please try again in 10 minutes.' };
      }

      await redis.setex(`otp:${phone}`, OTP_TTL_SECONDS, otp);
      await redis.multi()
        .incr(attemptsKey)
        .expire(attemptsKey, OTP_TTL_SECONDS)
        .exec();

      return { success: true };
    }
  } catch (err: any) {
    // Fall back to memory
  }

  // Memory fallback
  const attempts = getMemory(`otp:attempts:${phone}`) || 0;
  if (attempts >= OTP_MAX_ATTEMPTS) {
    return { success: false, error: 'Too many OTP requests. Please try again in 10 minutes.' };
  }
  setMemory(`otp:${phone}`, otp, OTP_TTL_SECONDS);
  setMemory(`otp:attempts:${phone}`, attempts + 1, OTP_TTL_SECONDS);
  return { success: true };
}

/**
 * Verify OTP for a phone number. Deletes OTP on success.
 */
export async function verifyOTP(phone: string, submittedOtp: string): Promise<{ valid: boolean; error?: string }> {
  try {
    if (redisIsAvailable) {
      const storedOtp = await redis.get(`otp:${phone}`);
      if (storedOtp) {
        if (storedOtp !== submittedOtp) {
          return { valid: false, error: 'Invalid OTP. Please check and try again.' };
        }
        await redis.del(`otp:${phone}`);
        await redis.del(`otp:attempts:${phone}`);
        return { valid: true };
      }
    }
  } catch {}

  const memOtp = getMemory(`otp:${phone}`);
  if (!memOtp) {
    return { valid: false, error: 'OTP expired or not found. Please request a new one.' };
  }
  if (memOtp !== submittedOtp) {
    return { valid: false, error: 'Invalid OTP. Please check and try again.' };
  }
  memoryCache.delete(`otp:${phone}`);
  memoryCache.delete(`otp:attempts:${phone}`);
  return { valid: true };
}

// ─── Session Cache ───────────────────────────────────────────

export async function cacheUserProfile(userId: string, profile: any): Promise<void> {
  setMemory(`profile:${userId}`, profile, 900);
  try {
    if (redisIsAvailable) {
      await redis.setex(`profile:${userId}`, 900, JSON.stringify(profile));
    }
  } catch {}
}

export async function getCachedUserProfile(userId: string): Promise<any | null> {
  try {
    if (redisIsAvailable) {
      const cached = await redis.get(`profile:${userId}`);
      if (cached) return JSON.parse(cached);
    }
  } catch {}
  return getMemory(`profile:${userId}`);
}

export async function invalidateUserProfileCache(userId: string): Promise<void> {
  memoryCache.delete(`profile:${userId}`);
  try {
    if (redisIsAvailable) {
      await redis.del(`profile:${userId}`);
    }
  } catch {}
}

// ─── Rate Limiting ───────────────────────────────────────────

export async function checkRateLimit(
  identifier: string,
  action: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const key = `ratelimit:${action}:${identifier}`;

  try {
    if (redisIsAvailable) {
      const current = await redis.incr(key);
      if (current === 1) await redis.expire(key, windowSeconds);
      const ttl = await redis.ttl(key);
      if (current > maxRequests) {
        return { allowed: false, remaining: 0, resetIn: ttl };
      }
      return { allowed: true, remaining: maxRequests - current, resetIn: ttl };
    }
  } catch {}

  const current = (getMemory(key) || 0) + 1;
  setMemory(key, current, windowSeconds);
  if (current > maxRequests) {
    return { allowed: false, remaining: 0, resetIn: windowSeconds };
  }
  return { allowed: true, remaining: maxRequests - current, resetIn: windowSeconds };
}

// ─── Product Cache ───────────────────────────────────────────

export async function cacheProducts(key: string, data: any, ttlSeconds = 60): Promise<void> {
  setMemory(`products:${key}`, data, ttlSeconds);
  try {
    if (redisIsAvailable) {
      await redis.setex(`products:${key}`, ttlSeconds, JSON.stringify(data));
    }
  } catch {}
}

export async function getCachedProducts(key: string): Promise<any | null> {
  try {
    if (redisIsAvailable) {
      const cached = await redis.get(`products:${key}`);
      if (cached) return JSON.parse(cached);
    }
  } catch {}
  return getMemory(`products:${key}`);
}

export async function invalidateProductsCache(): Promise<void> {
  for (const k of Array.from(memoryCache.keys())) {
    if (k.startsWith('products:')) memoryCache.delete(k);
  }
  try {
    if (redisIsAvailable) {
      const keys = await redis.keys('products:*');
      if (keys.length > 0) await redis.del(...keys);
    }
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
