/**
 * Redis Client — ElastiCache (AWS), Redis Cloud, Upstash, or Local Redis
 *
 * Purpose: Caching, OTP storage, distributed rate limiting.
 * Redis is an OPTIONAL optimisation layer — PostgreSQL remains the source of truth.
 *
 * Fault tolerance: Every Redis operation falls back to an in-memory store when
 * Redis is unavailable. The application never returns HTTP 500 solely because
 * Redis is down.
 *
 * Env vars:
 *   REDIS_URL  (e.g. redis://default:password@host:6379 or rediss://... for TLS)
 *
 * Observability: Structured [REDIS] logs for aggregation/alerting:
 *   [REDIS] HIT     <key>
 *   [REDIS] MISS    <key>
 *   [REDIS] SET     <key> TTL=<n>s
 *   [REDIS] DEL     <key>
 *   [REDIS] SCAN-DEL pattern:<pattern> deleted:<n>
 *   [REDIS] ERROR   <message>
 */

import { Redis } from 'ioredis';

// ─── Singleton ───────────────────────────────────────────────

const globalForRedis = globalThis as unknown as {
  _redis: Redis | undefined;
  _memoryCache: Map<string, { value: string; expiresAt: number }> | undefined;
};

// ─── In-Memory Fallback ──────────────────────────────────────

const memoryCache: Map<string, { value: string; expiresAt: number }> =
  globalForRedis._memoryCache ?? new Map();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis._memoryCache = memoryCache;
}

function memGet(key: string): string | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return item.value;
}

function memSet(key: string, value: string, ttlSeconds: number): void {
  // Prevent unbounded memory growth
  if (memoryCache.size > 2000) {
    const now = Date.now();
    for (const [k, v] of memoryCache) {
      if (v.expiresAt < now) memoryCache.delete(k);
    }
    if (memoryCache.size > 2000) {
      let evicted = 0;
      for (const k of memoryCache.keys()) {
        memoryCache.delete(k);
        if (++evicted >= 200) break;
      }
    }
  }
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function memDel(key: string): void {
  memoryCache.delete(key);
}

function memDelPattern(pattern: string): void {
  // Convert glob prefix (e.g. "products:list:*") to a prefix search
  const prefix = pattern.endsWith('*') ? pattern.slice(0, -1) : pattern;
  for (const k of memoryCache.keys()) {
    if (k.startsWith(prefix)) memoryCache.delete(k);
  }
}

// ─── Redis Client ────────────────────────────────────────────

let _redisReady = false;

function createRedisClient(): Redis {
  const redisUrl = process.env.REDIS_URL;

  const client = new Redis(redisUrl || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    lazyConnect: true,
    connectTimeout: 5000,
    commandTimeout: 3000,
    retryStrategy(times) {
      // Don't spam retries in dev when no REDIS_URL is configured
      if (!redisUrl && times > 1) return null;
      if (times > 3) return null;
      return Math.min(times * 300, 2000);
    },
  });

  client.on('ready', () => {
    _redisReady = true;
    if (process.env.NODE_ENV !== 'production') {
      console.log('[REDIS] Connected and ready');
    }
  });

  client.on('error', (err) => {
    _redisReady = false;
    if (process.env.REDIS_URL && !err.message.includes('ECONNREFUSED')) {
      console.error('[REDIS] ERROR', err.message);
    }
  });

  client.on('close', () => {
    _redisReady = false;
  });

  // Eagerly connect so _redisReady is set before first request
  client.connect().catch(() => {});

  return client;
}

export const redis: Redis = globalForRedis._redis ?? createRedisClient();
if (process.env.NODE_ENV !== 'production') globalForRedis._redis = redis;

function isRedisReady(): boolean {
  return _redisReady && redis.status === 'ready';
}

// ─── TTL Jitter ──────────────────────────────────────────────

/**
 * Apply ±jitterPercent% randomness to a TTL to spread expirations and
 * prevent thundering-herd stampedes on popular keys.
 */
function withJitter(ttlSeconds: number, jitterPercent = 15): number {
  const delta = Math.floor(
    ttlSeconds * (jitterPercent / 100) * (Math.random() * 2 - 1)
  );
  return Math.max(5, ttlSeconds + delta);
}

// ─── Structured Logging ──────────────────────────────────────

function logRedis(
  event: 'HIT' | 'MISS' | 'SET' | 'DEL' | 'SCAN-DEL' | 'ERROR',
  detail: string
): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[REDIS] ${event} ${detail}`);
  } else if (event === 'ERROR') {
    console.error(`[REDIS] ERROR ${detail}`);
  }
}

// ─── Core Cache Primitives ───────────────────────────────────

/**
 * Get a JSON-serialised value from Redis (or in-memory fallback).
 * Returns null on cache miss or error.
 */
export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  try {
    if (isRedisReady()) {
      const raw = await redis.get(key);
      if (raw !== null) {
        logRedis('HIT', key);
        return JSON.parse(raw) as T;
      }
      logRedis('MISS', key);
      return null;
    }
  } catch (err: unknown) {
    logRedis('ERROR', `cacheGet(${key}): ${err instanceof Error ? err.message : String(err)}`);
  }

  const raw = memGet(key);
  if (raw !== null) {
    logRedis('HIT', `[mem]${key}`);
    return JSON.parse(raw) as T;
  }
  logRedis('MISS', `[mem]${key}`);
  return null;
}

/**
 * Store a value in Redis (and in-memory fallback) with a TTL.
 * Applies TTL jitter unless jitterPercent = 0.
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number,
  jitterPercent = 15
): Promise<void> {
  const finalTtl = withJitter(ttlSeconds, jitterPercent);
  const serialised = JSON.stringify(value);

  memSet(key, serialised, finalTtl);

  try {
    if (isRedisReady()) {
      await redis.setex(key, finalTtl, serialised);
      logRedis('SET', `${key} TTL=${finalTtl}s`);
    }
  } catch (err: unknown) {
    logRedis('ERROR', `cacheSet(${key}): ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Delete a single cache key.
 */
export async function cacheDel(key: string): Promise<void> {
  memDel(key);
  try {
    if (isRedisReady()) {
      await redis.del(key);
      logRedis('DEL', key);
    }
  } catch (err: unknown) {
    logRedis('ERROR', `cacheDel(${key}): ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Delete all keys matching a glob pattern using non-blocking SCAN.
 * NEVER uses redis.keys() which blocks the event loop in production.
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
  memDelPattern(pattern);

  try {
    if (isRedisReady()) {
      let cursor = '0';
      let totalDeleted = 0;

      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await redis.del(...keys);
          totalDeleted += keys.length;
        }
      } while (cursor !== '0');

      logRedis('SCAN-DEL', `pattern:${pattern} deleted:${totalDeleted}`);
    }
  } catch (err: unknown) {
    logRedis('ERROR', `cacheDelPattern(${pattern}): ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Cache-aside helper: returns cached value if present, otherwise calls
 * fetchFn, stores the result, and returns it.
 */
export async function getOrSetCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number,
  jitterPercent = 15
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const data = await fetchFn();
  cacheSet(key, data, ttlSeconds, jitterPercent).catch(() => {});
  return data;
}

// ─── OTP Operations ──────────────────────────────────────────

const OTP_TTL_SECONDS = 600; // 10 minutes
const OTP_MAX_ATTEMPTS = 5;

/**
 * Store OTP for a phone number. Returns false if rate limited.
 */
export async function storeOTP(
  phone: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (isRedisReady()) {
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
  } catch {
    // Fall through to memory fallback
  }

  const attempts = parseInt(memGet(`otp:attempts:${phone}`) || '0');
  if (attempts >= OTP_MAX_ATTEMPTS) {
    return { success: false, error: 'Too many OTP requests. Please try again in 10 minutes.' };
  }
  memSet(`otp:${phone}`, otp, OTP_TTL_SECONDS);
  memSet(`otp:attempts:${phone}`, String(attempts + 1), OTP_TTL_SECONDS);
  return { success: true };
}

/**
 * Verify OTP for a phone number. Deletes OTP on success.
 */
export async function verifyOTP(
  phone: string,
  submittedOtp: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    if (isRedisReady()) {
      const storedOtp = await redis.get(`otp:${phone}`);
      if (storedOtp) {
        if (storedOtp !== submittedOtp) {
          return { valid: false, error: 'Invalid OTP. Please check and try again.' };
        }
        await redis.del(`otp:${phone}`, `otp:attempts:${phone}`);
        return { valid: true };
      }
      return { valid: false, error: 'OTP expired or not found. Please request a new one.' };
    }
  } catch {
    // Fall through
  }

  const memOtp = memGet(`otp:${phone}`);
  if (!memOtp) return { valid: false, error: 'OTP expired or not found. Please request a new one.' };
  if (memOtp !== submittedOtp) return { valid: false, error: 'Invalid OTP. Please check and try again.' };
  memDel(`otp:${phone}`);
  memDel(`otp:attempts:${phone}`);
  return { valid: true };
}

// ─── User Profile Cache ──────────────────────────────────────

const PROFILE_TTL = 900; // 15 minutes

export async function cacheUserProfile(userId: string, profile: unknown): Promise<void> {
  await cacheSet(`profile:${userId}`, profile, PROFILE_TTL, 0);
}

export async function getCachedUserProfile(userId: string): Promise<unknown | null> {
  return cacheGet(`profile:${userId}`);
}

export async function invalidateUserProfileCache(userId: string): Promise<void> {
  await cacheDel(`profile:${userId}`);
}

// ─── Distributed Rate Limiting ───────────────────────────────

/**
 * Distributed sliding-window rate limiter using Redis INCR + EXPIRE.
 * Falls back to in-memory when Redis is unavailable.
 */
export async function checkRateLimit(
  identifier: string,
  action: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const key = `ratelimit:${action}:${identifier}`;

  try {
    if (isRedisReady()) {
      const current = await redis.incr(key);
      if (current === 1) await redis.expire(key, windowSeconds);
      const ttl = await redis.ttl(key);
      if (current > maxRequests) {
        return { allowed: false, remaining: 0, resetIn: Math.max(0, ttl) };
      }
      return { allowed: true, remaining: maxRequests - current, resetIn: Math.max(0, ttl) };
    }
  } catch {
    // Fall through
  }

  const current = parseInt(memGet(key) || '0') + 1;
  memSet(key, String(current), windowSeconds);
  if (current > maxRequests) {
    return { allowed: false, remaining: 0, resetIn: windowSeconds };
  }
  return { allowed: true, remaining: maxRequests - current, resetIn: windowSeconds };
}

// ─── Product List Cache ──────────────────────────────────────

const PRODUCT_LIST_TTL = 120; // 2 minutes — prices/stock can change

/**
 * Cache a product list result.
 * @param key Deterministic key derived from query params (e.g. category_active hash)
 */
export async function cacheProducts(key: string, data: unknown, ttlSeconds = PRODUCT_LIST_TTL): Promise<void> {
  await cacheSet(`products:list:${key}`, data, ttlSeconds);
}

export async function getCachedProducts(key: string): Promise<unknown | null> {
  return cacheGet(`products:list:${key}`);
}

// ─── Product Detail Cache ────────────────────────────────────

const PRODUCT_DETAIL_TTL = 300; // 5 minutes

/**
 * Cache a single product's public-facing detail response.
 * SECURITY: Ensure cost_price is excluded by the caller for public endpoints.
 */
export async function cacheProductDetail(productId: string, data: unknown): Promise<void> {
  await cacheSet(`product:${productId}`, data, PRODUCT_DETAIL_TTL);
}

export async function getCachedProductDetail(productId: string): Promise<unknown | null> {
  return cacheGet(`product:${productId}`);
}

// ─── Category Cache ──────────────────────────────────────────

const CATEGORY_TTL = 1800; // 30 minutes — categories are stable

export async function cacheCategories(data: unknown): Promise<void> {
  await cacheSet('categories:all', data, CATEGORY_TTL);
}

export async function getCachedCategories(): Promise<unknown | null> {
  return cacheGet('categories:all');
}

// ─── Seller Profile Cache ────────────────────────────────────

const SELLER_PROFILE_TTL = 300; // 5 minutes

/**
 * Cache seller dashboard data (scoped to userId — never cross-seller).
 * SECURITY: Never cache passwords, bank accounts, PAN, or GSTIN here.
 */
export async function cacheSellerProfile(userId: string, data: unknown): Promise<void> {
  await cacheSet(`seller:profile:${userId}`, data, SELLER_PROFILE_TTL);
}

export async function getCachedSellerProfile(userId: string): Promise<unknown | null> {
  return cacheGet(`seller:profile:${userId}`);
}

export async function invalidateSellerProfileCache(userId: string): Promise<void> {
  await cacheDel(`seller:profile:${userId}`);
}

// ─── Seller Analytics Cache ──────────────────────────────────

const SELLER_ANALYTICS_TTL = 120; // 2 minutes

export async function cacheSellerAnalytics(sellerId: string, data: unknown): Promise<void> {
  await cacheSet(`seller:analytics:${sellerId}`, data, SELLER_ANALYTICS_TTL);
}

export async function getCachedSellerAnalytics(sellerId: string): Promise<unknown | null> {
  return cacheGet(`seller:analytics:${sellerId}`);
}

export async function invalidateSellerAnalyticsCache(sellerId: string): Promise<void> {
  await cacheDel(`seller:analytics:${sellerId}`);
}

// ─── Admin Stats Cache ───────────────────────────────────────

const ADMIN_STATS_TTL = 60; // 1 minute — near-real-time KPIs

export async function cacheAdminStats(data: unknown): Promise<void> {
  await cacheSet('admin:stats', data, ADMIN_STATS_TTL, 0);
}

export async function getCachedAdminStats(): Promise<unknown | null> {
  return cacheGet('admin:stats');
}

// ─── Admin Analytics Cache ───────────────────────────────────

const ADMIN_ANALYTICS_TTL = 120; // 2 minutes

export async function cacheAdminAnalytics(data: unknown): Promise<void> {
  await cacheSet('admin:analytics', data, ADMIN_ANALYTICS_TTL, 0);
}

export async function getCachedAdminAnalytics(): Promise<unknown | null> {
  return cacheGet('admin:analytics');
}

// ─── Product Cache Invalidation ──────────────────────────────

/**
 * Invalidate all product-list caches and optionally a specific product detail.
 * Uses SCAN (non-blocking) instead of KEYS (blocking).
 */
export async function invalidateProductsCache(productId?: string): Promise<void> {
  const tasks: Promise<void>[] = [
    cacheDelPattern('products:list:*'),
  ];
  if (productId) {
    tasks.push(cacheDel(`product:${productId}`));
  }
  await Promise.all(tasks);

  // Catalogue pages (homepage, category, search) are now cached by Next's
  // data/route cache under the 'products' tag instead of being re-queried on
  // every request. Busting the Redis cache alone would leave those pages
  // serving stale data for up to their TTL, so the two caches are invalidated
  // together, here, in one place. Every existing caller of
  // invalidateProductsCache() gets correct revalidation for free.
  try {
    const { revalidateTag } = await import('next/cache');
    revalidateTag('products', 'max');
  } catch {
    // Called outside a Next request scope (e.g. a script) — nothing to do.
  }
}

// ─── Category Cache Invalidation ────────────────────────────

/**
 * Invalidate category cache. Also invalidates product-list caches because
 * product listings are often filtered by category.
 */
export async function invalidateCategoryCache(): Promise<void> {
  await Promise.all([
    cacheDel('categories:all'),
    cacheDelPattern('products:list:*'),
  ]);
}

// ─── Admin Cache Invalidation ────────────────────────────────

export async function invalidateAdminCaches(): Promise<void> {
  await Promise.all([
    cacheDel('admin:stats'),
    cacheDel('admin:analytics'),
  ]);
}

// ─── Health Check ────────────────────────────────────────────

export async function checkRedisConnection(): Promise<boolean> {
  try {
    const result = await redis.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}
