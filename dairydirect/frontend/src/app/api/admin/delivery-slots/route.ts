/**
 * GET/PUT /api/admin/delivery-slots
 * Delivery slot management with dual AWS PostgreSQL + Supabase Fallback.
 * Admin only for PUT, public/authenticated for GET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, isPgConfigured } from '@/lib/aws/rds';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { z } from 'zod';

export async function GET() {
  try {
    if (isPgConfigured) {
      try {
        const result = await query(
          `SELECT * FROM delivery_slots 
           WHERE is_active = true 
           ORDER BY sort_order ASC`
        );
        return NextResponse.json({ slots: result.rows });
      } catch (err: any) {
        console.warn('[DeliverySlots GET] RDS failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    const { data, error } = await sb
      .from('delivery_slots')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ slots: [] });
    }

    return NextResponse.json({ slots: data || [] });
  } catch (error: any) {
    console.error('[DeliverySlots GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch slots', slots: [] }, { status: 500 });
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

    if (isPgConfigured) {
      try {
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
      } catch (err: any) {
        console.warn('[DeliverySlots PUT] RDS failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    const updates: any = { updated_at: new Date().toISOString() };
    if (maxOrdersPerDay !== undefined) updates.max_orders_capacity = maxOrdersPerDay;
    if (isActive !== undefined) updates.is_active = isActive;

    await sb.from('delivery_slots').update(updates).eq('id', slotId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DeliverySlots PUT] Error:', error.message);
    return NextResponse.json({ error: 'Failed to update slot' }, { status: 500 });
  }
}
