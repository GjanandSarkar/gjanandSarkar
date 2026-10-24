/**
 * GET / POST /api/sellers/payouts
 * Dedicated API for managing seller bank payouts & settlement records.
 * Interacts directly with Supabase `seller_payouts` table.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { writeAuditLog } from '@/lib/security/audit';
import { getAuthUser } from '@/lib/api/auth-middleware';

export const dynamic = 'force-dynamic';

// ─── GET /api/sellers/payouts ──────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');
    const status = searchParams.get('status');
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50', 10));
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const sb = getAdminSupabase();

    // If caller is not admin, verify they own the seller store
    let targetSellerId = sellerId;
    if (!auth.isAdmin) {
      const { data: store } = await sb
        .from('sellers')
        .select('id')
        .eq('user_id', auth.userId)
        .maybeSingle();

      if (!store) {
        return NextResponse.json({ payouts: [], summary: { totalAmount: 0, totalFees: 0, totalNet: 0, count: 0 } });
      }

      if (sellerId && sellerId !== store.id) {
        return NextResponse.json({ error: 'Forbidden: Access denied to other store payouts' }, { status: 403 });
      }

      targetSellerId = store.id;
    }

    let query = sb
      .from('seller_payouts')
      .select('*, sellers(id, store_name, slug, user_id)', { count: 'exact' })
      .order('payout_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (targetSellerId) {
      query = query.eq('seller_id', targetSellerId);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: payouts, error, count } = await query;

    if (error) {
      console.error('[SellerPayouts GET] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate live summary
    let totalAmount = 0;
    let totalFees = 0;
    let totalNet = 0;

    (payouts || []).forEach((p: any) => {
      totalAmount += Number(p.amount || 0);
      totalFees += Number(p.fee_deducted || 0);
      totalNet += Number(p.net_amount || 0);
    });

    return NextResponse.json({
      success: true,
      payouts: payouts || [],
      pagination: {
        total: count || (payouts || []).length,
        limit,
        offset,
      },
      summary: {
        totalAmount,
        totalFees,
        totalNet,
        count: payouts?.length || 0,
      },
    });
  } catch (error: any) {
    console.error('[SellerPayouts GET] Exception:', error.message);
    return NextResponse.json({ error: 'Failed to fetch seller payouts' }, { status: 500 });
  }
}

// ─── POST /api/sellers/payouts ─────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    /* Recording a payout asserts that money was sent to a seller. The old
       rule was `!auth.isAdmin && seller.user_id !== auth.userId`, which let
       a seller POST a payout for their OWN store with an arbitrary amount,
       a self-chosen reference number and status defaulting to 'completed'
       -- i.e. a seller could fabricate a financial record saying they had
       been paid. Payout creation is now admin-only. No UI called this as a
       seller, so nothing legitimate is lost; a genuine seller-initiated
       payout REQUEST needs its own endpoint that cannot set amount/status. */
    if (!auth.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required to record a payout' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      sellerId,
      amount,
      feeDeducted,
      netAmount,
      status = 'completed',
      payoutDate,
      referenceNo,
    } = body;

    if (!sellerId || amount === undefined || Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'Valid seller ID and positive payout amount are required' },
        { status: 400 }
      );
    }

    const sb = getAdminSupabase();

    // Verify seller exists
    const { data: seller, error: sellerErr } = await sb
      .from('sellers')
      .select('id, user_id, store_name, commission_rate')
      .eq('id', sellerId)
      .maybeSingle();

    if (sellerErr || !seller) {
      return NextResponse.json({ error: 'Seller store not found' }, { status: 404 });
    }

    /* Reject unknown statuses up front. seller_payouts has a CHECK
       constraint, so an unexpected value surfaced as an opaque 500. */
    const ALLOWED_PAYOUT_STATUS = ['pending', 'processing', 'completed', 'paid', 'failed'];
    if (!ALLOWED_PAYOUT_STATUS.includes(status)) {
      return NextResponse.json(
        { error: `Invalid payout status. Expected one of: ${ALLOWED_PAYOUT_STATUS.join(', ')}` },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    const numFee = feeDeducted !== undefined ? Number(feeDeducted) : (numAmount * (Number(seller.commission_rate || 5) / 100));
    const numNet = netAmount !== undefined ? Number(netAmount) : Math.max(0, numAmount - numFee);

    const payoutPayload = {
      seller_id: seller.id,
      amount: numAmount,
      fee_deducted: numFee,
      net_amount: numNet,
      status,
      payout_date: payoutDate ? new Date(payoutDate).toISOString() : new Date().toISOString(),
      reference_no: referenceNo || `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    };

    const { data: payout, error: insertErr } = await sb
      .from('seller_payouts')
      .insert(payoutPayload)
      .select('*')
      .single();

    if (insertErr) {
      console.error('[SellerPayouts POST] Error:', insertErr.message);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Money leaving the business must be attributable to a named admin.
    await writeAuditLog({
      adminId: auth.userId,
      action: 'seller.payout.record',
      resourceType: 'seller_payout',
      resourceId: payout.id,
      details: {
        sellerId: seller.id,
        storeName: seller.store_name,
        amount: numAmount,
        feeDeducted: numFee,
        netAmount: numNet,
        status,
        referenceNo: payout.reference_no,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    // Send in-app notification to the seller user
    if (seller.user_id) {
      try {
        await sb.from('notifications').insert({
          user_id: seller.user_id,
          role_target: 'seller',
          title: 'Bank Payout Processed! 💳',
          message: `Payout of ₹${numNet.toFixed(2)} for ${seller.store_name} has been processed (Ref: ${payout.reference_no}).`,
          type: 'seller_payout',
          related_id: payout.id,
        });
      } catch (notifErr) {
        console.warn('[SellerPayouts POST] Notification warning:', notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Seller payout recorded successfully',
      payout,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[SellerPayouts POST] Exception:', error.message);
    return NextResponse.json({ error: error.message || 'Failed to process payout' }, { status: 500 });
  }
}
