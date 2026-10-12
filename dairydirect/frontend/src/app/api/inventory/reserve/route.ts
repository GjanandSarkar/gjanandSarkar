/**
 * POST / DELETE /api/inventory/reserve
 * Production-level inventory reservation API (Amazon/Flipkart hold during checkout/payment).
 * POST: Reserves inventory for a user with hold duration (default 10 mins).
 * DELETE: Releases active reservation (e.g. user cancelled payment modal or checkout).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { revalidateInventory } from '@/lib/inventory/cache-invalidation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { items, holdSeconds } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items array required' }, { status: 400 });
    }

    const sb = getAdminSupabase();
    const { data, error } = await sb.rpc('reserve_inventory_atomic', {
      p_user_id: auth.userId,
      p_items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
      p_hold_seconds: holdSeconds || 600,
    });

    if (error || !data?.success) {
      const msg = error?.message || data?.error || 'Failed to reserve inventory';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    await revalidateInventory({ productId: items[0]?.productId });

    return NextResponse.json({
      success: true,
      expiresAt: data.expires_at,
      reservations: data.reservations,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get('reservationId');
    const reason = searchParams.get('reason') || 'user_cancelled';

    if (!reservationId) {
      return NextResponse.json({ error: 'reservationId required' }, { status: 400 });
    }

    const sb = getAdminSupabase();
    const { data, error } = await sb.rpc('release_inventory_reservation_atomic', {
      p_reservation_id: reservationId,
      p_reason: reason,
    });

    if (error || !data?.success) {
      return NextResponse.json({ error: error?.message || 'Failed to release reservation' }, { status: 400 });
    }

    await revalidateInventory();

    return NextResponse.json({ success: true, message: 'Reservation released' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
