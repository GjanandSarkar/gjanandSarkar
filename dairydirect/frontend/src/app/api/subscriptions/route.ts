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
              variantId || null,
              addressId || null,
              volume || 1,
              plan || 'daily',
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
        variant_id: variantId || null,
        address_id: addressId || null,
        volume: volume || 1,
        plan: plan || 'daily',
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

    if (isPgConfigured) {
      try {
        if (action === 'cancel') {
          const checkRes = await query<{ user_id: string }>('SELECT user_id FROM subscriptions WHERE id = $1', [subId]);
          if (checkRes.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
          if (!auth.isAdmin && checkRes.rows[0].user_id !== auth.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }

          await query("UPDATE subscriptions SET status = 'cancelled', updated_at = now() WHERE id = $1", [subId]);
          return NextResponse.json({ success: true });
        }

        if (action === 'pause') {
          await query("UPDATE subscriptions SET status = 'paused', updated_at = now() WHERE id = $1", [subId]);
          return NextResponse.json({ success: true });
        }

        if (action === 'resume') {
          await query("UPDATE subscriptions SET status = 'active', updated_at = now() WHERE id = $1", [subId]);
          return NextResponse.json({ success: true });
        }

        if (action === 'modify' && newVolume && newPlan) {
          await query("UPDATE subscriptions SET volume = $1, plan = $2, updated_at = now() WHERE id = $3", [
            newVolume,
            newPlan,
            subId,
          ]);
          return NextResponse.json({ success: true });
        }
      } catch (err: any) {
        console.warn('[Subscriptions PUT] RDS failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();

    if (action === 'cancel') {
      const { data: subData } = await sb.from('subscriptions').select('user_id').eq('id', subId).maybeSingle();
      if (!subData) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      if (!auth.isAdmin && subData.user_id !== auth.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      await sb.from('subscriptions').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', subId);
      return NextResponse.json({ success: true });
    }

    if (action === 'pause') {
      await sb.from('subscriptions').update({ status: 'paused', updated_at: new Date().toISOString() }).eq('id', subId);
      return NextResponse.json({ success: true });
    }

    if (action === 'resume') {
      await sb.from('subscriptions').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', subId);
      return NextResponse.json({ success: true });
    }

    if (action === 'modify' && newVolume && newPlan) {
      await sb
        .from('subscriptions')
        .update({ volume: newVolume, plan: newPlan, updated_at: new Date().toISOString() })
        .eq('id', subId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Subscriptions PUT] Error:', error.message);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}
