import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://awiyxxbzqjluoqowoiqk.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3aXl4eGJ6cWpsdW9xb3dvaXFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTkyNTg0OCwiZXhwIjoyMTAxNTAxODQ4fQ.DkAhrdot5Y-GPDwMZzyDLgSsVy8w1effRGshGxyYtlE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runTests() {
  console.log('====================================================');
  console.log('📦 RUNNING PRODUCTION INVENTORY SYNCHRONIZATION TESTS');
  console.log('====================================================\n');

  // 1. Get a test product and variant
  const { data: variants, error: vErr } = await supabase
    .from('product_variants')
    .select('id, product_id, weight, price, stock, reserved_quantity, available_quantity')
    .limit(1);

  if (vErr || !variants || variants.length === 0) {
    throw new Error('No product variants found: ' + (vErr?.message || 'Empty'));
  }

  const testVariant = variants[0];
  console.log(`[SETUP] Selected Test Variant: ${testVariant.id} (${testVariant.weight})`);
  console.log(`[SETUP] Current stock: ${testVariant.stock}, reserved: ${testVariant.reserved_quantity}, available: ${testVariant.available_quantity}`);

  // Fetch or create a test user
  let { data: users } = await supabase.from('profiles').select('id, name, email').limit(1);
  let testUserId = users?.[0]?.id;
  if (!testUserId) {
    const { data: newUser } = await supabase.from('profiles').insert({
      phone: '9999999999',
      name: 'Test Customer',
      email: 'test@example.com',
      role: 'customer'
    }).select().single();
    testUserId = newUser.id;
  }

  // Fetch or create an address
  let { data: addresses } = await supabase.from('user_addresses').select('id').eq('user_id', testUserId).limit(1);
  let testAddressId = addresses?.[0]?.id;
  if (!testAddressId) {
    const { data: newAddr } = await supabase.from('user_addresses').insert({
      user_id: testUserId,
      label: 'Home',
      address: '123 Test St, Test City',
      pincode: '380001',
      is_default: true
    }).select().single();
    testAddressId = newAddr?.id;
  }

  // ── TEST 1: Baseline Single Source of Truth ──────────────────────────────
  console.log('\n--- TEST 1: Single Source of Truth & Formula Verification ---');
  const { data: freshVar } = await supabase
    .from('product_variants')
    .select('stock, reserved_quantity, available_quantity')
    .eq('id', testVariant.id)
    .single();

  const expectedAvailable = freshVar.stock - freshVar.reserved_quantity;
  if (freshVar.available_quantity !== expectedAvailable) {
    throw new Error(`Formula mismatch: available_quantity (${freshVar.available_quantity}) != stock - reserved (${expectedAvailable})`);
  }
  console.log('✅ Formula verified: available_quantity === stock - reserved_quantity');

  // Verify seller_product sync
  const { data: sellerProducts } = await supabase
    .from('seller_product')
    .select('stock')
    .eq('variant_id', testVariant.id);
  
  if (sellerProducts && sellerProducts.length > 0) {
    for (const sp of sellerProducts) {
      if (sp.stock !== freshVar.available_quantity) {
        throw new Error(`Seller product stock (${sp.stock}) does not match variant available_quantity (${freshVar.available_quantity})`);
      }
    }
    console.log(`✅ Seller product mirrors variant available_quantity (${freshVar.available_quantity})`);
  }

  // ── TEST 2: Atomic Reservation & Expiry/Release ──────────────────────────
  console.log('\n--- TEST 2: Atomic Reservation & Release ---');
  const initialAvailable = freshVar.available_quantity;
  const initialReserved = freshVar.reserved_quantity;

  const { data: resResult, error: resErr } = await supabase.rpc('reserve_inventory_atomic', {
    p_user_id: testUserId,
    p_items: [{ variant_id: testVariant.id, quantity: 1 }],
    p_hold_seconds: 60
  });

  const reservationId = resResult?.reservations?.[0]?.reservation_id || resResult?.reservation_id;
  if (resErr || !reservationId) {
    throw new Error('reserve_inventory_atomic failed: ' + (resErr?.message || JSON.stringify(resResult)));
  }
  console.log(`✅ Reservation created successfully: ${reservationId}`);

  // Check that available_quantity decremented and reserved_quantity incremented
  const { data: postReserveVar } = await supabase
    .from('product_variants')
    .select('stock, reserved_quantity, available_quantity')
    .eq('id', testVariant.id)
    .single();

  if (postReserveVar.reserved_quantity !== initialReserved + 1 || postReserveVar.available_quantity !== initialAvailable - 1) {
    throw new Error(`Reservation failed to update quantities properly: reserved=${postReserveVar.reserved_quantity}, available=${postReserveVar.available_quantity}`);
  }
  console.log(`✅ Quantities during reservation: reserved=${postReserveVar.reserved_quantity} (+1), available=${postReserveVar.available_quantity} (-1)`);

  // Release the reservation
  const { data: relResult, error: relErr } = await supabase.rpc('release_inventory_reservation_atomic', {
    p_reservation_id: reservationId,
    p_reason: 'Automated test release'
  });

  if (relErr || !relResult?.success) {
    throw new Error('release_inventory_reservation_atomic failed: ' + (relErr?.message || JSON.stringify(relResult)));
  }

  const { data: postReleaseVar } = await supabase
    .from('product_variants')
    .select('stock, reserved_quantity, available_quantity')
    .eq('id', testVariant.id)
    .single();

  if (postReleaseVar.reserved_quantity !== initialReserved || postReleaseVar.available_quantity !== initialAvailable) {
    throw new Error('Release failed to restore stock properly');
  }
  console.log('✅ Stock released successfully and restored to original baseline');

  // ── TEST 3: Concurrent Purchase / Race Condition Simulation ─────────────
  console.log('\n--- TEST 3: Concurrent Purchase & Overselling Prevention ---');
  // Set variant stock temporarily to exactly 1 available unit
  await supabase
    .from('product_variants')
    .update({ stock: 1, reserved_quantity: 0 })
    .eq('id', testVariant.id);

  console.log('Set variant stock to exactly 1 unit (available = 1)');

  const orderPayload = {
    p_user_id: testUserId,
    p_address_id: testAddressId,
    p_shipping_address: '123 Test St, Test City',
    p_delivery_slot: 'morning1',
    p_delivery_date: new Date().toISOString(),
    p_notes: 'Concurrent test order',
    p_payment_method: 'cod',
    p_items: [{
      product_id: testVariant.product_id,
      variant_id: testVariant.id,
      quantity: 1,
      price: Number(testVariant.price)
    }],
    p_coupon_code: null,
    p_razorpay_order_id: null,
    p_razorpay_payment_id: null,
    p_razorpay_signature: null,
    p_reservation_id: null
  };

  // Launch two order requests in parallel simulating 2 customers clicking "Place Order" at the exact same millisecond
  console.log('⚡ Launching 2 concurrent order requests competing for 1 unit...');
  const [attempt1, attempt2] = await Promise.allSettled([
    supabase.rpc('place_order_atomic', orderPayload),
    supabase.rpc('place_order_atomic', orderPayload)
  ]);

  const res1 = attempt1.status === 'fulfilled' ? attempt1.value : { error: attempt1.reason };
  const res2 = attempt2.status === 'fulfilled' ? attempt2.value : { error: attempt2.reason };

  const success1 = !res1.error && res1.data?.order_id;
  const success2 = !res2.error && res2.data?.order_id;

  console.log(`Attempt 1: ${success1 ? 'SUCCESS (Order ' + res1.data.order_id + ')' : 'FAILED (' + (res1.error?.message || res1.data?.error) + ')'}`);
  console.log(`Attempt 2: ${success2 ? 'SUCCESS (Order ' + res2.data.order_id + ')' : 'FAILED (' + (res2.error?.message || res2.data?.error) + ')'}`);

  // Assert exactly ONE succeeded and ONE failed
  const successCount = (success1 ? 1 : 0) + (success2 ? 1 : 0);
  if (successCount !== 1) {
    throw new Error(`Concurrency violation! Expected exactly 1 order to succeed, but ${successCount} succeeded.`);
  }
  console.log('✅ Concurrency protection PASSED: Exactly 1 order succeeded, preventing overselling!');

  const successfulOrderId = success1 ? res1.data.order_id : res2.data.order_id;

  // Check remaining stock: must be exactly 0, never negative
  const { data: stockAfterRace } = await supabase
    .from('product_variants')
    .select('stock, reserved_quantity, available_quantity')
    .eq('id', testVariant.id)
    .single();

  if (stockAfterRace.stock !== 0 || stockAfterRace.available_quantity !== 0) {
    throw new Error(`Stock after race condition is invalid: stock=${stockAfterRace.stock}, available=${stockAfterRace.available_quantity}`);
  }
  console.log(`✅ Stock after race: stock=${stockAfterRace.stock}, available=${stockAfterRace.available_quantity} (0 overselling)`);

  // Verify inventory_transactions audit ledger has the deduction
  const { data: txList } = await supabase
    .from('inventory_transactions')
    .select('*')
    .eq('order_id', successfulOrderId)
    .eq('change_type', 'purchase');

  if (!txList || txList.length === 0 || txList[0].quantity_change !== -1) {
    throw new Error('Audit ledger inventory_transactions missing order deduction record');
  }
  console.log(`✅ Audit ledger verified: Recorded transaction ID ${txList[0].id} with delta ${txList[0].quantity_change}`);

  // ── TEST 4: Order Cancellation & Inventory Restoration ──────────────────
  console.log('\n--- TEST 4: Order Cancellation & Stock Restoration ---');
  const { data: cancelRes, error: cancelErr } = await supabase.rpc('cancel_order_atomic', {
    p_order_id: successfulOrderId,
    p_actor_id: testUserId,
    p_reason: 'Automated test order cancellation'
  });

  if (cancelErr || !cancelRes?.success) {
    throw new Error('cancel_order_atomic failed: ' + (cancelErr?.message || JSON.stringify(cancelRes)));
  }
  console.log(`✅ Order cancelled successfully: ${successfulOrderId}`);

  // Verify stock was restored to 1
  const { data: stockAfterCancel } = await supabase
    .from('product_variants')
    .select('stock, reserved_quantity, available_quantity')
    .eq('id', testVariant.id)
    .single();

  if (stockAfterCancel.stock !== 1 || stockAfterCancel.available_quantity !== 1) {
    throw new Error(`Stock was not restored after cancellation: stock=${stockAfterCancel.stock}, available=${stockAfterCancel.available_quantity}`);
  }
  console.log(`✅ Stock restored to 1 unit: stock=${stockAfterCancel.stock}, available=${stockAfterCancel.available_quantity}`);

  // Verify inventory_transactions cancellation record
  const { data: cancelTxList } = await supabase
    .from('inventory_transactions')
    .select('*')
    .eq('order_id', successfulOrderId)
    .eq('change_type', 'cancellation');

  if (!cancelTxList || cancelTxList.length === 0 || cancelTxList[0].quantity_change !== 1) {
    throw new Error('Audit ledger missing cancellation restoration record');
  }
  console.log(`✅ Audit ledger verified: Recorded cancellation transaction with delta +${cancelTxList[0].quantity_change}`);

  // ── TEST 5: Reset Variant Stock to Original Level ───────────────────────
  console.log('\n--- TEST 5: Restoring Original Variant Stock ---');
  await supabase
    .from('product_variants')
    .update({ stock: testVariant.stock, reserved_quantity: testVariant.reserved_quantity })
    .eq('id', testVariant.id);
  console.log(`✅ Restored test variant stock to original value: ${testVariant.stock}`);

  console.log('\n====================================================');
  console.log('🎉 ALL INVENTORY SYNCHRONIZATION TESTS PASSED 100%!');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
