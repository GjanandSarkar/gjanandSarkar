/**
 * GET /api/admin/reports
 * Business intelligence — revenue, orders, product performance.
 * Admin only. Supports date range filtering and CSV export.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/rds';
import { getAuthUser } from '@/lib/api/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, custom
    const format = searchParams.get('format'); // 'csv'
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

    // ─── Revenue Overview ─────────────────────────────────────
    const revenueResult = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status != 'cancelled') as total_orders,
         COUNT(*) FILTER (WHERE status = 'delivered') as delivered_orders,
         COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
         COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
         SUM(total_amount) FILTER (WHERE status != 'cancelled') as gross_revenue,
         SUM(total_amount) FILTER (WHERE status = 'delivered') as net_revenue,
         SUM(discount_amount) FILTER (WHERE status != 'cancelled') as total_discounts,
         SUM(delivery_fee) FILTER (WHERE status != 'cancelled') as delivery_revenue,
         AVG(total_amount) FILTER (WHERE status != 'cancelled') as avg_order_value,
         COUNT(DISTINCT user_id) FILTER (WHERE status != 'cancelled') as unique_customers
       FROM orders
       WHERE created_at BETWEEN $1 AND $2`,
      [fromDate, toDate]
    );

    // ─── Daily Revenue (for chart) ────────────────────────────
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

    // ─── Top Products ─────────────────────────────────────────
    const topProductsResult = await query(
      `SELECT
         p.name,
         p.category,
         p.image_url,
         pv.weight,
         SUM(oi.quantity) as total_sold,
         SUM(oi.quantity * oi.unit_price) as revenue,
         SUM(oi.quantity * pv.cost_price) as cost,
         SUM(oi.quantity * (oi.unit_price - pv.cost_price)) as profit
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       JOIN product_variants pv ON pv.id = oi.variant_id
       WHERE o.created_at BETWEEN $1 AND $2
         AND o.status != 'cancelled'
       GROUP BY p.name, p.category, p.image_url, pv.weight
       ORDER BY total_sold DESC
       LIMIT 10`,
      [fromDate, toDate]
    );

    // ─── Customer Stats ───────────────────────────────────────
    const customerResult = await query(
      `SELECT
         COUNT(*) as total_customers,
         COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_customers_30d,
         (SELECT COUNT(DISTINCT user_id) FROM orders 
          WHERE created_at BETWEEN $1 AND $2 
          AND user_id IN (
            SELECT user_id FROM orders 
            WHERE created_at < $1 
            GROUP BY user_id
          )) as returning_customers
       FROM profiles
       WHERE role = 'customer'`,
      [fromDate, toDate]
    );

    // ─── Category Revenue ─────────────────────────────────────
    const categoryResult = await query(
      `SELECT
         p.category,
         COUNT(DISTINCT o.id) as orders,
         SUM(oi.quantity) as units_sold,
         SUM(oi.quantity * oi.unit_price) as revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       WHERE o.created_at BETWEEN $1 AND $2
         AND o.status != 'cancelled'
       GROUP BY p.category
       ORDER BY revenue DESC`,
      [fromDate, toDate]
    );

    // ─── Payment Method Breakdown ─────────────────────────────
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

    const reportData = {
      period: { from: fromDate, to: toDate },
      overview: revenueResult.rows[0],
      daily: dailyResult.rows,
      topProducts: topProductsResult.rows,
      customers: customerResult.rows[0],
      byCategory: categoryResult.rows,
      byPaymentMethod: paymentResult.rows,
    };

    // CSV export
    if (format === 'csv') {
      const csvRows = [
        'Date,Orders,Revenue,Customers',
        ...dailyResult.rows.map((r: any) =>
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
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
