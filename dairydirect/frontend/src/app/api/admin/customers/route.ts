/**
 * GET /api/admin/customers
 * Admin customer directory API with RDS + Supabase Fallback.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, isPgConfigured } from '@/lib/aws/rds';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { backfillUsersTable } from '@/lib/supabase/sync-users';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Trigger asynchronous backfill into public.users table
    backfillUsersTable().catch(() => {});

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase().trim() || '';

    // ─── 1. Try RDS Query if configured ───
    if (isPgConfigured) {
      try {
        const conditions: string[] = ["(p.role IS NULL OR p.role != 'admin')"];
        const params: any[] = [];
        let pIdx = 1;

        if (search) {
          conditions.push(`(p.name ILIKE $${pIdx} OR p.phone ILIKE $${pIdx} OR p.email ILIKE $${pIdx})`);
          params.push(`%${search}%`);
          pIdx++;
        }

        const result = await query(
          `SELECT 
             p.id, p.phone, p.email, p.name, p.role, p.is_active, p.loyalty_points,
             p.last_login_at, p.created_at,
             COUNT(DISTINCT o.id) as total_orders,
             COALESCE(SUM(o.total_amount) FILTER (WHERE o.status != 'cancelled'), 0) as total_spent,
             COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') as active_subscriptions
           FROM profiles p
           LEFT JOIN orders o ON o.user_id = p.id
           LEFT JOIN subscriptions s ON s.user_id = p.id
           WHERE ${conditions.join(' AND ')}
           GROUP BY p.id
           ORDER BY p.created_at DESC`,
          params
        );

        if (result.rows && result.rows.length > 0) {
          return NextResponse.json({
            customers: result.rows,
            total: result.rows.length,
          });
        }
      } catch (err: any) {
        console.warn('[AdminCustomers GET] RDS query failed, falling back to Supabase:', err.message);
      }
    }

    // ─── 2. Supabase Fallback ───
    const sb = getAdminSupabase();

    const [profilesRes, ordersRes, subsRes] = await Promise.all([
      sb.from('profiles').select('*').order('created_at', { ascending: false }),
      sb.from('orders').select('id, user_id, total_amount, status, created_at'),
      sb.from('subscriptions').select('id, user_id, status').eq('status', 'active'),
    ]);

    const allProfiles = profilesRes.data || [];
    const allOrders = ordersRes.data || [];
    const allSubs = subsRes.data || [];

    // Aggregate orders by user_id
    const ordersByUser: Record<string, { count: number; spent: number }> = {};
    allOrders.forEach((o: any) => {
      if (!o.user_id) return;
      if (!ordersByUser[o.user_id]) ordersByUser[o.user_id] = { count: 0, spent: 0 };
      ordersByUser[o.user_id].count += 1;
      if (o.status !== 'cancelled') {
        ordersByUser[o.user_id].spent += Number(o.total_amount) || 0;
      }
    });

    // Aggregate active subscriptions by user_id
    const subsByUser: Record<string, number> = {};
    allSubs.forEach((s: any) => {
      if (!s.user_id) return;
      subsByUser[s.user_id] = (subsByUser[s.user_id] || 0) + 1;
    });

    const profileMap = new Map<string, any>();

    // 1. Add all profiles except role === 'admin'
    allProfiles.forEach((p: any) => {
      if (p.role === 'admin') return;
      profileMap.set(p.id, {
        id: p.id,
        name: p.name || (p.email ? p.email.split('@')[0] : 'Customer'),
        email: p.email || null,
        phone: p.phone || null,
        role: p.role || 'customer',
        is_active: p.is_active ?? true,
        loyalty_points: p.loyalty_points || 0,
        created_at: p.created_at || new Date().toISOString(),
        total_orders: ordersByUser[p.id]?.count || 0,
        total_spent: ordersByUser[p.id]?.spent || 0,
        active_subscriptions: subsByUser[p.id] || 0,
      });
    });

    // 2. Add any user_ids from orders who might not be in profiles table
    allOrders.forEach((o: any) => {
      if (o.user_id && !profileMap.has(o.user_id)) {
        profileMap.set(o.user_id, {
          id: o.user_id,
          name: `Customer #${o.user_id.substring(0, 6)}`,
          email: null,
          phone: null,
          role: 'customer',
          is_active: true,
          loyalty_points: 0,
          created_at: o.created_at || new Date().toISOString(),
          total_orders: ordersByUser[o.user_id]?.count || 0,
          total_spent: ordersByUser[o.user_id]?.spent || 0,
          active_subscriptions: subsByUser[o.user_id] || 0,
        });
      }
    });

    let customers = Array.from(profileMap.values());

    // Filter by search query if provided
    if (search) {
      customers = customers.filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(search)) ||
          (c.email && c.email.toLowerCase().includes(search)) ||
          (c.phone && c.phone.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      customers,
      total: customers.length,
    });
  } catch (error: any) {
    console.error('[AdminCustomers GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
