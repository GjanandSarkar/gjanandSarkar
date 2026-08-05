/**
 * GET /api/admin/stats
 * Real-time business KPI metrics for admin header badge and quick overview.
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/aws/rds';
import { getAuthUser } from '@/lib/api/auth-middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const auth = await getAuthUser(request as any);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const [ordersToday, pendingOrders, pendingReturns, lowStockCount] = await Promise.all([
      query("SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE created_at >= CURRENT_DATE AND status != 'cancelled'"),
      query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'"),
      query("SELECT COUNT(*) as count FROM return_requests WHERE status = 'pending'"),
      query("SELECT COUNT(*) as count FROM product_variants WHERE stock <= low_stock_threshold"),
    ]);

    return NextResponse.json({
      today: {
        orders: parseInt(ordersToday.rows[0].count),
        revenue: parseFloat(ordersToday.rows[0].revenue),
      },
      pendingOrders: parseInt(pendingOrders.rows[0].count),
      pendingReturns: parseInt(pendingReturns.rows[0].count),
      lowStockCount: parseInt(lowStockCount.rows[0].count),
    });
  } catch (error: any) {
    console.error('[AdminStats GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
