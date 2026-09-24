/**
 * GET /api/admin/stats
 * Real-time business KPI metrics for admin header badge and quick overview.
 */

import { NextResponse } from 'next/server';
import { query, isPgConfigured } from '@/lib/aws/rds';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getCachedAdminStats, cacheAdminStats } from '@/lib/aws/redis';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const auth = await getAuthUser(request as any);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check cache (authorization verified above — only admins reach this)
    const cachedStats = await getCachedAdminStats();
    if (cachedStats) {
      return NextResponse.json(cachedStats, { headers: { 'X-Cache': 'HIT' } });
    }

    if (isPgConfigured) {
      try {
        const [ordersToday, pendingOrders, pendingReturns, lowStockCount] = await Promise.all([
          query(
            "SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE created_at >= CURRENT_DATE AND status != 'cancelled'"
          ),
          query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending' OR status = 'confirmed'"),
          query("SELECT COUNT(*) as count FROM return_requests WHERE status = 'pending'"),
          query("SELECT COUNT(*) as count FROM product_variants WHERE stock <= 10"),
        ]);

        const statsPayload = {
          today: {
            orders: parseInt(ordersToday.rows[0]?.count || '0'),
            revenue: parseFloat(ordersToday.rows[0]?.revenue || '0'),
          },
          pendingOrders: parseInt(pendingOrders.rows[0]?.count || '0'),
          pendingReturns: parseInt(pendingReturns.rows[0]?.count || '0'),
          lowStockCount: parseInt(lowStockCount.rows[0]?.count || '0'),
        };
        cacheAdminStats(statsPayload).catch(() => {});
        return NextResponse.json(statsPayload, { headers: { 'X-Cache': 'MISS' } });
      } catch (err: any) {
        console.warn('[AdminStats GET] RDS failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    const todayIso = new Date();
    todayIso.setHours(0, 0, 0, 0);

    const [ordersTodayRes, pendingOrdersRes, returnsRes, lowStockRes] = await Promise.all([
      sb.from('orders').select('total_amount').gte('created_at', todayIso.toISOString()).neq('status', 'cancelled'),
      sb.from('orders').select('*', { count: 'exact', head: true }).in('status', ['pending', 'confirmed']),
      sb.from('return_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      sb.from('product_variants').select('*', { count: 'exact', head: true }).lte('stock', 10),
    ]);

    const revenueToday = (ordersTodayRes.data || []).reduce((sum: number, o: any) => sum + (parseFloat(o.total_amount) || 0), 0);

    const sbStatsPayload = {
      today: {
        orders: ordersTodayRes.data?.length || 0,
        revenue: revenueToday,
      },
      pendingOrders: pendingOrdersRes.count || 0,
      pendingReturns: returnsRes.count || 0,
      lowStockCount: lowStockRes.count || 0,
    };
    cacheAdminStats(sbStatsPayload).catch(() => {});
    return NextResponse.json(sbStatsPayload, { headers: { 'X-Cache': 'MISS' } });
  } catch (error: any) {
    console.error('[AdminStats GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
