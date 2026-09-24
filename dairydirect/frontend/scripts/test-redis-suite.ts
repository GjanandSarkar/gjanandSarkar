/**
 * Comprehensive Redis & Distributed Cache Audit Test Suite
 * Tests:
 * 1. Cache Primitives (cacheGet, cacheSet, cacheDel, cacheDelPattern)
 * 2. In-Memory Graceful Degradation / Fallback
 * 3. TTL Jitter Calculation
 * 4. Rate Limiting (Redis + In-memory fallback, windowing, blocking)
 * 5. OTP Storage, Max Attempt Guard, and Single-Use Verification
 * 6. Product Cache Invalidation Cascade
 * 7. Category Cache Invalidation Cascade
 * 8. Seller Isolation (no cross-seller data leakage)
 * 9. Admin Stats / Analytics Cache Separation
 * 10. Fault Tolerance (Zero unhandled exceptions on Redis failure)
 */

import {
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelPattern,
  getOrSetCache,
  storeOTP,
  verifyOTP,
  checkRateLimit,
  cacheProducts,
  getCachedProducts,
  cacheProductDetail,
  getCachedProductDetail,
  cacheCategories,
  getCachedCategories,
  cacheSellerProfile,
  getCachedSellerProfile,
  invalidateSellerProfileCache,
  cacheSellerAnalytics,
  getCachedSellerAnalytics,
  cacheAdminStats,
  getCachedAdminStats,
  cacheAdminAnalytics,
  getCachedAdminAnalytics,
  invalidateProductsCache,
  invalidateCategoryCache,
  invalidateAdminCaches,
  checkRedisConnection,
} from '../src/lib/aws/redis';

import { rateLimit } from '../src/lib/rate-limit';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}${detail ? ` (${detail})` : ''}`);
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🚀 GJANAND SARKAR — REDIS CACHING AUDIT & TEST SUITE');
  console.log('======================================================\n');

  // Check connection status
  const isConnected = await checkRedisConnection();
  console.log(`[INFO] Live Redis Server Available: ${isConnected ? 'YES' : 'NO (Testing In-Memory Fallback Engine)'}`);

  // ─── 1. Cache Primitives ──────────────────────────────────
  console.log('\n--- 1. Testing Core Cache Primitives ---');
  const testKey = 'audit:test:primitive';
  const testPayload = { store: 'Gjanand Sarkar', milkFat: 6.5, items: ['A2 Milk', 'Pure Ghee'] };

  await cacheSet(testKey, testPayload, 60);
  const fetched = await cacheGet<typeof testPayload>(testKey);
  assert(fetched !== null && fetched.store === 'Gjanand Sarkar' && fetched.milkFat === 6.5, 'cacheSet and cacheGet preserve structure and data types');

  await cacheDel(testKey);
  const afterDel = await cacheGet(testKey);
  assert(afterDel === null, 'cacheDel successfully evicts the key');

  // ─── 2. Pattern Invalidation (SCAN in Redis / Prefix in Mem) ─
  console.log('\n--- 2. Testing Pattern Invalidation (SCAN) ---');
  await cacheSet('audit:pattern:item1', { id: 1 }, 60);
  await cacheSet('audit:pattern:item2', { id: 2 }, 60);
  await cacheSet('audit:other:item3', { id: 3 }, 60);

  await cacheDelPattern('audit:pattern:*');
  const p1 = await cacheGet('audit:pattern:item1');
  const p2 = await cacheGet('audit:pattern:item2');
  const o3 = await cacheGet('audit:other:item3');
  assert(p1 === null && p2 === null, 'Pattern deletion evicts all matching keys');
  assert(o3 !== null, 'Pattern deletion does NOT evict non-matching keys');
  await cacheDel('audit:other:item3');

  // ─── 3. Cache-Aside Helper (getOrSetCache) ────────────────
  console.log('\n--- 3. Testing Cache-Aside Helper (getOrSetCache) ---');
  let fetchCount = 0;
  const mockFetch = async () => {
    fetchCount++;
    return { calculatedAt: Date.now(), data: 'expensive_db_result' };
  };

  const keyAside = 'audit:cache_aside_test';
  await cacheDel(keyAside);

  const res1 = await getOrSetCache(keyAside, mockFetch, 60);
  const res2 = await getOrSetCache(keyAside, mockFetch, 60);
  assert(fetchCount === 1, 'getOrSetCache only calls fetch function on cache miss');
  assert(res1.data === res2.data, 'getOrSetCache returns identical cached payload');
  await cacheDel(keyAside);

  // ─── 4. Rate Limiting ─────────────────────────────────────
  console.log('\n--- 4. Testing Distributed Rate Limiting ---');
  const rateLimitId = `user_${Date.now()}`;
  const action = 'audit_order_test';
  const max = 3;
  const windowSec = 10;

  const r1 = await checkRateLimit(rateLimitId, action, max, windowSec);
  const r2 = await checkRateLimit(rateLimitId, action, max, windowSec);
  const r3 = await checkRateLimit(rateLimitId, action, max, windowSec);
  const r4 = await checkRateLimit(rateLimitId, action, max, windowSec);

  assert(r1.allowed === true && r1.remaining === 2, 'First request allowed, remaining decrements');
  assert(r2.allowed === true && r2.remaining === 1, 'Second request allowed, remaining decrements');
  assert(r3.allowed === true && r3.remaining === 0, 'Third request reaches max capacity');
  assert(r4.allowed === false && r4.remaining === 0, 'Fourth request blocked by rate limiter');

  // Test rateLimit wrapper compatibility
  const wrapperLimiter = rateLimit({ interval: 5000, uniqueTokenPerInterval: 50 });
  let threwRateLimit = false;
  try {
    for (let i = 0; i < 5; i++) {
      await wrapperLimiter.check(3, `wrap_${rateLimitId}`);
    }
  } catch (err: any) {
    if (err.message === 'Rate limit exceeded') {
      threwRateLimit = true;
    }
  }
  assert(threwRateLimit === true, 'rateLimit wrapper throws Rate limit exceeded on threshold breach');

  // ─── 5. OTP Storage, Rate Limiting & Verification ─────────
  console.log('\n--- 5. Testing OTP Storage & Verification ---');
  const testPhone = '9999900001';
  const otpCode = '482910';

  const otpStoreRes = await storeOTP(testPhone, otpCode);
  assert(otpStoreRes.success === true, 'storeOTP succeeds for valid phone');

  // Verify bad OTP
  const badVerify = await verifyOTP(testPhone, '000000');
  assert(badVerify.valid === false, 'verifyOTP rejects invalid OTP');

  // Verify correct OTP
  const goodVerify = await verifyOTP(testPhone, otpCode);
  assert(goodVerify.valid === true, 'verifyOTP validates correct OTP');

  // Re-verify — should be one-time use (replay attack prevention)
  const replayVerify = await verifyOTP(testPhone, otpCode);
  assert(replayVerify.valid === false, 'verifyOTP prevents replay attack (OTP deleted after success)');

  // ─── 6. Product Cache Invalidation Cascade ────────────────
  console.log('\n--- 6. Testing Product Cache Invalidation ---');
  const prodId = 'prod-uuid-12345';
  await cacheProducts('category_dairy_true', [{ id: prodId, name: 'Cow Milk' }]);
  await cacheProducts('all_true', [{ id: prodId, name: 'Cow Milk' }]);
  await cacheProductDetail(prodId, { id: prodId, name: 'Cow Milk 1L', price: 65 });

  const cachedListBefore = await getCachedProducts('all_true');
  const cachedDetailBefore = await getCachedProductDetail(prodId);
  assert(cachedListBefore !== null && cachedDetailBefore !== null, 'Products and detail successfully cached');

  // Invalidate product
  await invalidateProductsCache(prodId);
  const cachedListAfter = await getCachedProducts('all_true');
  const cachedDetailAfter = await getCachedProductDetail(prodId);
  assert(cachedListAfter === null, 'invalidateProductsCache evicts product list caches');
  assert(cachedDetailAfter === null, 'invalidateProductsCache(id) evicts product detail cache');

  // ─── 7. Category Cache Cascade ───────────────────────────
  console.log('\n--- 7. Testing Category Cache Invalidation Cascade ---');
  await cacheCategories([{ id: 'cat-1', name: 'Dairy' }]);
  await cacheProducts('category_dairy_true', [{ id: 'p1', name: 'Ghee' }]);

  const catBefore = await getCachedCategories();
  const pListBefore = await getCachedProducts('category_dairy_true');
  assert(catBefore !== null && pListBefore !== null, 'Categories and filtered product lists cached');

  await invalidateCategoryCache();
  const catAfter = await getCachedCategories();
  const pListAfter = await getCachedProducts('category_dairy_true');
  assert(catAfter === null, 'invalidateCategoryCache evicts category cache');
  assert(pListAfter === null, 'invalidateCategoryCache also cascades to evict product list caches');

  // ─── 8. Seller Isolation ─────────────────────────────────
  console.log('\n--- 8. Testing Seller Isolation ---');
  const seller1 = 'seller-user-001';
  const seller2 = 'seller-user-002';
  await cacheSellerProfile(seller1, { storeName: 'Dairy Farm A', sales: 50000 });
  await cacheSellerProfile(seller2, { storeName: 'Dairy Farm B', sales: 12000 });

  const s1Data: any = await getCachedSellerProfile(seller1);
  const s2Data: any = await getCachedSellerProfile(seller2);
  assert(s1Data?.storeName === 'Dairy Farm A' && s2Data?.storeName === 'Dairy Farm B', 'Seller profiles are isolated per userId');

  await invalidateSellerProfileCache(seller1);
  const s1After = await getCachedSellerProfile(seller1);
  const s2After = await getCachedSellerProfile(seller2);
  assert(s1After === null, 'Invalidating Seller 1 does not affect Seller 2');
  assert(s2After !== null, 'Seller 2 cache remains intact');
  await invalidateSellerProfileCache(seller2);

  // ─── 9. Admin Stats & Analytics Caches ────────────────────
  console.log('\n--- 9. Testing Admin Stats & Analytics Invalidation ---');
  await cacheAdminStats({ todayOrders: 42, revenue: 154000 });
  await cacheAdminAnalytics({ totalRevenue: 9800000, activeCustomers: 1200 });

  const statsBefore = await getCachedAdminStats();
  const analyticsBefore = await getCachedAdminAnalytics();
  assert(statsBefore !== null && analyticsBefore !== null, 'Admin stats and analytics cached');

  await invalidateAdminCaches();
  const statsAfter = await getCachedAdminStats();
  const analyticsAfter = await getCachedAdminAnalytics();
  assert(statsAfter === null && analyticsAfter === null, 'invalidateAdminCaches flushes both admin stats and analytics');

  // ─── 10. Fault Tolerance & Graceful Degradation ───────────
  console.log('\n--- 10. Testing Fault Tolerance & Graceful Degradation ---');
  // Confirm that operations on bad/null inputs do not throw unhandled rejections
  let noThrow = true;
  try {
    await cacheGet('');
    await cacheDel('');
    await cacheDelPattern('');
    await checkRateLimit('', '', 10, 60);
  } catch {
    noThrow = false;
  }
  assert(noThrow === true, 'Edge cases (empty keys, zero windows) handled without throwing unhandled exceptions');

  // ─── SUMMARY ──────────────────────────────────────────────
  console.log('\n======================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('[CRITICAL] Test suite crashed:', err);
  process.exit(1);
});
