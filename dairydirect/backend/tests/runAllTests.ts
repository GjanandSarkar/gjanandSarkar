import { setupMockDatabase } from './mockDatabase';
import { runPricingTests } from './unit/pricingService.test';
import { runJwtTests } from './unit/jwt.test';
import { runCryptoTests } from './unit/crypto.test';
import { runImageKitTests } from './unit/imageKitService.test';
import { runAuthIntegrationTests } from './integration/auth.test';

import { runProductsIntegrationTests } from './integration/products.test';
import { runOrdersIntegrationTests } from './integration/orders.test';
import { runAdminIntegrationTests } from './integration/admin.test';
import { runE2ETests } from './e2e/api.test';

async function main(): Promise<void> {
  // Initialize Mock DB Driver for isolated automated testing
  setupMockDatabase();

  console.log(`
============================================================
🧪 DairyDirect (Gjanand Sarkar) — Full Backend Test Suite
============================================================
`);

  const allResults: { name: string; passed: boolean; error?: string }[] = [];

  // 1. Unit Tests
  console.log('📦 Running Unit Tests...');
  allResults.push(...(await runPricingTests()));
  allResults.push(...(await runJwtTests()));
  allResults.push(...(await runCryptoTests()));
  allResults.push(...(await runImageKitTests()));


  // 2. Integration Tests
  console.log('🔗 Running Integration Tests...');
  allResults.push(...(await runAuthIntegrationTests()));
  allResults.push(...(await runProductsIntegrationTests()));
  allResults.push(...(await runOrdersIntegrationTests()));
  allResults.push(...(await runAdminIntegrationTests()));

  // 3. Complete HTTP End-to-End API Tests
  console.log('🌐 Running HTTP End-to-End API Tests...');
  allResults.push(...(await runE2ETests()));

  console.log('\n============================================================');
  console.log('📋 Comprehensive Test Execution Results:');
  console.log('============================================================');

  let passedCount = 0;
  let failedCount = 0;

  for (const res of allResults) {
    if (res.passed) {
      passedCount++;
      console.log(`  ✅ [PASS] ${res.name}`);
    } else {
      failedCount++;
      console.log(`  ❌ [FAIL] ${res.name}: ${res.error}`);
    }
  }

  console.log('============================================================');
  console.log(`Total Tests Executed : ${allResults.length}`);
  console.log(`Passed               : ${passedCount}`);
  console.log(`Failed               : ${failedCount}`);
  console.log('============================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All automated unit, integration, and E2E API tests passed successfully!\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
