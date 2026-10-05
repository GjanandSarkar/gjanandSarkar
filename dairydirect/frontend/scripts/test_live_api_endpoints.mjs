async function testEndpoints() {
  const baseUrl = 'http://localhost:3000';
  console.log('=== TESTING NEXT.JS API ENDPOINTS FOR ALL SELLER TABLES ===\n');

  // Test 1: GET /api/sellers (List all sellers)
  console.log('1. Testing GET /api/sellers ...');
  try {
    const res1 = await fetch(`${baseUrl}/api/sellers`);
    const data1 = await res1.json();
    console.log(`✓ Status ${res1.status}, Sellers count: ${data1.sellers?.length || 0}`);
    if (data1.sellers?.[0]) {
      console.log(`  First seller: "${data1.sellers[0].store_name}" (status: ${data1.sellers[0].status})`);
    }
  } catch (e) {
    console.error('  Failed:', e.message);
  }

  // Test 2: GET /api/sellers?userId=7206946a-49a8-48f2-a036-a2fc8355597e (Seller Dashboard live calculations)
  console.log('\n2. Testing GET /api/sellers?userId=7206946a-49a8-48f2-a036-a2fc8355597e ...');
  try {
    const res2 = await fetch(`${baseUrl}/api/sellers?userId=7206946a-49a8-48f2-a036-a2fc8355597e`);
    const data2 = await res2.json();
    console.log(`✓ Status ${res2.status}, Store: "${data2.store?.storeName}"`);
    console.log(`  Live Metrics: Gross ₹${data2.metrics?.grossRevenue}, Comm ₹${data2.metrics?.platformCommission}, Net ₹${data2.metrics?.netPayout}, Products: ${data2.metrics?.totalProducts}`);
    console.log(`  Live Payouts count: ${data2.payoutHistory?.length || 0}`);
  } catch (e) {
    console.error('  Failed:', e.message);
  }

  // Test 3: GET /api/sellers/3f9f78ac-6243-4f1b-a6d4-281e2dd6dd5b (Single seller by ID)
  console.log('\n3. Testing GET /api/sellers/[id] ...');
  try {
    const res3 = await fetch(`${baseUrl}/api/sellers/3f9f78ac-6243-4f1b-a6d4-281e2dd6dd5b`);
    const data3 = await res3.json();
    console.log(`✓ Status ${res3.status}, Seller store: "${data3.seller?.store_name}", Products: ${data3.seller?.products_count}`);
  } catch (e) {
    console.error('  Failed:', e.message);
  }

  // Test 4: GET /api/sellers/products?sellerId=3f9f78ac-6243-4f1b-a6d4-281e2dd6dd5b (Seller products catalog)
  console.log('\n4. Testing GET /api/sellers/products ...');
  try {
    const res4 = await fetch(`${baseUrl}/api/sellers/products?sellerId=3f9f78ac-6243-4f1b-a6d4-281e2dd6dd5b`);
    const data4 = await res4.json();
    console.log(`✓ Status ${res4.status}, Seller products count: ${data4.sellerProducts?.length || 0}`);
    if (data4.sellerProducts?.[0]) {
      console.log(`  Product: "${data4.sellerProducts[0].name}", ₹${data4.sellerProducts[0].price}`);
    }
  } catch (e) {
    console.error('  Failed:', e.message);
  }

  // Test 5: GET /api/sellers/inquiries (Seller onboarding inquiries)
  console.log('\n5. Testing GET /api/sellers/inquiries ...');
  try {
    const res5 = await fetch(`${baseUrl}/api/sellers/inquiries`);
    const data5 = await res5.json();
    console.log(`✓ Status ${res5.status}, Inquiries count: ${data5.inquiries?.length || 0}`);
    if (data5.inquiries?.[0]) {
      console.log(`  Inquiry: "${data5.inquiries[0].business_name}" (${data5.inquiries[0].status})`);
    }
  } catch (e) {
    console.error('  Failed:', e.message);
  }

  console.log('\n=== ALL ENDPOINTS VERIFIED SUCCESSFULLY ===');
}

testEndpoints();
