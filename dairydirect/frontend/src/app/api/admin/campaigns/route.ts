/**
 * GET/POST/PATCH /api/admin/campaigns
 *
 * Campaign management for house promotions. Admin only — campaigns control
 * what the whole marketplace is pushed towards, so every mutation is audited.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { writeAuditLog } from '@/lib/security/audit';

const PLACEMENTS = ['home', 'product', 'category', 'cart', 'search'] as const;

const CampaignSchema = z.object({
  name: z.string().min(2).max(120),
  objective: z.enum(['awareness', 'traffic', 'conversions', 'clearance']),
  status: z.enum(['draft', 'active', 'paused', 'ended']).default('draft'),
  placements: z.array(z.enum(PLACEMENTS)).min(1),
  productIds: z.array(z.string().uuid()).default([]),
  targetCategory: z.string().max(64).nullable().optional(),
  priority: z.number().int().min(-100).max(100).default(0),
  spendAmount: z.number().min(0).default(0),
  dailyFrequencyCap: z.number().int().positive().max(100).nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth?.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const sb = getAdminSupabase();
  const { data, error } = await sb
    .from('ad_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('[Campaigns GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to load campaigns' }, { status: 500 });
  }

  return NextResponse.json({ campaigns: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth?.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const parsed = CampaignSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid campaign' },
        { status: 400 }
      );
    }
    const c = parsed.data;

    // A campaign with no products and no category has nothing to show.
    if (!c.productIds.length && !c.targetCategory) {
      return NextResponse.json(
        { error: 'Select at least one product or a target category.' },
        { status: 400 }
      );
    }

    if (c.startsAt && c.endsAt && new Date(c.endsAt) <= new Date(c.startsAt)) {
      return NextResponse.json(
        { error: 'The end date must be after the start date.' },
        { status: 400 }
      );
    }

    const sb = getAdminSupabase();
    const { data, error } = await sb
      .from('ad_campaigns')
      .insert({
        name: c.name,
        objective: c.objective,
        status: c.status,
        placements: c.placements,
        product_ids: c.productIds,
        target_category: c.targetCategory ?? null,
        priority: c.priority,
        spend_amount: c.spendAmount,
        daily_frequency_cap: c.dailyFrequencyCap ?? null,
        starts_at: c.startsAt ?? null,
        ends_at: c.endsAt ?? null,
        created_by: auth.userId,
      })
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      adminId: auth.userId,
      action: 'campaign.create',
      resourceType: 'ad_campaign',
      resourceId: data.id,
      details: { name: c.name, objective: c.objective, status: c.status },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ campaign: data });
  } catch (err: any) {
    console.error('[Campaigns POST] Error:', err?.message);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth?.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, status, priority, spendAmount, dailyFrequencyCap } = body;

    if (!id) {
      return NextResponse.json({ error: 'Campaign id is required' }, { status: 400 });
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status) patch.status = status;
    if (typeof priority === 'number') patch.priority = priority;
    if (typeof spendAmount === 'number') patch.spend_amount = spendAmount;
    if (dailyFrequencyCap !== undefined) patch.daily_frequency_cap = dailyFrequencyCap;

    const sb = getAdminSupabase();
    const { data, error } = await sb
      .from('ad_campaigns')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      adminId: auth.userId,
      action: 'campaign.update',
      resourceType: 'ad_campaign',
      resourceId: id,
      details: patch,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ campaign: data });
  } catch (err: any) {
    console.error('[Campaigns PATCH] Error:', err?.message);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}
