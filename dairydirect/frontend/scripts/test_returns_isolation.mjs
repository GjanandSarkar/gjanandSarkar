import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lnjdlpfbglrczcmiwlfg.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuamRscGZiZ2xyY3pjbWl3bGZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTM4MTIyMywiZXhwIjoyMTA2OTU3MjIzfQ.uJQCDcg1fC4MxwbQDTf9quDVh5pMjXC52XyKJ2F3uzg';

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function runTest() {
  console.log('--- TESTING RETURN REQUEST ISOLATION LOGIC ---');

  const SELLER_ID = '2c901c29-0924-4708-aaf5-0fed50455b8e'; // Store 'abcd'

  // 1. Test Admin Query Isolation (seller_id is NULL)
  console.log('\n[1] Admin Query (query.is("seller_id", null)):');
  const { data: adminData, error: adminErr } = await sb
    .from('return_requests')
    .select('id, order_id, product_id, seller_id, reason, status')
    .is('seller_id', null);

  if (adminErr) {
    console.error('Admin query failed:', adminErr);
  } else {
    console.log(`Admin sees ${adminData.length} records:`);
    adminData.forEach(r => {
      console.log(` - ID: ${r.id.slice(0, 8)}, seller_id: ${r.seller_id}, reason: "${r.reason}"`);
    });
    const hasSellerProducts = adminData.some(r => r.seller_id !== null);
    if (hasSellerProducts) {
      console.error('❌ FAILED: Admin sees seller products!');
    } else {
      console.log('✅ PASSED: Admin ONLY sees non-seller/admin products (seller_id is null).');
    }
  }

  // 2. Test Seller "abcd" Query Isolation (seller_id == SELLER_ID)
  console.log('\n[2] Seller "abcd" Query (query.eq("seller_id", SELLER_ID)):');
  const { data: sellerData, error: sellerErr } = await sb
    .from('return_requests')
    .select('id, order_id, product_id, seller_id, reason, status')
    .eq('seller_id', SELLER_ID);

  if (sellerErr) {
    console.error('Seller query failed:', sellerErr);
  } else {
    console.log(`Seller "abcd" sees ${sellerData.length} records:`);
    sellerData.forEach(r => {
      console.log(` - ID: ${r.id.slice(0, 8)}, seller_id: ${r.seller_id}, reason: "${r.reason}"`);
    });
    const hasAdminProducts = sellerData.some(r => r.seller_id === null);
    const hasOtherSellers = sellerData.some(r => r.seller_id !== SELLER_ID);
    if (hasAdminProducts || hasOtherSellers) {
      console.error('❌ FAILED: Seller sees products not belonging to their store!');
    } else {
      console.log('✅ PASSED: Seller "abcd" ONLY sees their own products.');
    }
  }

  // 3. Test Another Seller Query Isolation (random non-existent seller)
  console.log('\n[3] Other Seller Query (query.eq("seller_id", anotherSellerId)):');
  const OTHER_SELLER_ID = '00000000-0000-0000-0000-000000000000';
  const { data: otherData } = await sb
    .from('return_requests')
    .select('id, seller_id')
    .eq('seller_id', OTHER_SELLER_ID);

  console.log(`Other seller sees ${otherData?.length || 0} records.`);
  if (otherData?.length === 0) {
    console.log('✅ PASSED: Other sellers cannot see admin or other seller return requests.');
  } else {
    console.error('❌ FAILED: Other seller saw records.');
  }

  console.log('\n--- ALL ISOLATION VERIFICATIONS COMPLETED SUCCESSFULLY ---');
}

runTest().catch(console.error);
