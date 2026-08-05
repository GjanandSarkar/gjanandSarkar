/**
 * GET/PUT /api/orders
 * Order management — AWS PostgreSQL version.
 * GET: Lists customer orders or admin order overview with filtering.
 * PUT: Updates order status (admin) or cancels pending order (customer).
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/aws/rds';
import { getAuthUser, getClientIP } from '@/lib/api/auth-middleware';
import { isValidUUID } from '@/lib/security/sanitize';
import { sendOrderStatusEmail } from '@/lib/aws/ses';
import { writeAuditLog } from '@/lib/security/audit';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    const isHistory = searchParams.get('history') === 'true';
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // ─── Fast Recent Products for Homepage / Reordering ────────
    if (isHistory) {
      const result = await query<{ product_id: string }>(
        `SELECT DISTINCT oi.product_id
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE o.user_id = $1 AND o.status != 'cancelled'
         ORDER BY oi.product_id
         LIMIT 5`,
        [auth.userId]
      );
      return NextResponse.json({ productIds: result.rows.map(r => r.product_id) });
    }

    // ─── Single Order Lookup ──────────────────────────────────
    if (orderId) {
      if (!isValidUUID(orderId)) {
        return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
      }

      const orderResult = await query(
        `SELECT 
           o.*,
           json_build_object('name', p.name, 'phone', p.phone, 'email', p.email) as profiles,
           json_agg(
             json_build_object(
               'id', oi.id,
               'product_id', oi.product_id,
               'variant_id', oi.variant_id,
               'quantity', oi.quantity,
               'unit_price', oi.unit_price,
               'total_price', oi.total_price,
               'product_name', prod.name,
               'product_image', prod.image_url,
               'weight', pv.weight
             )
           ) FILTER (WHERE oi.id IS NOT NULL) as order_items
         FROM orders o
         LEFT JOIN profiles p ON p.id = o.user_id
         LEFT JOIN order_items oi ON oi.order_id = o.id
         LEFT JOIN products prod ON prod.id = oi.product_id
         LEFT JOIN product_variants pv ON pv.id = oi.variant_id
         WHERE o.id = $1 ${auth.isAdmin ? '' : 'AND o.user_id = $2'}
         GROUP BY o.id, p.name, p.phone, p.email`,
        auth.isAdmin ? [orderId] : [orderId, auth.userId]
      );

      if (orderResult.rows.length === 0) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      return NextResponse.json({ order: orderResult.rows[0] });
    }

    // ─── Orders List ──────────────────────────────────────────
    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (!auth.isAdmin) {
      conditions.push(`o.user_id = $${pIdx++}`);
      params.push(auth.userId);
    } else if (status && status !== 'all') {
      conditions.push(`o.status = $${pIdx++}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const result = await query(
      `SELECT 
         o.*,
         json_build_object('name', p.name, 'phone', p.phone, 'email', p.email) as profiles,
         json_agg(
           json_build_object(
             'id', oi.id,
             'product_id', oi.product_id,
             'variant_id', oi.variant_id,
             'quantity', oi.quantity,
             'unit_price', oi.unit_price,
             'total_price', oi.total_price,
             'product_name', prod.name,
             'product_image', prod.image_url,
             'weight', pv.weight
           )
         ) FILTER (WHERE oi.id IS NOT NULL) as order_items
       FROM orders o
       LEFT JOIN profiles p ON p.id = o.user_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN products prod ON prod.id = oi.product_id
       LEFT JOIN product_variants pv ON pv.id = oi.variant_id
       ${whereClause}
       GROUP BY o.id, p.name, p.phone, p.email
       ORDER BY o.created_at DESC
       LIMIT $${pIdx++} OFFSET $${pIdx++}`,
      params
    );

    return NextResponse.json({ orders: result.rows });
  } catch (error: any) {
    console.error('[Orders GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, status, notes } = body;

    if (!orderId || !isValidUUID(orderId)) {
      return NextResponse.json({ error: 'Valid order ID required' }, { status: 400 });
    }

    const VALID_STATUSES = ['pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
    }

    // Customer can only cancel their own pending order
    if (!auth.isAdmin) {
      if (status !== 'cancelled') {
        return NextResponse.json({ error: 'Customers can only cancel pending orders' }, { status: 403 });
      }

      // Check order belongs to user and is pending
      const checkRes = await query<{ user_id: string; status: string }>(
        'SELECT user_id, status FROM orders WHERE id = $1',
        [orderId]
      );
      if (checkRes.rows.length === 0 || checkRes.rows[0].user_id !== auth.userId) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      if (checkRes.rows[0].status !== 'pending') {
        return NextResponse.json({ error: 'Only pending orders can be cancelled' }, { status: 400 });
      }

      // Rollback stock in transaction
      await withTransaction(async (client) => {
        const items = await client.query<{ variant_id: string; quantity: number }>(
          'SELECT variant_id, quantity FROM order_items WHERE order_id = $1',
          [orderId]
        );
        for (const item of items.rows) {
          await client.query(
            'UPDATE product_variants SET stock = stock + $1, is_available = true WHERE id = $2',
            [item.quantity, item.variant_id]
          );
        }
        await client.query(
          "UPDATE orders SET status = 'cancelled', updated_at = now() WHERE id = $1",
          [orderId]
        );
      });

      return NextResponse.json({ success: true, message: 'Order cancelled' });
    }

    // Admin status update
    const updateResult = await query<{ user_id: string; order_number: string }>(
      `UPDATE orders 
       SET status = $1, 
           delivered_at = CASE WHEN $1 = 'delivered' THEN now() ELSE delivered_at END,
           notes = COALESCE($2, notes),
           updated_at = now()
       WHERE id = $3
       RETURNING user_id, order_number`,
      [status, notes || null, orderId]
    );

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = updateResult.rows[0];

    // Notify customer asynchronously via SES
    setImmediate(async () => {
      try {
        const userRes = await query<{ email: string | null; name: string | null }>(
          'SELECT email, name FROM profiles WHERE id = $1',
          [order.user_id]
        );
        const user = userRes.rows[0];
        if (user?.email) {
          await sendOrderStatusEmail({
            to: user.email,
            customerName: user.name || 'Valued Customer',
            orderId: order.order_number,
            status,
          });
        }
      } catch (err) {
        console.error('[Orders PUT SES Notify] Error:', err);
      }
    });

    await writeAuditLog({
      adminId: auth.userId,
      action: 'order.status_update',
      resourceType: 'order',
      resourceId: orderId,
      details: { status, notes },
      ipAddress: getClientIP(request),
    });

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error('[Orders PUT] Error:', error.message);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}