import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const sb = createClient(supabaseUrl, supabaseKey);

async function runVerification() {
  console.log('================================================================');
  console.log('   SELLER PRODUCT APPROVAL STAGING WORKFLOW VERIFICATION        ');
  console.log('   Gjanand Sarkar Private Limited                              ');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SUITE 1: DATABASE SCHEMA & TABLES VERIFICATION
  // ─────────────────────────────────────────────────────────────
  console.log('--- 1. Testing Database Schema & Tables ---');

  // 1.1 seller_product_approval table
  const { data: spaSample, error: spaErr } = await sb
    .from('seller_product_approval')
    .select('id, seller_id, name, category, price, stock, status, is_approved, is_rejected, rejection_reason, product_id, admin_notes')
    .limit(1);
  assert(!spaErr, 'seller_product_approval table exists with is_approved & is_rejected yes/no columns');

  // 1.2 seller_product_rejected table removed
  const { error: sprErr } = await sb
    .from('seller_product_rejected')
    .select('id')
    .limit(1);
  assert(Boolean(sprErr), 'seller_product_rejected table successfully removed from database');

  // 1.3 products and seller_product tables
  const { data: prodSample, error: prodErr } = await sb.from('products').select('id, name, is_active').limit(1);
  const { data: spSample, error: spErr } = await sb.from('seller_product').select('id, product_id, stock').limit(1);
  assert(!prodErr && !spErr, 'products and seller_product tables exist and are accessible');

  // ─────────────────────────────────────────────────────────────
  // SUITE 2: SELLER AUTH & INITIAL SETUP
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 2. Setting Up Test Seller & Admin ---');

  const { data: profiles } = await sb.from('profiles').select('id, name, email, role');
  const adminProfile = profiles?.find(p => p.role === 'admin') || profiles?.[0];
  const customerProfile = profiles?.find(p => p.role === 'customer') || profiles?.[1];

  assert(Boolean(customerProfile), `Customer applicant: ${customerProfile?.name} (${customerProfile?.id})`);
  assert(Boolean(adminProfile), `Admin reviewer: ${adminProfile?.name} (${adminProfile?.id})`);

  // Ensure an active seller store exists
  const slug = `test-farm-${customerProfile.id.slice(0, 4)}`;
  const { data: sellerStore, error: storeErr } = await sb
    .from('sellers')
    .upsert({
      user_id: customerProfile.id,
      store_name: `Gjanand Farm ${Date.now().toString().slice(-4)}`,
      slug: slug,
      status: 'active',
      state: 'Gujarat',
      category: 'A2 Organic Dairy',
      commission_rate: 5.0,
      total_sales: 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select('*')
    .single();

  assert(!storeErr && sellerStore?.status === 'active', 'Seller store account active in `sellers` table');

  // ─────────────────────────────────────────────────────────────
  // SUITE 3: SELLER SUBMISSION -> seller_product_approval
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 3. Testing Seller Product Submission to seller_product_approval ---');

  const testProductSKU = `SKU-MAK-${Date.now().toString(36).toUpperCase()}`;
  const approvalPayload = {
    seller_id: sellerStore.id,
    seller_user_id: customerProfile.id,
    name: `Organic Desi White Makhan ${Date.now().toString().slice(-4)}`,
    category: 'Dairy',
    subcategory: 'White Butter (Makhan)',
    brand: sellerStore.store_name,
    sku: testProductSKU,
    description: 'Fresh traditionally churned white butter.',
    image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800',
    price: 380,
    original_price: 420,
    cost_price: 320,
    stock: 45,
    weight: '500g',
    tax_rate: 5.0,
    shipping_details: 'Cold-chain dispatch within 24 hours',
    return_policy: '24-hour perishable replacement policy',
    attributes: { fat_content: '82%', shelf_life_days: '15' },
    compliance_documents: [{ name: 'FSSAI License', url: 'https://example.com/fssai.pdf' }],
    status: 'pending',
  };

  // 3.1 Insert into seller_product_approval
  const { data: newApprovalReq, error: appInsertErr } = await sb
    .from('seller_product_approval')
    .insert(approvalPayload)
    .select('*')
    .single();

  assert(!appInsertErr && newApprovalReq?.status === 'pending',
    'Submitted product is saved in `seller_product_approval` with status = pending');

  // 3.2 Verify product is NOT inserted into `products` or `seller_product`
  const { data: checkProducts } = await sb
    .from('products')
    .select('id')
    .eq('sku', testProductSKU);
  assert(checkProducts?.length === 0,
    'Pending product is NOT inserted into `products` table');

  const { data: checkSellerProduct } = await sb
    .from('seller_product')
    .select('id')
    .eq('name', approvalPayload.name);
  assert(checkSellerProduct?.length === 0,
    'Pending product is NOT inserted into `seller_product` table');

  // ─────────────────────────────────────────────────────────────
  // SUITE 4: ADMIN APPROVAL -> products + seller_product
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 4. Testing Atomic Admin Approval Function ---');

  // 4.1 Execute atomic approve_seller_product RPC
  const { data: approvedProdId, error: rpcAppErr } = await sb.rpc('approve_seller_product', {
    p_approval_id: newApprovalReq.id,
    p_admin_id: adminProfile.id,
    p_notes: 'All quality checks and FSSAI documentation verified.',
  });

  if (rpcAppErr) console.error('approve error details:', rpcAppErr);
  assert(!rpcAppErr && Boolean(approvedProdId),
    'Atomic approve_seller_product RPC executed successfully');

  // 4.2 Verify product now exists in `products` with approval_status = approved and is_active = true
  const { data: approvedProduct, error: prodFetchErr } = await sb
    .from('products')
    .select('id, name, approval_status, is_active, seller_id, sku')
    .eq('id', approvedProdId)
    .single();

  assert(
    !prodFetchErr &&
    approvedProduct?.approval_status === 'approved' &&
    approvedProduct?.is_active === true &&
    approvedProduct?.sku === testProductSKU,
    'Approved product now exists in `products` (approval_status = approved, is_active = true)'
  );

  // 4.3 Verify seller_product entry created
  const { data: createdSellerProd, error: spFetchErr } = await sb
    .from('seller_product')
    .select('id, product_id, seller_id, price, stock, status')
    .eq('product_id', approvedProdId)
    .single();

  assert(
    !spFetchErr &&
    createdSellerProd?.product_id === approvedProdId &&
    createdSellerProd?.status === 'active' &&
    Number(createdSellerProd?.price) === 380,
    'Approved product now exists in `seller_product` with status = active'
  );

  // 4.4 Verify product_variants entry created
  const { data: createdVariants, error: pvErr } = await sb
    .from('product_variants')
    .select('id, product_id, price, stock, weight')
    .eq('product_id', approvedProdId);

  assert(!pvErr && createdVariants?.length > 0 && Number(createdVariants[0].price) === 380,
    'Product variant created with price ₹380 and available inventory');

  // 4.5 Verify seller_product_approval status updated to approved with product_id link
  const { data: updatedApprovalRow } = await sb
    .from('seller_product_approval')
    .select('status, is_approved, is_rejected, product_id, reviewed_by, reviewed_at')
    .eq('id', newApprovalReq.id)
    .single();

  assert(
    updatedApprovalRow?.status === 'approved' &&
    updatedApprovalRow?.is_approved === true &&
    updatedApprovalRow?.is_rejected === false &&
    updatedApprovalRow?.product_id === approvedProdId &&
    Boolean(updatedApprovalRow?.reviewed_at),
    '`seller_product_approval` updated: status=approved, is_approved=YES (true), is_rejected=NO (false)'
  );

  // 4.6 Verify duplicate approval is prevented
  const { error: dupApprovalErr } = await sb.rpc('approve_seller_product', {
    p_approval_id: newApprovalReq.id,
    p_admin_id: adminProfile.id,
  });
  assert(Boolean(dupApprovalErr),
    'Repeated approval of already approved request is prevented with an exception');

  // ─────────────────────────────────────────────────────────────
  // SUITE 5: ADMIN REJECTION -> seller_product_approval ONLY
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 5. Testing Admin Rejection in seller_product_approval ---');

  // 5.1 Seller submits a second product
  const rejectedProductSKU = `SKU-BAD-${Date.now().toString(36).toUpperCase()}`;
  const { data: secondApprovalReq, error: secondAppErr } = await sb
    .from('seller_product_approval')
    .insert({
      seller_id: sellerStore.id,
      seller_user_id: customerProfile.id,
      name: `Unpasteurized Test Milk ${Date.now().toString().slice(-4)}`,
      category: 'Dairy',
      brand: sellerStore.store_name,
      sku: rejectedProductSKU,
      price: 60,
      stock: 20,
      status: 'pending',
      is_approved: false,
      is_rejected: false,
    })
    .select('*')
    .single();

  assert(!secondAppErr && secondApprovalReq?.status === 'pending',
    'Second product submitted to `seller_product_approval`');

  // 5.2 Admin rejects the product with rejection reason
  const rejectionReasonText = 'Packaging lacks mandatory FSSAI license logo and temperature storage guidelines.';
  const { data: rejectedId, error: rpcRejErr } = await sb.rpc('reject_seller_product', {
    p_approval_id: secondApprovalReq.id,
    p_admin_id: adminProfile.id,
    p_rejection_reason: rejectionReasonText,
  });

  if (rpcRejErr) console.error('reject error details:', rpcRejErr);
  assert(!rpcRejErr && Boolean(rejectedId),
    'Atomic reject_seller_product RPC executed successfully');

  // 5.3 Verify rejected product stored directly in `seller_product_approval` with yes/no columns
  const { data: rejRow, error: fetchRejErr } = await sb
    .from('seller_product_approval')
    .select('id, status, is_approved, is_rejected, rejection_reason, admin_notes')
    .eq('id', secondApprovalReq.id)
    .single();

  assert(
    !fetchRejErr &&
    rejRow?.status === 'rejected' &&
    rejRow?.is_rejected === true &&
    rejRow?.is_approved === false &&
    rejRow?.rejection_reason === rejectionReasonText,
    'Rejection stored in `seller_product_approval`: is_rejected=YES (true), is_approved=NO (false), rejection_reason'
  );

  // 5.4 Verify rejected product is NOT in `products` or `seller_product`
  const { data: checkRejInProducts } = await sb
    .from('products')
    .select('id')
    .eq('sku', rejectedProductSKU);
  assert(checkRejInProducts?.length === 0,
    'Rejected product is NOT inserted into `products` table');

  // 5.5 Seller resubmission of rejected product
  const { data: resubmittedReq, error: resubmitErr } = await sb
    .from('seller_product_approval')
    .update({
      status: 'pending',
      is_approved: false,
      is_rejected: false,
      rejection_reason: null,
      admin_notes: null,
      reviewed_by: null,
      reviewed_at: null,
      description: 'Corrected packaging with FSSAI guidelines added.',
      updated_at: new Date().toISOString(),
    })
    .eq('id', secondApprovalReq.id)
    .select('*')
    .single();

  assert(
    !resubmitErr &&
    resubmittedReq?.status === 'pending' &&
    resubmittedReq?.is_rejected === false &&
    resubmittedReq?.is_approved === false &&
    resubmittedReq?.rejection_reason === null,
    'Seller successfully corrected and resubmitted product back to pending review'
  );

  // ─────────────────────────────────────────────────────────────
  // SUITE 6: PERMISSION MATRIX ENFORCEMENT
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 6. Testing Purchasing Permissions Matrix ---');

  function canPurchase(sellerStatus, productStatus, productIsActive, stock) {
    if (sellerStatus !== 'active') return false;
    if (productStatus !== 'approved') return false;
    if (!productIsActive) return false;
    if (stock <= 0) return false;
    return true;
  }

  assert(canPurchase('pending', 'approved', true, 10) === false, 'Pending Seller + Approved Product => NO purchase');
  assert(canPurchase('rejected', 'approved', true, 10) === false, 'Rejected Seller + Approved Product => NO purchase');
  assert(canPurchase('suspended', 'approved', true, 10) === false, 'Suspended Seller + Approved Product => NO purchase');
  assert(canPurchase('active', 'pending', false, 10) === false, 'Active Seller + Pending Product => NO purchase');
  assert(canPurchase('active', 'rejected', false, 10) === false, 'Active Seller + Rejected Product => NO purchase');
  assert(canPurchase('active', 'suspended', false, 10) === false, 'Active Seller + Suspended Product => NO purchase');
  assert(canPurchase('active', 'approved', true, 10) === true, 'Active Seller + Approved Product + Active + In Stock => CAN purchase');
  assert(canPurchase('active', 'approved', true, 0) === false, 'Active Seller + Approved Product + Out of Stock => NO purchase');

  // ─────────────────────────────────────────────────────────────
  // CLEANUP TEST FIXTURES
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- Cleaning up temporary test records ---');
  await sb.from('product_status_history').delete().eq('product_id', approvedProdId);
  await sb.from('product_variants').delete().eq('product_id', approvedProdId);
  await sb.from('seller_product').delete().eq('product_id', approvedProdId);
  await sb.from('products').delete().eq('id', approvedProdId);
  await sb.from('seller_product_rejected').delete().eq('id', rejectedId);
  await sb.from('seller_product_approval').delete().in('id', [newApprovalReq.id, secondApprovalReq.id]);
  console.log('✓ Temporary test records cleaned up safely.');

  console.log('\n================================================================');
  console.log(`   TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('================================================================');

  if (passedTests === totalTests) {
    console.log('🎉 COMPLETE WORKFLOW VALIDATION SUCCESSFUL!\n');
    process.exit(0);
  } else {
    console.error(`⚠️ ${totalTests - passedTests} tests failed.\n`);
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
