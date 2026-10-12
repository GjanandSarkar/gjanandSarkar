/**
 * GET/PUT /api/admin/settings
 * Business settings management with dual AWS PostgreSQL + Supabase Fallback.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, isPgConfigured } from '@/lib/aws/rds';
import { getAuthUser, getClientIP } from '@/lib/api/auth-middleware';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { writeAuditLog } from '@/lib/security/audit';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (isPgConfigured) {
      try {
        const result = await query('SELECT * FROM business_settings LIMIT 1');
        return NextResponse.json({ settings: result.rows[0] || {} });
      } catch (err: any) {
        console.warn('[AdminSettings GET] RDS failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    const { data } = await sb.from('business_settings').select('*').limit(1).maybeSingle();

    return NextResponse.json({ settings: data || {} });
  } catch (error: any) {
    console.error('[AdminSettings GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

const UpdateSettingsSchema = z.object({
  min_profit_margin_percent: z.number().min(0).max(100).optional(),
  delivery_fee: z.number().min(0).optional(),
  free_delivery_threshold: z.number().min(0).optional(),
  tax_rate_percent: z.number().min(0).max(50).optional(),
  morning_cutoff_time: z.string().optional(),
  evening_cutoff_time: z.string().optional(),
  is_ordering_enabled: z.boolean().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = UpdateSettingsSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const data = parseResult.data;

    if (isPgConfigured) {
      try {
        const setParts = ['updated_at = now()'];
        const values: any[] = [];
        let pIdx = 1;

        if (data.min_profit_margin_percent !== undefined) {
          setParts.push(`min_profit_margin_percent = $${pIdx++}`);
          values.push(data.min_profit_margin_percent);
        }
        if (data.delivery_fee !== undefined) {
          setParts.push(`delivery_fee = $${pIdx++}`);
          values.push(data.delivery_fee);
        }
        if (data.free_delivery_threshold !== undefined) {
          setParts.push(`free_delivery_threshold = $${pIdx++}`);
          values.push(data.free_delivery_threshold);
        }
        if (data.tax_rate_percent !== undefined) {
          setParts.push(`tax_rate_percent = $${pIdx++}`);
          values.push(data.tax_rate_percent);
        }
        if (data.morning_cutoff_time !== undefined) {
          setParts.push(`morning_cutoff_time = $${pIdx++}`);
          values.push(data.morning_cutoff_time);
        }
        if (data.evening_cutoff_time !== undefined) {
          setParts.push(`evening_cutoff_time = $${pIdx++}`);
          values.push(data.evening_cutoff_time);
        }
        if (data.is_ordering_enabled !== undefined) {
          setParts.push(`is_ordering_enabled = $${pIdx++}`);
          values.push(data.is_ordering_enabled);
        }

        await query(`UPDATE business_settings SET ${setParts.join(', ')}`, values);

        await writeAuditLog({
          adminId: auth.userId,
          action: 'settings.update',
          resourceType: 'business_settings',
          resourceId: 'global',
          details: data,
          ipAddress: getClientIP(request),
        });

        return NextResponse.json({ success: true });
      } catch (err: any) {
        console.warn('[AdminSettings PUT] RDS failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    const { data: existing } = await sb.from('business_settings').select('id').limit(1).maybeSingle();

    if (existing) {
      await sb.from('business_settings').update({ ...data, updated_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await sb.from('business_settings').insert(data);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[AdminSettings PUT] Error:', error.message);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
