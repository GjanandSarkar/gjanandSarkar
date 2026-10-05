/**
 * POST /api/sellers/reactivation
 * 
 * Seller-facing API to request reactivation of a deactivated account.
 * Only deactivated sellers can request reactivation.
 * Sellers cannot directly modify their status — this only creates a request.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getAuthUser, getClientIP } from '@/lib/api/auth-middleware';
import { writeAuditLog } from '@/lib/security/audit';
import { invalidateSellerProfileCache } from '@/lib/aws/redis';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reason, notes } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Reason for reactivation is required' }, { status: 400 });
    }

    const sb = getAdminSupabase();
    const ipAddress = getClientIP(request);

    // Find seller by user_id
    const { data: seller, error: sellerError } = await sb
      .from('sellers')
      .select('*')
      .eq('user_id', auth.userId)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json({ error: 'Seller account not found' }, { status: 404 });
    }

    // Only deactivated sellers can request reactivation
    if (seller.status !== 'deactivated') {
      return NextResponse.json({
        error: `Cannot request reactivation. Current status: ${seller.status}. Only deactivated accounts can request reactivation.`,
      }, { status: 400 });
    }

    // Update status to reactivation_requested and save reactivation reason
    const { error: updateError } = await sb
      .from('sellers')
      .update({
        status: 'reactivation_requested',
        reactivation_reason: reason,
      })
      .eq('id', seller.id);

    if (updateError) throw updateError;

    // Create history record
    await sb.from('seller_status_history').insert({
      seller_id: seller.id,
      previous_status: 'deactivated',
      new_status: 'reactivation_requested',
      action: 'reactivation_requested',
      reason,
      notes: notes || null,
      changed_by: auth.userId,
    });

    // Notify admins
    await sb.from('notifications').insert({
      user_id: null,
      role_target: 'admin',
      title: 'Seller Reactivation Request',
      message: `Seller "${seller.store_name}" has requested account reactivation. Reason: ${reason}`,
      type: 'system',
      related_id: seller.id,
    });

    // Audit log
    await writeAuditLog({
      adminId: auth.userId,
      action: 'seller.reactivation_requested',
      resourceType: 'seller',
      resourceId: seller.id,
      details: { previous_status: 'deactivated', new_status: 'reactivation_requested', reason, notes },
      ipAddress,
    });

    // Invalidate cache
    await invalidateSellerProfileCache(auth.userId).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Reactivation request submitted. Admin will review your request.',
    });
  } catch (err: any) {
    console.error('[SellerReactivation POST] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
