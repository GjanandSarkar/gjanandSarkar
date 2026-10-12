/**
 * Comprehensive Automated Verification Suite for E-Commerce Delivery Address System
 */

import { signAccessToken } from '../src/lib/auth/jwt';

const BASE_URL = 'http://localhost:3000';

const USER_A_ID = 'a4c50fcc-b790-468c-a045-548a6970bfca'; // Customer A
const USER_B_ID = '7206946a-49a8-48f2-a036-a2fc8355597e'; // Customer B

let tokenA: string;
let tokenB: string;

let createdAddress1Id: string = '';
let createdAddress2Id: string = '';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING ADDRESS SYSTEM INTEGRATION TESTS');
  console.log('====================================================\n');

  tokenA = await signAccessToken({ userId: USER_A_ID, role: 'customer' });
  tokenB = await signAccessToken({ userId: USER_B_ID, role: 'customer' });

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`, detail || '');
      failed++;
    }
  }

  // ─── 1. Unauthenticated API Access Tests ───
  console.log('\n--- 1. Unauthenticated Security Tests ---');
  {
    const resGet = await fetch(`${BASE_URL}/api/addresses`);
    assert(resGet.status === 401, 'GET /api/addresses without token returns 401');

    const resPost = await fetch(`${BASE_URL}/api/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(resPost.status === 401, 'POST /api/addresses without token returns 401');

    const resPut = await fetch(`${BASE_URL}/api/addresses`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(resPut.status === 401, 'PUT /api/addresses without token returns 401');

    const resDel = await fetch(`${BASE_URL}/api/addresses?id=test`, { method: 'DELETE' });
    assert(resDel.status === 401, 'DELETE /api/addresses without token returns 401');
  }

  // ─── 2. Validation Tests ───
  console.log('\n--- 2. Validation Tests ---');
  {
    // Invalid pincode (5 digits)
    const resPin = await fetch(`${BASE_URL}/api/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        full_name: 'Amul Sureja',
        mobile_number: '9876543210',
        pincode: '12345', // Invalid
        flat_house_building: 'Flat 402',
        area_street_sector_village: 'Main Road',
        town_city: 'Ahmedabad',
        state: 'Gujarat',
      }),
    });
    assert(resPin.status === 400, 'Rejects invalid 5-digit pincode with 400');

    // Invalid mobile (letters / wrong length)
    const resMobile = await fetch(`${BASE_URL}/api/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        full_name: 'Amul Sureja',
        mobile_number: '98765', // Invalid
        pincode: '380015',
        flat_house_building: 'Flat 402',
        area_street_sector_village: 'Main Road',
        town_city: 'Ahmedabad',
        state: 'Gujarat',
      }),
    });
    assert(resMobile.status === 400, 'Rejects invalid mobile number with 400');

    // Missing required fields
    const resMissing = await fetch(`${BASE_URL}/api/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        full_name: '',
      }),
    });
    assert(resMissing.status === 400, 'Rejects missing required fields with 400');
  }

  // ─── 3. Address Creation & Default Logic ───
  console.log('\n--- 3. Address Creation & Single Default Logic ---');
  {
    // Clean up any remaining test addresses for User A to start with clean state
    const existingListRes = await fetch(`${BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    if (existingListRes.ok) {
      const existingData = await existingListRes.json();
      for (const addr of existingData.addresses || []) {
        await fetch(`${BASE_URL}/api/addresses/${addr.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${tokenA}` },
        });
      }
    }
    // Create Address 1 (User A)
    const res1 = await fetch(`${BASE_URL}/api/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        address_type: 'house',
        country: 'India',
        full_name: 'Anand Sureja',
        mobile_number: '9876543210',
        pincode: '388315',
        flat_house_building: 'House No. 25, Vasant Vihar',
        area_street_sector_village: 'Near Dairy Cross Road',
        landmark: 'Opp. Old Water Tank',
        town_city: 'Anand',
        state: 'Gujarat',
        saturday_delivery: true,
        sunday_delivery: false,
        delivery_instructions: 'Ring bell twice and leave package at front door',
        is_default: false,
      }),
    });

    const data1 = await res1.json();
    assert(res1.status === 201 && data1.success && data1.address?.id, 'Address 1 created successfully');
    createdAddress1Id = data1.address?.id;
    assert(data1.address?.is_default === true, 'First address automatically set as default');
    assert(data1.address?.sunday_delivery === false, 'Sunday delivery preference saved correctly');
    assert(data1.address?.address_type === 'house', 'Address type saved as house');
    assert(data1.address?.town_city === 'Anand', 'Town/city saved correctly');

    // Create Address 2 (User A) with is_default = true
    const res2 = await fetch(`${BASE_URL}/api/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        address_type: 'apartment',
        country: 'India',
        full_name: 'Anand Sureja Office',
        mobile_number: '9876543211',
        pincode: '380015',
        flat_house_building: 'Suite 402, Titanium City Centre',
        area_street_sector_village: '100 Feet Anandnagar Road, Prahladnagar',
        landmark: 'Near Sachin Tower',
        town_city: 'Ahmedabad',
        state: 'Gujarat',
        saturday_delivery: false,
        sunday_delivery: false,
        delivery_instructions: 'Deliver to 4th floor reception only',
        is_default: true,
      }),
    });

    const data2 = await res2.json();
    assert(res2.status === 201 && data2.success && data2.address?.id, 'Address 2 created successfully');
    createdAddress2Id = data2.address?.id;
    assert(data2.address?.is_default === true, 'Address 2 is default');

    // Fetch list and verify single default rule
    const resList = await fetch(`${BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const listData = await resList.json();
    const defaults = listData.addresses?.filter((a: any) => a.is_default);
    assert(defaults.length === 1, 'Only exactly 1 default address exists for User A');
    assert(defaults[0]?.id === createdAddress2Id, 'New default successfully superseded previous default');
  }

  // ─── 4. RESTful Single Address GET & Update ───
  console.log('\n--- 4. Single Address & Update Operations ---');
  {
    // GET /api/addresses/[id]
    const resGetSingle = await fetch(`${BASE_URL}/api/addresses/${createdAddress1Id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataGetSingle = await resGetSingle.json();
    assert(resGetSingle.status === 200 && dataGetSingle.address?.id === createdAddress1Id, 'GET /api/addresses/[id] returns address');

    // PUT /api/addresses/[id]
    const resUpdate = await fetch(`${BASE_URL}/api/addresses/${createdAddress1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        flat_house_building: 'House No. 25-B, Renovation Wing',
        town_city: 'Anand Urban',
        saturday_delivery: false,
      }),
    });

    const updateData = await resUpdate.json();
    assert(resUpdate.status === 200 && updateData.success, 'PUT /api/addresses/[id] succeeds');
    assert(updateData.address?.flat_house_building === 'House No. 25-B, Renovation Wing', 'Field updated successfully');
    assert(updateData.address?.address.includes('Renovation Wing'), 'Deterministic address string updated');
  }

  // ─── 5. Cross-User Security & Isolation ───
  console.log('\n--- 5. Cross-User Security & Isolation (User A vs User B) ---');
  {
    // User B attempts to GET User A's address
    const resCrossGet = await fetch(`${BASE_URL}/api/addresses/${createdAddress1Id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(resCrossGet.status === 404, 'User B cannot GET User A address (returns 404, no data leak)');

    // User B attempts to UPDATE User A's address
    const resCrossPut = await fetch(`${BASE_URL}/api/addresses/${createdAddress1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ full_name: 'Hacker Name' }),
    });
    assert(resCrossPut.status === 404, 'User B cannot UPDATE User A address (returns 404)');

    // User B attempts to DELETE User A's address
    const resCrossDel = await fetch(`${BASE_URL}/api/addresses/${createdAddress1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(resCrossDel.status === 404, 'User B cannot DELETE User A address (returns 404)');

    // User B attempts to POST with User A's userId in payload
    const resImpersonate = await fetch(`${BASE_URL}/api/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        userId: USER_A_ID, // Malicious spoof
        full_name: 'Spoofed Record',
        mobile_number: '9876543212',
        pincode: '380001',
        flat_house_building: 'Unit 1',
        area_street_sector_village: 'Street 1',
        town_city: 'City',
        state: 'Gujarat',
      }),
    });

    const spoofData = await resImpersonate.json();
    assert(
      resImpersonate.status === 201 && spoofData.address?.user_id === USER_B_ID,
      'Server derived user_id from token; ignored spoofed userId in body'
    );

    // Clean up spoofed address
    if (spoofData.address?.id) {
      await fetch(`${BASE_URL}/api/addresses/${spoofData.address.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenB}` },
      });
    }
  }

  // ─── 6. Soft Delete & Default Address Succession ───
  console.log('\n--- 6. Soft Delete & Default Promotion ---');
  {
    // Delete Address 2 (which is currently the default)
    const resDel = await fetch(`${BASE_URL}/api/addresses/${createdAddress2Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resDel.status === 200, 'DELETE default address succeeds');

    // Verify Address 1 became default automatically
    const resListAfterDel = await fetch(`${BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const listAfterData = await resListAfterDel.json();
    assert(listAfterData.addresses.length === 1, 'Active address list excludes deleted address');
    assert(listAfterData.addresses[0]?.id === createdAddress1Id, 'Remaining address is Address 1');
    assert(listAfterData.addresses[0]?.is_default === true, 'Remaining address promoted to default');

    // Clean up Address 1
    await fetch(`${BASE_URL}/api/addresses/${createdAddress1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
  }

  console.log('\n====================================================');
  console.log(`🏁 TEST SUITE FINISHED: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
