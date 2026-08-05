/**
 * GET /api/admin/customers
 * Admin customer management — customer directory, orders count, total spent, status.
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
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const conditions: string[] = ["p.role = 'customer'"];
    const params: any[] = [];
    let pIdx = 1;

    if (search) {
      conditions.push(`(p.name ILIKE $${pIdx} OR p.phone ILIKE $${pIdx} OR p.email ILIKE $${pIdx})`);
      params.push(`%${search}%`);
      pIdx++;
    }

    params.push(limit, offset);

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
       ORDER BY p.created_at DESC
       LIMIT $${pIdx++} OFFSET $${pIdx++}`,
      params
    );

    const countRes = await query(
      `SELECT COUNT(*) FROM profiles p WHERE ${conditions.join(' AND ')}`,
      params.slice(0, -2)
    );

    return NextResponse.json({
      customers: result.rows,
      total: parseInt(countRes.rows[0].count),
    });
  } catch (error: any) {
    console.error('[AdminCustomers GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
