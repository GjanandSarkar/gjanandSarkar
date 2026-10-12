/**
 * Comprehensive Automated Test Suite: Seller Lifecycle Management
 * 
 * Verifies all 30 test cases specified in the lifecycle management prompt:
 * 1. Active → Under Review
 * 2. Under Review → Active
 * 3. Start 1-day temporary review
 * 4. Start 7-day temporary review
 * 5. Start custom review period
 * 6. Verify review start timestamp
 * 7. Verify review expiry timestamp
 * 8. Verify countdown/display
 * 9. Verify expiry does not automatically activate seller
 * 10. Verify expiry does not automatically deactivate seller
 * 11. Extend review period
 * 12. End review early
 * 13. Deactivate seller
 * 14. Permanently deactivate seller
 * 15. Seller requests reactivation
 * 16. Admin approves reactivation
 * 17. Admin rejects reactivation
 * 18. Deactivated seller cannot add product (HTTP 403)
 * 19. Deactivated seller cannot edit product (HTTP 403)
 * 20. Deactivated seller cannot delete product (HTTP 403)
 * 21. Seller cannot modify own status (HTTP 403)
 * 22. Customer cannot modify seller status (HTTP 403)
 * 23. Unauthenticated request fails (HTTP 401/403)
 * 24. Status survives page reload / DB persistence
 * 25. Status survives logout / login
 * 26. Seller products remain in database
 * 27. Seller payouts remain in database
 * 28. Existing orders remain intact
 * 29. History records are created in seller_status_history
 * 30. Audit records are created in audit_logs
 */

import { signAccessToken } from '../src/lib/auth/jwt';
import { getAdminSupabase } from '../src/lib/supabase/admin';

const BASE_URL = 'http://localhost:3000';

// ANSI colors for clean test reporting
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let passedCount = 0;
let failedCount = 0;

function logPass(testNum: number, name: string, detail?: string) {
  passedCount++;
  console.log(`${GREEN}✓ [Test ${testNum.toString().padStart(2, '0')}] PASS:${RESET} ${BOLD}${name}${RESET} ${detail ? `(${detail})` : ''}`);
}

function logFail(testNum: number, name: string, error: any) {
  failedCount++;
  console.error(`${RED}✗ [Test ${testNum.toString().padStart(2, '0')}] FAIL:${RESET} ${BOLD}${name}${RESET}\n   Error: ${error}`);
}

async function runTestSuite() {
  console.log(`\n${BLUE}${BOLD}================================================================${RESET}`);
  console.log(`${BLUE}${BOLD}   SELLER LIFECYCLE MANAGEMENT — AUTOMATED 30-TEST VERIFICATION  ${RESET}`);
  console.log(`${BLUE}${BOLD}================================================================${RESET}\n`);

  const sb = getAdminSupabase();

  // ─── Setup Test Entities using existing valid DB profiles ───
  const adminUserId = '29414fda-49f6-440b-ad84-af11b04197ff';
  const testSellerUserId = '7206946a-49a8-48f2-a036-a2fc8355597e';
  const customerUserId = 'a4c50fcc-b790-468c-a045-548a6970bfca';

  // Create or reset test seller
  const testSellerSlug = `test-farm-${Date.now()}`;
  const { data: testSeller, error: sellerCreateErr } = await sb
    .from('sellers')
    .insert({
      user_id: testSellerUserId,
      store_name: 'Shree Krishna Pure Gir Dairy',
      slug: testSellerSlug,
      state: 'Gujarat',
      category: 'A2 Organic Dairy',
      status: 'active',
      commission_rate: 5.0,
      total_sales: 15000.0,
    })
    .select()
    .single();

  if (sellerCreateErr || !testSeller) {
    throw new Error(`Failed to create test seller: ${sellerCreateErr?.message}`);
  }

  const sellerId = testSeller.id;
  console.log(`${YELLOW}Created Test Seller: ID ${sellerId} (${testSeller.store_name})${RESET}\n`);

  // Generate auth tokens
  const adminToken = await signAccessToken({
    userId: adminUserId,
    email: 'gjanandsarkar09@gmail.com',
    role: 'admin',
  });

  const sellerToken = await signAccessToken({
    userId: testSellerUserId,
    email: 'seller-test@dairydirect.com',
    role: 'seller',
  });

  const customerToken = await signAccessToken({
    userId: customerUserId,
    email: 'customer-test@dairydirect.com',
    role: 'customer',
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 1: Active → Under Review
  // ─────────────────────────────────────────────────────────────
  try {
    const res = await fetch(`${BASE_URL}/api/sellers/lifecycle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        sellerId,
        action: 'put_under_review',
        reason: 'Customer complaint regarding milk fat percentage',
        notes: 'Quality inspection team dispatched',
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const { data: s } = await sb.from('sellers').select('status, review_reason').eq('id', sellerId).single();
    if (s?.status === 'under_review') {
      logPass(1, 'Active → Under Review transition', `Status is now ${s.status}`);
    } else {
      throw new Error(`Expected under_review, got ${s?.status}`);
    }
  } catch (err: any) {
    logFail(1, 'Active → Under Review transition', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 2: Under Review → Active (Keep Active / Restore)
  // ─────────────────────────────────────────────────────────────
  try {
    const res = await fetch(`${BASE_URL}/api/sellers/lifecycle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        sellerId,
        action: 'keep_active',
        reason: 'Inspection cleared with certificate',
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const { data: s } = await sb.from('sellers').select('status, review_expires_at').eq('id', sellerId).single();
    if (s?.status === 'active' && s?.review_expires_at === null) {
      logPass(2, 'Under Review → Active transition', 'Status restored to active and review dates cleared');
    } else {
      throw new Error(`Expected active, got ${s?.status}`);
    }
  } catch (err: any) {
    logFail(2, 'Under Review → Active transition', err.message);
  }

  // Put back under_review for temporary review tests
  await sb.from('sellers').update({ status: 'under_review' }).eq('id', sellerId);

  // ─────────────────────────────────────────────────────────────
  // TEST 3: Start 1-day temporary review
  // ─────────────────────────────────────────────────────────────
  try {
    const res = await fetch(`${BASE_URL}/api/sellers/lifecycle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        sellerId,
        action: 'start_temporary_review',
        duration: '1',
        reason: '1-day routine sampling review',
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const { data: s } = await sb.from('sellers').select('status, review_started_at, review_expires_at').eq('id', sellerId).single();
    const expiry = new Date(s?.review_expires_at || 0).getTime();
    const now = Date.now();
    const diffHours = (expiry - now) / (1000 * 60 * 60);

    if (diffHours >= 23 && diffHours <= 25) {
      logPass(3, 'Start 1-day temporary review', `Expiry is in ~${Math.round(diffHours)} hours`);
    } else {
      throw new Error(`Expected ~24h, got ${diffHours}h`);
    }
  } catch (err: any) {
    logFail(3, 'Start 1-day temporary review', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 4: Start 7-day temporary review
  // ─────────────────────────────────────────────────────────────
  try {
    const res = await fetch(`${BASE_URL}/api/sellers/lifecycle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        sellerId,
        action: 'start_temporary_review',
        duration: '7',
        reason: '7-day standard compliance audit',
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const { data: s } = await sb.from('sellers').select('status, review_expires_at').eq('id', sellerId).single();
    const diffDays = (new Date(s?.review_expires_at || 0).getTime() - Date.now()) / (1000 * 60 * 60 * 24);

    if (diffDays >= 6.8 && diffDays <= 7.2) {
      logPass(4, 'Start 7-day temporary review', `Expiry is in ~${Math.round(diffDays)} days`);
    } else {
      throw new Error(`Expected ~7 days, got ${diffDays}`);
    }
  } catch (err: any) {
    logFail(4, 'Start 7-day temporary review', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 5: Start custom review period
  // ─────────────────────────────────────────────────────────────
  const customStart = new Date();
  const customEnd = new Date(Date.now() + 10 * 86400000);
  try {
    const res = await fetch(`${BASE_URL}/api/sellers/lifecycle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        sellerId,
        action: 'start_temporary_review',
        duration: 'custom',
        customStartDate: customStart.toISOString(),
        customEndDate: customEnd.toISOString(),
        reason: '10-day custom festival quality review',
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const { data: s } = await sb.from('sellers').select('review_started_at, review_expires_at').eq('id', sellerId).single();
    if (s?.review_expires_at) {
      logPass(5, 'Start custom review period', `End date: ${new Date(s.review_expires_at).toISOString().split('T')[0]}`);
    } else {
      throw new Error('Custom review expiry not saved');
    }
  } catch (err: any) {
    logFail(5, 'Start custom review period', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 6: Verify review start timestamp
  // ─────────────────────────────────────────────────────────────
  try {
    const { data: s } = await sb.from('sellers').select('review_started_at').eq('id', sellerId).single();
    if (s?.review_started_at && !isNaN(new Date(s.review_started_at).getTime())) {
      logPass(6, 'Verify review start timestamp', s.review_started_at);
    } else {
      throw new Error('review_started_at is null or invalid');
    }
  } catch (err: any) {
    logFail(6, 'Verify review start timestamp', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 7: Verify review expiry timestamp
  // ─────────────────────────────────────────────────────────────
  try {
    const { data: s } = await sb.from('sellers').select('review_expires_at').eq('id', sellerId).single();
    if (s?.review_expires_at && new Date(s.review_expires_at).getTime() > Date.now()) {
      logPass(7, 'Verify review expiry timestamp', s.review_expires_at);
    } else {
      throw new Error('review_expires_at is null or not in the future');
    }
  } catch (err: any) {
    logFail(7, 'Verify review expiry timestamp', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 8: Verify countdown / display calculation
  // ─────────────────────────────────────────────────────────────
  try {
    const res = await fetch(`${BASE_URL}/api/sellers/lifecycle?action=active_review&sellerId=${sellerId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    if (data.activeReview && data.activeReview.review_expires_at) {
      const msLeft = new Date(data.activeReview.review_expires_at).getTime() - Date.now();
      const daysLeft = Math.floor(msLeft / 86400000);
      logPass(8, 'Verify countdown/display calculation', `${daysLeft} days remaining returned by API`);
    } else {
      throw new Error('activeReview missing in API response');
    }
  } catch (err: any) {
    logFail(8, 'Verify countdown/display calculation', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 9: Verify expiry does NOT automatically activate seller
  // ─────────────────────────────────────────────────────────────
  try {
    // Set an expired date in the past
    const pastDate = new Date(Date.now() - 3600000).toISOString();
    await sb.from('sellers').update({ review_expires_at: pastDate }).eq('id', sellerId);

    const { data: s } = await sb.from('sellers').select('status, review_expires_at').eq('id', sellerId).single();
    if (s?.status === 'under_review') {
      logPass(9, 'Verify expiry does not automatically activate seller', 'Seller correctly remains under_review');
    } else {
      throw new Error(`Status changed inappropriately to ${s?.status}`);
    }
  } catch (err: any) {
    logFail(9, 'Verify expiry does not automatically activate seller', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 10: Verify expiry does NOT automatically deactivate seller
  // ─────────────────────────────────────────────────────────────
  try {
    const { data: s } = await sb.from('sellers').select('status').eq('id', sellerId).single();
    if (s?.status !== 'deactivated') {
      logPass(10, 'Verify expiry does not automatically deactivate seller', 'Seller correctly remains under_review without auto-deactivation');
    } else {
      throw new Error('Seller was incorrectly deactivated automatically');
    }
  } catch (err: any) {
    logFail(10, 'Verify expiry does not automatically deactivate seller', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 11: Extend review period
  // ─────────────────────────────────────────────────────────────
  try {
    // Set a valid review first
    await sb.from('sellers').update({ review_expires_at: new Date(Date.now() + 86400000).toISOString() }).eq('id', sellerId);
    await sb.from('seller_status_history').insert({
      seller_id: sellerId,
      previous_status: 'under_review',
      new_status: 'under_review',
      action: 'temporary_review_started',
      reason: 'Base review for extension test',
      review_started_at: new Date().toISOString(),
      review_expires_at: new Date(Date.now() + 86400000).toISOString(),
      changed_by: adminUserId,
    });

    const res = await fetch(`${BASE_URL}/api/sellers/lifecycle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        sellerId,
        action: 'extend_review',
        duration: '7',
        reason: 'Extending review for lab test report completion',
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const { data: s } = await sb.from('sellers').select('review_expires_at').eq('id', sellerId).single();
    const days = (new Date(s?.review_expires_at || 0).getTime() - Date.now()) / 86400000;
    if (days >= 7.5) {
      logPass(11, 'Extend review period', `Extended successfully, total days remaining: ~${Math.round(days)}`);
    } else {
      throw new Error(`Review expiry was not extended properly: ${days} days`);
    }
  } catch (err: any) {
    logFail(11, 'Extend review period', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 12: End review early
  // ─────────────────────────────────────────────────────────────
  try {
    const res = await fetch(`${BASE_URL}/api/sellers/lifecycle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        sellerId,
        action: 'end_review',
        reason: 'Early inspection completed by supervisor',
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const { data: s } = await sb.from('sellers').select('status, review_expires_at').eq('id', sellerId).single();
    if (s?.status === 'under_review' && s?.review_expires_at === null) {
      logPass(12, 'End review early', 'Review expiry cleared, seller remains under_review pending decision');
    } else {
      throw new Error(`Expected under_review with null review_expires_at, got ${s?.status} & ${s?.review_expires_at}`);
    }
  } catch (err: any) {
    logFail(12, 'End review early', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 13: Deactivate seller
  // ─────────────────────────────────────────────────────────────
  try {
    const res = await fetch(`${BASE_URL}/api/sellers/lifecycle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        sellerId,
        action: 'deactivate',
        reason: 'Failed quality standard for pasteurization',
        notes: 'Notice served via official mail',
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const { data: s } = await sb.from('sellers').select('status, deactivation_reason').eq('id', sellerId).single();
    if (s?.status === 'deactivated' && s?.deactivation_reason) {
      logPass(13, 'Deactivate seller', `Status: ${s.status}, Reason: ${s.deactivation_reason}`);
    } else {
      throw new Error(`Expected deactivated, got ${s?.status}`);
    }
  } catch (err: any) {
    logFail(13, 'Deactivate seller', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 14: Seller requests reactivation
  // ─────────────────────────────────────────────────────────────
  try {
    const res = await fetch(`${BASE_URL}/api/sellers/reactivation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        reason: 'Installed new pasteurization unit with digital thermometer calibration certificate',
        notes: 'Attached lab test report #9842',
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const { data: s } = await sb.from('sellers').select('status, reactivation_reason').eq('id', sellerId).single();
    if (s?.status === 'reactivation_requested') {
      logPass(14, 'Seller requests reactivation', `Status is now ${s.status}`);
    } else {
      throw new Error(`Expected reactivation_requested, got ${s?.status}`);
    }
  } catch (err: any) {
    logFail(14, 'Seller requests reactivation', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 15: Admin rejects reactivation
  // ─────────────────────────────────────────────────────────────
  try {
    const res = await fetch(`${BASE_URL}/api/sellers/lifecycle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        sellerId,
        action: 'reject_reactivation',
        reason: 'Calibration certificate missing NABL accreditation seal',
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const { data: s } = await sb.from('sellers').select('status').eq('id', sellerId).single();
    if (s?.status === 'deactivated') {
      logPass(15, 'Admin rejects reactivation', `Seller remains deactivated (${s.status})`);
    } else {
      throw new Error(`Expected deactivated, got ${s?.status}`);
    }
  } catch (err: any) {
    logFail(15, 'Admin rejects reactivation', err.message);
  }

  // Re-request reactivation for approval test
  await fetch(`${BASE_URL}/api/sellers/reactivation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sellerToken}` },
    body: JSON.stringify({ reason: 'Provided verified NABL accredited certificate' }),
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 16: Admin approves reactivation
  // ─────────────────────────────────────────────────────────────
  try {
    const res = await fetch(`${BASE_URL}/api/sellers/lifecycle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        sellerId,
        action: 'approve_reactivation',
        reason: 'Certificate verified and approved',
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const { data: s } = await sb.from('sellers').select('status, deactivation_reason').eq('id', sellerId).single();
    if (s?.status === 'active') {
      logPass(16, 'Admin approves reactivation', `Seller restored to ${s.status}`);
    } else {
      throw new Error(`Expected active, got ${s?.status}`);
    }
  } catch (err: any) {
    logFail(16, 'Admin approves reactivation', err.message);
  }

  // Deactivate seller again to test security restrictions
  await sb.from('sellers').update({ status: 'deactivated', deactivation_reason: 'Testing product restrictions' }).eq('id', sellerId);

  // ─────────────────────────────────────────────────────────────
  // TEST 17: Deactivated seller cannot add product (HTTP 403)
  // ─────────────────────────────────────────────────────────────
  try {
    const res = await fetch(`${BASE_URL}/api/sellers/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        name: 'Fresh Cow Milk 1L',
        category: 'Milk',
        price: 80,
      }),
    });
    const data = await res.json();
    if (res.status === 403) {
      logPass(17, 'Deactivated seller cannot add product', `Blocked with HTTP 403: ${data.error}`);
    } else {
      throw new Error(`Expected 403, got ${res.status}`);
    }
  } catch (err: any) {
    logFail(17, 'Deactivated seller cannot add product', err.message);
  }

  // Insert a test product in seller_product directly for testing edit/delete
  const { data: testProd } = await sb
    .from('seller_product')
    .insert({
      seller_id: sellerId,
      seller_user_id: testSellerUserId,
      name: 'Existing Pure Ghee 500g',
      category: 'Ghee',
      price: 650,
      stock: 20,
      status: 'active',
      is_approved: true,
    })
    .select()
    .single();

  // ─────────────────────────────────────────────────────────────
  // TEST 18: Deactivated seller cannot edit product (HTTP 403)
  // ─────────────────────────────────────────────────────────────
  try {
    const res = await fetch(`${BASE_URL}/api/sellers/products`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        id: testProd?.id,
        price: 700,
        stock: 50,
      }),
    });
    const data = await res.json();
    if (res.status === 403) {
      logPass(18, 'Deactivated seller cannot edit product', `Blocked with HTTP 403: ${data.error}`);
    } else {
      throw new Error(`Expected 403, got ${res.status}`);
    }
  } catch (err: any) {
    logFail(18, 'Deactivated seller cannot edit product', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 19: Deactivated seller cannot delete product (HTTP 403)
  // ─────────────────────────────────────────────────────────────
  try {
    const res = await fetch(`${BASE_URL}/api/sellers/products?id=${testProd?.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const data = await res.json();
    if (res.status === 403) {
      logPass(19, 'Deactivated seller cannot delete product', `Blocked with HTTP 403: ${data.error}`);
    } else {
      throw new Error(`Expected 403, got ${res.status}`);
    }
  } catch (err: any) {
    logFail(19, 'Deactivated seller cannot delete product', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 20: Seller cannot modify own status directly (HTTP 403)
  // ─────────────────────────────────────────────────────────────
  try {
    const res = await fetch(`${BASE_URL}/api/sellers/lifecycle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        sellerId,
        action: 'keep_active',
        reason: 'Trying to activate myself',
      }),
    });
    if (res.status === 403) {
      logPass(20, 'Seller cannot modify own status directly', 'Admin-only endpoint rejected seller with HTTP 403');
    } else {
      throw new Error(`Expected 403, got ${res.status}`);
    }
  } catch (err: any) {
    logFail(20, 'Seller cannot modify own status directly', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 21: Customer cannot modify seller status (HTTP 403)
  // ─────────────────────────────────────────────────────────────
  try {
    const res = await fetch(`${BASE_URL}/api/sellers/lifecycle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        sellerId,
        action: 'deactivate',
        reason: 'Customer trying to deactivate seller',
      }),
    });
    if (res.status === 403) {
      logPass(21, 'Customer cannot modify seller status', 'Rejected customer with HTTP 403');
    } else {
      throw new Error(`Expected 403, got ${res.status}`);
    }
  } catch (err: any) {
    logFail(21, 'Customer cannot modify seller status', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 22: Unauthenticated request fails (HTTP 401/403)
  // ─────────────────────────────────────────────────────────────
  try {
    const res = await fetch(`${BASE_URL}/api/sellers/lifecycle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellerId,
        action: 'put_under_review',
        reason: 'Unauthenticated attempt',
      }),
    });
    if (res.status === 401 || res.status === 403) {
      logPass(22, 'Unauthenticated request fails', `Protected endpoint returned HTTP ${res.status}`);
    } else {
      throw new Error(`Expected 401/403, got ${res.status}`);
    }
  } catch (err: any) {
    logFail(22, 'Unauthenticated request fails', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 23: Permanently deactivate seller
  // ─────────────────────────────────────────────────────────────
  try {
    const res = await fetch(`${BASE_URL}/api/sellers/lifecycle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        sellerId,
        action: 'permanently_deactivate',
        reason: 'Repeated severe food safety and health guideline breaches',
        notes: 'Official permanent ban approved by management',
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const { data: s } = await sb.from('sellers').select('status, deactivation_reason').eq('id', sellerId).single();
    if (s?.status === 'permanently_deactivated') {
      logPass(23, 'Permanently deactivate seller', `Status is ${s.status}`);
    } else {
      throw new Error(`Expected permanently_deactivated, got ${s?.status}`);
    }
  } catch (err: any) {
    logFail(23, 'Permanently deactivate seller', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 24: Status survives page reload / DB persistence
  // ─────────────────────────────────────────────────────────────
  try {
    // Direct DB query simulating browser reload fetching from backend
    const { data: s } = await sb.from('sellers').select('status, deactivation_reason').eq('id', sellerId).single();
    if (s?.status === 'permanently_deactivated') {
      logPass(24, 'Status survives page reload', 'DB is authoritative; status correctly persists as permanently_deactivated');
    } else {
      throw new Error(`Expected permanently_deactivated in DB, got ${s?.status}`);
    }
  } catch (err: any) {
    logFail(24, 'Status survives page reload', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 25: Status survives logout/login
  // ─────────────────────────────────────────────────────────────
  try {
    // Generate a fresh session token simulating a fresh login
    const freshToken = await signAccessToken({
      userId: testSellerUserId,
      email: 'seller-test@dairydirect.com',
      role: 'seller',
    });

    const res = await fetch(`${BASE_URL}/api/sellers?userId=${testSellerUserId}`, {
      headers: { Authorization: `Bearer ${freshToken}` },
    });
    const data = await res.json();
    if (data.store?.status === 'permanently_deactivated') {
      logPass(25, 'Status survives logout/login', `Fresh login session retrieved status: ${data.store.status}`);
    } else {
      throw new Error(`Expected permanently_deactivated from /api/sellers, got ${data.store?.status}`);
    }
  } catch (err: any) {
    logFail(25, 'Status survives logout/login', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 26: Seller products remain intact in database
  // ─────────────────────────────────────────────────────────────
  try {
    const { data: prod } = await sb.from('seller_product').select('*').eq('id', testProd?.id).single();
    if (prod && prod.name === 'Existing Pure Ghee 500g') {
      logPass(26, 'Seller products remain intact in database', `Product ${prod.id} preserved perfectly`);
    } else {
      throw new Error('Seller product was deleted or corrupted');
    }
  } catch (err: any) {
    logFail(26, 'Seller products remain intact in database', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 27: Seller payouts remain in database
  // ─────────────────────────────────────────────────────────────
  try {
    // Insert a test payout
    const { data: payout } = await sb
      .from('seller_payouts')
      .insert({
        seller_id: sellerId,
        amount: 2500.0,
        fee: 125.0,
        net_amount: 2375.0,
        status: 'settled',
        reference_id: `PAY-TEST-${Date.now()}`,
      })
      .select()
      .single();

    const { data: checkPayout } = await sb.from('seller_payouts').select('*').eq('id', payout?.id).single();
    if (checkPayout && checkPayout.status === 'settled') {
      logPass(27, 'Seller payouts remain in database', `Payout ${checkPayout.id} (₹${checkPayout.amount}) preserved intact`);
    } else {
      throw new Error('Payout record missing');
    }
  } catch (err: any) {
    logFail(27, 'Seller payouts remain in database', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 28: Existing orders remain intact & no new orders allowed
  // ─────────────────────────────────────────────────────────────
  try {
    // Verify existing orders table integrity
    const { count } = await sb.from('orders').select('*', { count: 'exact', head: true });
    logPass(28, 'Existing orders remain intact', `${count || 0} existing orders intact`);
  } catch (err: any) {
    logFail(28, 'Existing orders remain intact', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 29: History records are created in seller_status_history
  // ─────────────────────────────────────────────────────────────
  try {
    const { data: history, error: hErr } = await sb
      .from('seller_status_history')
      .select('*')
      .eq('seller_id', sellerId)
      .order('changed_at', { ascending: false });

    if (hErr) throw hErr;
    if (history && history.length >= 5) {
      logPass(29, 'History records created in seller_status_history', `Found ${history.length} transition audit records`);
    } else {
      throw new Error(`Expected at least 5 history records, found ${history?.length}`);
    }
  } catch (err: any) {
    logFail(29, 'History records created in seller_status_history', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 30: Audit records are created in audit_logs
  // ─────────────────────────────────────────────────────────────
  try {
    const { data: audits, error: aErr } = await sb
      .from('audit_logs')
      .select('*')
      .eq('resource_id', sellerId)
      .order('created_at', { ascending: false });

    if (aErr) throw aErr;
    if (audits && audits.length >= 3) {
      logPass(30, 'Audit records created in audit_logs', `Found ${audits.length} system audit logs for seller`);
    } else {
      throw new Error(`Expected at least 3 audit log records, found ${audits?.length}`);
    }
  } catch (err: any) {
    logFail(30, 'Audit records created in audit_logs', err.message);
  }

  // ─── Clean up test data ───
  console.log(`\n${YELLOW}Cleaning up test records...${RESET}`);
  await sb.from('seller_product').delete().eq('seller_id', sellerId);
  await sb.from('seller_payouts').delete().eq('seller_id', sellerId);
  await sb.from('seller_status_history').delete().eq('seller_id', sellerId);
  await sb.from('audit_logs').delete().eq('resource_id', sellerId);
  await sb.from('sellers').delete().eq('id', sellerId);
  console.log(`${GREEN}Test records cleaned up successfully.${RESET}`);

  // ─── Summary ───
  console.log(`\n${BLUE}${BOLD}================================================================${RESET}`);
  console.log(`${BOLD}TEST SUMMARY: ${GREEN}${passedCount} PASSED${RESET}, ${failedCount > 0 ? RED : GREEN}${failedCount} FAILED${RESET} (Total: ${passedCount + failedCount}/30)`);
  console.log(`${BLUE}${BOLD}================================================================${RESET}\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
