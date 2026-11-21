/**
 * GET/POST/PUT /api/subscriptions
 * Subscriptions management with dual AWS PostgreSQL + Supabase Fallback.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction, isPgConfigured } from '@/lib/aws/rds';
import { getAuthUser, getClientIP } from '@/lib/api/auth-middleware';
import { checkRateLimit } from '@/lib/aws/redis';
import { isValidUUID } from '@/lib/security/sanitize';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { addDays, CADENCES, todayInIST, type PlanCadence } from '@/lib/subscriptions/schedule';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isPgConfigured) {
      try {
        const conditions = [];
        const params: any[] = [];

        if (!auth.isAdmin) {
          conditions.push("s.user_id = $1 AND s.status != 'cancelled'");
          params.push(auth.userId);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const result = await query(
          `SELECT 
             s.*,
             json_build_object('id', p.id, 'name', p.name, 'category', p.category, 'image_url', p.image_url) as products,
             json_build_object('id', pv.id, 'weight', pv.weight, 'price', pv.price) as product_variants,
             json_build_object('name', prof.name, 'phone', prof.phone) as profiles
           FROM subscriptions s
           LEFT JOIN products p ON p.id = s.product_id
           LEFT JOIN product_variants pv ON pv.id = s.variant_id
           LEFT JOIN profiles prof ON prof.id = s.user_id
           ${whereClause}
           ORDER BY s.created_at DESC`,
          params
        );

        return NextResponse.json({ subscriptions: result.rows });
      } catch (err: any) {
        console.warn('[Subscriptions GET] RDS failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    let sbQuery = sb
      .from('subscriptions')
      .select('*, products(*), product_variants(*), profiles(name, phone)')
      .order('created_at', { ascending: false });

    if (!auth.isAdmin) {
      sbQuery = sbQuery.eq('user_id', auth.userId).neq('status', 'cancelled');
    }

    const { data, error } = await sbQuery;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ subscriptions: data || [] });
  } catch (error: any) {
    console.error('[Subscriptions GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const limit = await checkRateLimit(ip, 'sub_create', 5, 60);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, productId, variantId, volume, plan, startDate, addressId, deliverySlot } = body;

    const targetUserId = auth.isAdmin ? (userId || auth.userId) : auth.userId;

    if (!productId || !isValidUUID(productId)) {
      return NextResponse.json({ error: 'Valid product ID is required' }, { status: 400 });
    }

    // Resolve variantId if not explicitly provided
    let finalVariantId = variantId;
    if (!finalVariantId) {
      if (isPgConfigured) {
        try {
          const varRes = await query<{ id: string }>('SELECT id FROM product_variants WHERE product_id = $1 LIMIT 1', [productId]);
          finalVariantId = varRes.rows[0]?.id;
        } catch (e) {}
      }
      if (!finalVariantId) {
        const { data: vData } = await getAdminSupabase().from('product_variants').select('id').eq('product_id', productId).limit(1).maybeSingle();
        finalVariantId = vData?.id;
      }
    }

    const validPlans = ['daily', 'alternate', 'weekly', 'custom'];
    const finalPlan = validPlans.includes(plan) ? plan : 'daily';

    const nextDeliveryDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    if (isPgConfigured) {
      try {
        const result = await withTransaction(async (client) => {
          const subRes = await client.query<{ id: string }>(
            `INSERT INTO subscriptions (
               user_id, product_id, variant_id, address_id, volume, plan, 
               delivery_slot, status, start_date, next_delivery_date
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $9)
             RETURNING id`,
            [
              targetUserId,
              productId,
              finalVariantId,
              addressId || null,
              volume || 1,
              finalPlan,
              deliverySlot || 'morning_6_8',
              startDate || new Date().toISOString().split('T')[0],
              nextDeliveryDate,
            ]
          );

          const subId = subRes.rows[0].id;

          await client.query(
            `INSERT INTO notifications (user_id, role_target, title, message, type, related_id)
             VALUES ($1, 'customer', 'Subscription Active! 🥛', 'Your milk subscription starts tomorrow!', 'subscription', $2)`,
            [targetUserId, subId]
          );

          return subId;
        });

        return NextResponse.json({ success: true, id: result });
      } catch (err: any) {
        console.warn('[Subscriptions POST] RDS failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    const { data: subData, error: subErr } = await sb
      .from('subscriptions')
      .insert({
        user_id: targetUserId,
        product_id: productId,
        variant_id: finalVariantId,
        address_id: addressId || null,
        volume: volume || 1,
        plan: finalPlan,
        delivery_slot: deliverySlot || 'morning_6_8',
        status: 'active',
        start_date: startDate || new Date().toISOString().split('T')[0],
        next_delivery_date: nextDeliveryDate,
      })
      .select('id')
      .single();

    if (subErr || !subData) {
      return NextResponse.json({ error: subErr?.message || 'Failed to create subscription' }, { status: 500 });
    }

    await sb.from('notifications').insert({
      user_id: targetUserId,
      role_target: 'customer',
      title: 'Subscription Active! 🥛',
      message: 'Your milk subscription starts tomorrow!',
      type: 'subscription',
      related_id: subData.id,
    });

    return NextResponse.json({ success: true, id: subData.id });
  } catch (error: any) {
    console.error('[Subscriptions POST] Error:', error.message);
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subId, action, newVolume, newPlan, pauseUntil } = body;

    if (!subId || !isValidUUID(subId)) {
      return NextResponse.json({ error: 'Valid subscription ID required' }, { status: 400 });
    }

    const allowedActions = ['cancel', 'pause', 'resume', 'skip', 'modify'];
    if (!allowedActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const VALID_PLANS = ['daily', 'alternate', 'weekly', 'custom'] as const;
    const planValid = typeof newPlan === 'string' && (VALID_PLANS as readonly string[]).includes(newPlan);
    const volumeValid = Number.isInteger(newVolume) && newVolume > 0 && newVolume <= 20;

    if (action === 'modify' && (!planValid || !volumeValid)) {
      return NextResponse.json(
        { error: 'A valid volume (1–20) and plan are required to modify a plan' },
        { status: 400 }
      );
    }

    // ── Load the plan once, and authorise once ──────────────────────────────
    // Every action needs the same ownership check. Previously only `cancel`
    // verified it, so any signed-in customer could pause, resume or change the
    // volume of another customer's subscription by guessing a UUID.
    const sb = getAdminSupabase();
    let ownerId: string | null = null;
    let currentPlan = 'daily';
    let currentNext: string | null = null;
    let loadedFromPg = false;

    if (isPgConfigured) {
      try {
        const res = await query<{ user_id: string; plan: string; next_delivery_date: string | null }>(
          'SELECT user_id, plan, next_delivery_date FROM subscriptions WHERE id = $1',
          [subId]
        );
        const row = res.rows[0];
        if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        ownerId = row.user_id;
        currentPlan = row.plan;
        currentNext = row.next_delivery_date;
        loadedFromPg = true;
      } catch (err: any) {
        console.warn('[Subscriptions PUT] RDS read failed, fallback to Supabase:', err.message);
      }
    }

    if (!loadedFromPg) {
      const { data: row, error } = await sb
        .from('subscriptions')
        .select('user_id, plan, next_delivery_date')
        .eq('id', subId)
        .maybeSingle();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      ownerId = row.user_id;
      currentPlan = row.plan;
      currentNext = row.next_delivery_date;
    }

    if (!auth.isAdmin && ownerId !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ── Build the patch ────────────────────────────────────────────────────
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

    switch (action) {
      case 'cancel':
        patch.status = 'cancelled';
        break;
      case 'pause':
        patch.status = 'paused';
        if (typeof pauseUntil === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(pauseUntil)) {
          patch.pause_until = pauseUntil;
        }
        break;
      case 'resume':
        patch.status = 'active';
        patch.pause_until = null;
        break;
      case 'skip': {
        // Move the next delivery forward by one cadence step, starting from
        // whichever is later: the scheduled date or today.
        const from = currentNext && currentNext >= todayInIST() ? currentNext : todayInIST();
        patch.next_delivery_date = addDays(from, CADENCES[currentPlan as PlanCadence]?.stepDays ?? 1);
        break;
      }
      case 'modify':
        patch.volume = newVolume;
        patch.plan = newPlan;
        break;
    }

    if (isPgConfigured) {
      try {
        const keys = Object.keys(patch).filter((k) => k !== 'updated_at');
        const values = keys.map((k) => patch[k]);
        const sets = keys.map((k, i) => `${k} = $${i + 1}`);
        await query(
          `UPDATE subscriptions SET ${sets.join(', ')}, updated_at = now() WHERE id = $${keys.length + 1}`,
          [...values, subId]
        );
        return NextResponse.json({ success: true, ...patch });
      } catch (err: any) {
        console.warn('[Subscriptions PUT] RDS write failed, fallback to Supabase:', err.message);
      }
    }

    const { error } = await sb.from('subscriptions').update(patch).eq('id', subId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, ...patch });
  } catch (error: any) {
    console.error('[Subscriptions PUT] Error:', error.message);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}
