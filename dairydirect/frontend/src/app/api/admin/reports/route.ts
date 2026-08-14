/**
 * GET /api/admin/reports
 * Business intelligence — revenue, orders, product performance.
 * Admin only. Uses Supabase when PostgreSQL is not configured.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, isPgConfigured } from '@/lib/aws/rds';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { getAdminSupabase } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const format = searchParams.get('format');
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    // Calculate date range
    let fromDate: string;
    let toDate = new Date().toISOString();

    if (startDate && endDate) {
      fromDate = new Date(startDate).toISOString();
      toDate = new Date(endDate).toISOString();
    } else {
      const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '365d' ? 365 : 30;
      fromDate = new Date(Date.now() - days * 86400000).toISOString();
    }

    let reportData: any;

    // ─── 1. PostgreSQL path ───────────────────────────────────
    if (isPgConfigured) {
      const revenueResult = await query(
        `SELECT
           COUNT(*) FILTER (WHERE status != 'cancelled') as total_orders,
           COUNT(*) FILTER (WHERE status = 'delivered') as delivered_orders,
           COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
           COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
           COALESCE(SUM(total_amount) FILTER (WHERE status != 'cancelled'), 0) as gross_revenue,
           COALESCE(SUM(total_amount) FILTER (WHERE status = 'delivered'), 0) as net_revenue,
           COALESCE(SUM(discount_amount) FILTER (WHERE status != 'cancelled'), 0) as total_discounts,
           COALESCE(SUM(delivery_fee) FILTER (WHERE status != 'cancelled'), 0) as delivery_revenue,
           COALESCE(AVG(total_amount) FILTER (WHERE status != 'cancelled'), 0) as avg_order_value,
           COUNT(DISTINCT user_id) FILTER (WHERE status != 'cancelled') as unique_customers
         FROM orders
         WHERE created_at BETWEEN $1 AND $2`,
        [fromDate, toDate]
      );

      const dailyResult = await query(
        `SELECT
           DATE(created_at) as date,
           COUNT(*) FILTER (WHERE status != 'cancelled') as orders,
           COALESCE(SUM(total_amount) FILTER (WHERE status != 'cancelled'), 0) as revenue,
           COUNT(DISTINCT user_id) as customers
         FROM orders
         WHERE created_at BETWEEN $1 AND $2
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
        [fromDate, toDate]
      );

      const paymentResult = await query(
        `SELECT
           payment_method,
           COUNT(*) as count,
           SUM(total_amount) as total
         FROM orders
         WHERE created_at BETWEEN $1 AND $2
           AND status != 'cancelled'
         GROUP BY payment_method`,
        [fromDate, toDate]
      );

      reportData = {
        period: { from: fromDate, to: toDate },
        overview: revenueResult.rows[0],
        daily: dailyResult.rows,
        topProducts: [],
        customers: { total_customers: 0, new_customers_30d: 0, returning_customers: 0 },
        byCategory: [],
        byPaymentMethod: paymentResult.rows,
      };
    } else {
      // ─── 2. Supabase Fallback ─────────────────────────────
      const sb = getAdminSupabase();

      const { data: orders, error: ordersErr } = await sb
        .from('orders')
        .select('id, status, total_amount, discount_amount, delivery_fee, payment_method, user_id, created_at')
        .gte('created_at', fromDate)
        .lte('created_at', toDate);

      if (ordersErr) throw new Error(ordersErr.message);

      const allOrders: any[] = orders || [];
      const activeOrders = allOrders.filter((o: any) => o.status !== 'cancelled');
      const deliveredOrders = allOrders.filter((o: any) => o.status === 'delivered');
      const cancelledOrders = allOrders.filter((o: any) => o.status === 'cancelled');
      const pendingOrders = allOrders.filter((o: any) => o.status === 'pending');

      const grossRevenue = activeOrders.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0);
      const netRevenue = deliveredOrders.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0);
      const totalDiscounts = activeOrders.reduce((s: number, o: any) => s + Number(o.discount_amount || 0), 0);
      const deliveryRevenue = activeOrders.reduce((s: number, o: any) => s + Number(o.delivery_fee || 0), 0);
      const avgOrderValue = activeOrders.length > 0 ? grossRevenue / activeOrders.length : 0;
      const uniqueCustomers = new Set(activeOrders.map((o: any) => o.user_id)).size;

      // Group orders by day
      const byDay: Record<string, { orders: number; revenue: number; customers: Set<string> }> = {};
      for (const o of allOrders) {
        if (o.status === 'cancelled') continue;
        const day = o.created_at.slice(0, 10);
        if (!byDay[day]) byDay[day] = { orders: 0, revenue: 0, customers: new Set() };
        byDay[day].orders++;
        byDay[day].revenue += Number(o.total_amount || 0);
        if (o.user_id) byDay[day].customers.add(o.user_id);
      }
      const daily = Object.entries(byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({
          date,
          orders: v.orders,
          revenue: v.revenue,
          customers: v.customers.size,
        }));

      // Payment method breakdown
      const byPayment: Record<string, { count: number; total: number }> = {};
      for (const o of activeOrders) {
        const pm = o.payment_method || 'UNKNOWN';
        if (!byPayment[pm]) byPayment[pm] = { count: 0, total: 0 };
        byPayment[pm].count++;
        byPayment[pm].total += Number(o.total_amount || 0);
      }
      const byPaymentMethod = Object.entries(byPayment).map(([payment_method, v]) => ({
        payment_method,
        count: v.count,
        total: v.total,
      }));

      // Top products via order_items
      const { data: orderItems } = await sb
        .from('order_items')
        .select('product_id, variant_id, quantity, price')
        .in('order_id', activeOrders.map((o) => o.id));

      const productSales: Record<string, { units: number; revenue: number }> = {};
      for (const item of orderItems || []) {
        if (!productSales[item.product_id]) productSales[item.product_id] = { units: 0, revenue: 0 };
        productSales[item.product_id].units += Number(item.quantity || 0);
        productSales[item.product_id].revenue += Number(item.quantity || 0) * Number(item.price || 0);
      }
      const topProducts = Object.entries(productSales)
        .sort(([, a], [, b]) => (b as any).units - (a as any).units)
        .slice(0, 10)
        .map(([product_id, v]: [string, any]) => ({ product_id, total_sold: v.units, revenue: v.revenue }));

      reportData = {
        period: { from: fromDate, to: toDate },
        overview: {
          total_orders: allOrders.length,
          delivered_orders: deliveredOrders.length,
          cancelled_orders: cancelledOrders.length,
          pending_orders: pendingOrders.length,
          gross_revenue: grossRevenue,
          net_revenue: netRevenue,
          total_discounts: totalDiscounts,
          delivery_revenue: deliveryRevenue,
          avg_order_value: avgOrderValue,
          unique_customers: uniqueCustomers,
        },
        daily,
        topProducts,
        customers: { total_customers: uniqueCustomers, new_customers_30d: 0, returning_customers: 0 },
        byCategory: [],
        byPaymentMethod,
      };
    }

    // CSV export
    if (format === 'csv') {
      const csvRows = [
        'Date,Orders,Revenue,Customers',
        ...reportData.daily.map((r: any) =>
          `${r.date},${r.orders},${r.revenue},${r.customers}`
        ),
      ];
      return new NextResponse(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report-${period}.csv"`,
        },
      });
    }

    return NextResponse.json(reportData);
  } catch (error: any) {
    console.error('[Reports GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to generate report', details: error.message }, { status: 500 });
  }
}
