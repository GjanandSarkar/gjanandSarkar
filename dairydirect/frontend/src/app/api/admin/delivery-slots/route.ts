/**
 * GET/PUT /api/admin/delivery-slots
 * Delivery slot management — capacity, cutoff times, active status.
 * Admin only for PUT, public/authenticated for GET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/rds';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { z } from 'zod';

export async function GET() {
  try {
    const result = await query(
      `SELECT * FROM delivery_slots 
       WHERE is_active = true 
       ORDER BY sort_order ASC`
    );
    return NextResponse.json({ slots: result.rows });
  } catch (error: any) {
    console.error('[DeliverySlots GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
  }
}

const UpdateSlotSchema = z.object({
  slotId: z.string().uuid(),
  maxOrdersPerDay: z.number().int().min(1).optional(),
  cutoffTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = UpdateSlotSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const { slotId, maxOrdersPerDay, cutoffTime, isActive } = parseResult.data;

    const setParts: string[] = ['updated_at = now()'];
    const values: any[] = [slotId];
    let pIdx = 2;

    if (maxOrdersPerDay !== undefined) { setParts.push(`max_orders_per_day = $${pIdx++}`); values.push(maxOrdersPerDay); }
    if (cutoffTime !== undefined) { setParts.push(`cutoff_time = $${pIdx++}`); values.push(cutoffTime); }
    if (isActive !== undefined) { setParts.push(`is_active = $${pIdx++}`); values.push(isActive); }

    await query(
      `UPDATE delivery_slots SET ${setParts.join(', ')} WHERE id = $1`,
      values
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DeliverySlots PUT] Error:', error.message);
    return NextResponse.json({ error: 'Failed to update slot' }, { status: 500 });
  }
}
