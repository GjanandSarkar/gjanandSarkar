/**
 * GET /api/admin/customers
 * Fetches real customer data directly from the `profiles` table in the database.
 * Dual RDS PostgreSQL + Supabase Cloud Database query with order & subscription aggregations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, isPgConfigured } from '@/lib/aws/rds';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { supabaseAdmin } from '@/lib/db';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const statusFilter = searchParams.get('status');

    // ── 1. PostgreSQL (RDS / Local Database Pool) ─────────────────────
    if (isPgConfigured) {
      try {
        const conditions: string[] = ["p.role = 'customer'"];
        const params: any[] = [];
        let pIdx = 1;

        if (search) {
          conditions.push(`(p.name ILIKE $${pIdx} OR p.phone ILIKE $${pIdx} OR p.email ILIKE $${pIdx})`);
          params.push(`%${search}%`);
          pIdx++;
        }

        if (statusFilter === 'active') {
          conditions.push(`p.is_active = true`);
        } else if (statusFilter === 'inactive') {
          conditions.push(`p.is_active = false`);
        }

        params.push(limit, offset);

        const result = await query(
          `SELECT 
             p.id, p.phone, p.email, p.name, p.avatar_url, p.role, p.is_active, p.loyalty_points,
             p.referral_code, p.created_at, p.updated_at,
             COUNT(DISTINCT o.id) as total_orders,
             COALESCE(SUM(o.total_amount) FILTER (WHERE o.status != 'cancelled'), 0) as total_spent,
             COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') as active_subscriptions,
             MAX(o.created_at) as last_order_date
           FROM profiles p
           LEFT JOIN orders o ON o.user_id = p.id
           LEFT JOIN subscriptions s ON s.user_id = p.id
           WHERE ${conditions.join(' AND ')}
           GROUP BY p.id
           ORDER BY p.created_at DESC
           LIMIT $${pIdx++} OFFSET $${pIdx++}`,
          params
        );

        const countRes = await query(
          `SELECT COUNT(*) FROM profiles p WHERE ${conditions.join(' AND ')}`,
          params.slice(0, -2)
        );

        const metricsRes = await query(
          `SELECT 
             COUNT(DISTINCT p.id) as total_customers,
             COUNT(DISTINCT p.id) FILTER (WHERE p.created_at > NOW() - INTERVAL '30 days') as new_30d,
             COALESCE(SUM(o.total_amount) FILTER (WHERE o.status != 'cancelled'), 0) as total_revenue
           FROM profiles p
           LEFT JOIN orders o ON o.user_id = p.id
           WHERE p.role = 'customer'`
        );

        const mRow = metricsRes.rows[0] || {};

        return NextResponse.json({
          customers: (result.rows || []).map((c: any) => ({
            ...c,
            last_login_at: c.updated_at || c.created_at,
            total_orders: parseInt(c.total_orders || '0', 10),
            total_spent: parseFloat(c.total_spent || '0'),
            active_subscriptions: parseInt(c.active_subscriptions || '0', 10),
          })),
          total: parseInt(countRes.rows[0]?.count || '0', 10),
          metrics: {
            totalCustomers: parseInt(mRow.total_customers || '0', 10),
            newThisMonth: parseInt(mRow.new_30d || '0', 10),
            totalSpent: parseFloat(mRow.total_revenue || '0'),
          },
        });
      } catch (err) {
        console.warn('[RDS Profiles Fallback to Supabase Database]:', err);
      }
    }

    // ── 2. Direct Supabase `profiles` Table Query ─────────────────────
    const sb = supabaseAdmin || getAdminSupabase();
    if (!sb) {
      return NextResponse.json({ customers: [], total: 0, metrics: { totalCustomers: 0, newThisMonth: 0, totalSpent: 0 } });
    }

    // Query profiles directly from database
    let profileQuery = sb
      .from('profiles')
      .select('id, phone, email, name, avatar_url, role, default_upi_id, loyalty_points, referral_code, is_active, created_at, updated_at', { count: 'exact' })
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (search) {
      profileQuery = profileQuery.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (statusFilter === 'active') {
      profileQuery = profileQuery.eq('is_active', true);
    } else if (statusFilter === 'inactive') {
      profileQuery = profileQuery.eq('is_active', false);
    }

    const { data: profiles, count, error: profileErr } = await profileQuery.range(offset, offset + limit - 1);
    if (profileErr) {
      console.error('[AdminCustomers Database Query Error]:', profileErr.message);
      throw profileErr;
    }

    const customerList = profiles || [];
    const customerIds = customerList.map((p: any) => p.id);

    // Join orders & subscriptions from database
    let ordersMap: Record<string, { count: number; totalSpent: number; lastOrder: string | null }> = {};
    let subsMap: Record<string, number> = {};

    if (customerIds.length > 0) {
      try {
        const [ordersRes, subsRes] = await Promise.all([
          sb.from('orders').select('id, user_id, total_amount, status, created_at').in('user_id', customerIds),
          sb.from('subscriptions').select('id, user_id, status').in('user_id', customerIds).eq('status', 'active'),
        ]);

        if (ordersRes.data) {
          for (const ord of ordersRes.data) {
            const uid = ord.user_id;
            if (!ordersMap[uid]) {
              ordersMap[uid] = { count: 0, totalSpent: 0, lastOrder: null };
            }
            if (ord.status !== 'cancelled') {
              ordersMap[uid].count += 1;
              ordersMap[uid].totalSpent += parseFloat(ord.total_amount || '0');
              if (!ordersMap[uid].lastOrder || new Date(ord.created_at) > new Date(ordersMap[uid].lastOrder!)) {
                ordersMap[uid].lastOrder = ord.created_at;
              }
            }
          }
        }

        if (subsRes.data) {
          for (const sub of subsRes.data) {
            const uid = sub.user_id;
            subsMap[uid] = (subsMap[uid] || 0) + 1;
          }
        }
      } catch (aggErr) {
        console.warn('[AdminCustomers DB Aggregation Notice]:', aggErr);
      }
    }

    const enrichedCustomers = customerList.map((p: any) => {
      const ordInfo = ordersMap[p.id] || { count: 0, totalSpent: 0, lastOrder: null };
      return {
        ...p,
        last_login_at: p.updated_at || p.created_at,
        total_orders: ordInfo.count,
        total_spent: ordInfo.totalSpent,
        active_subscriptions: subsMap[p.id] || 0,
        last_order_date: ordInfo.lastOrder,
      };
    });

    const totalCustomersCount = count !== null ? count : enrichedCustomers.length;
    const totalSpentSum = enrichedCustomers.reduce((acc, c) => acc + (c.total_spent || 0), 0);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const new30dCount = enrichedCustomers.filter((c) => c.created_at && c.created_at >= thirtyDaysAgo).length;

    return NextResponse.json({
      customers: enrichedCustomers,
      total: totalCustomersCount,
      metrics: {
        totalCustomers: totalCustomersCount,
        newThisMonth: new30dCount,
        totalSpent: totalSpentSum,
      },
    });
  } catch (error: any) {
    console.error('[AdminCustomers GET] Database Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch customers from database', details: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/admin/customers
 * Update customer records in `profiles` table.
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, is_active, loyalty_points } = body;

    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (is_active !== undefined) updates.is_active = is_active;
    if (loyalty_points !== undefined) updates.loyalty_points = loyalty_points;

    if (isPgConfigured) {
      try {
        const setParts: string[] = ['updated_at = now()'];
        const vals: any[] = [];
        let idx = 1;

        if (is_active !== undefined) {
          setParts.push(`is_active = $${idx++}`);
          vals.push(is_active);
        }
        if (loyalty_points !== undefined) {
          setParts.push(`loyalty_points = $${idx++}`);
          vals.push(loyalty_points);
        }

        vals.push(id);
        const res = await query(
          `UPDATE profiles SET ${setParts.join(', ')} WHERE id = $${idx} RETURNING *`,
          vals
        );

        if (res.rows[0]) {
          return NextResponse.json({ success: true, customer: res.rows[0] });
        }
      } catch (pgErr) {
        console.warn('[AdminCustomers PUT] PG update fallback to Supabase:', pgErr);
      }
    }

    const sb = supabaseAdmin || getAdminSupabase();
    if (sb) {
      const { data, error } = await sb
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, customer: data });
    }

    return NextResponse.json({ success: true, customer: { id, ...updates } });
  } catch (error: any) {
    console.error('[AdminCustomers PUT] Database Error:', error.message);
    return NextResponse.json({ error: 'Failed to update customer in database', details: error.message }, { status: 500 });
  }
}
