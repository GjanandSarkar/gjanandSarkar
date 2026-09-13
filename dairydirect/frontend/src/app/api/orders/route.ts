/**
 * GET/PUT /api/orders
 * Order management with AWS PostgreSQL + Supabase Fallback.
 * GET: Lists customer orders or single order lookup with items & profiles.
 * PUT: Updates order status (admin) or cancels pending order (customer).
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction, isPgConfigured } from '@/lib/aws/rds';
import { getAuthUser, getClientIP } from '@/lib/api/auth-middleware';
import { isValidUUID } from '@/lib/security/sanitize';
import { getAdminSupabase } from '@/lib/supabase/admin';
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

    // ─── 1. History Product IDs ───────────────────────────────
    if (isHistory) {
      if (isPgConfigured) {
        try {
          const result = await query<{ product_id: string }>(
            `SELECT DISTINCT oi.product_id
             FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             WHERE o.user_id = $1 AND o.status != 'cancelled'
             ORDER BY oi.product_id
             LIMIT 5`,
            [auth.userId]
          );
          return NextResponse.json({ productIds: result.rows.map((r) => r.product_id).filter(Boolean) });
        } catch (err: any) {
          console.warn('[Orders GET History] RDS query failed:', err.message);
        }
      }

      const sb = getAdminSupabase();
      const { data } = await sb
        .from('orders')
        .select('order_items(product_id)')
        .eq('user_id', auth.userId)
        .neq('status', 'cancelled')
        .limit(10);

      const pIds = Array.from(
        new Set((data || []).flatMap((o: any) => (o.order_items || []).map((i: any) => i.product_id)).filter(Boolean))
      );
      return NextResponse.json({ productIds: pIds });
    }

    // ─── 2. Single Order Lookup ───────────────────────────────
    if (orderId) {
      if (!isValidUUID(orderId)) {
        return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
      }

      if (isPgConfigured) {
        try {
          const orderResult = await query(
            `SELECT 
               o.*,
               json_build_object('name', p.name, 'phone', p.phone, 'email', p.email) as profiles,
               json_build_object('id', ua.id, 'label', ua.label, 'address', ua.address) as user_addresses,
               json_agg(
                 json_build_object(
                   'id', oi.id,
                   'product_id', oi.product_id,
                   'variant_id', oi.variant_id,
                   'quantity', oi.quantity,
                   'price', oi.price,
                   'unit_price', oi.price,
                   'total_price', (oi.price * oi.quantity),
                   'product_name', prod.name,
                   'product_image', prod.image_url,
                   'weight', pv.weight
                 )
               ) FILTER (WHERE oi.id IS NOT NULL) as order_items
             FROM orders o
             LEFT JOIN profiles p ON p.id = o.user_id
             LEFT JOIN user_addresses ua ON ua.id = o.address_id
             LEFT JOIN order_items oi ON oi.order_id = o.id
             LEFT JOIN products prod ON prod.id = oi.product_id
             LEFT JOIN product_variants pv ON pv.id = oi.variant_id
             WHERE o.id = $1 
             ${auth.isAdmin 
                ? '' 
                : auth.role === 'seller' 
                  ? 'AND (o.user_id = $2 OR EXISTS (SELECT 1 FROM order_items oi2 JOIN products p2 ON oi2.product_id = p2.id JOIN sellers s ON p2.seller_id = s.id WHERE oi2.order_id = o.id AND s.user_id = $2))' 
                  : 'AND o.user_id = $2'}
             GROUP BY o.id, p.name, p.phone, p.email, ua.id, ua.label, ua.address`,
            auth.isAdmin ? [orderId] : [orderId, auth.userId]
          );

          if (orderResult.rows.length > 0) {
            return NextResponse.json({ order: orderResult.rows[0] });
          }
        } catch (err: any) {
          console.warn('[Orders GET Single] RDS query failed, fallback to Supabase:', err.message);
        }
      }

      const sb = getAdminSupabase();
      let queryBuilder = sb
        .from('orders')
        .select(`
          *,
          profiles(name, phone, email),
          user_addresses(id, label, address),
          order_items(*, products(name, image_url), product_variants(weight, price))
        `)
        .eq('id', orderId);

      if (!auth.isAdmin && auth.role !== 'seller') {
        queryBuilder = queryBuilder.eq('user_id', auth.userId);
      } else if (auth.role === 'seller') {
        // For seller via Supabase fallback, we do a post-fetch filter
      }

      const { data: orderData, error } = await queryBuilder.maybeSingle();

      if (error || !orderData) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      if (auth.role === 'seller' && orderData.user_id !== auth.userId) {
        const admin = getAdminSupabase();
        // Check if seller has items in this order
        const { data: sData } = await admin.from('sellers').select('id').eq('user_id', auth.userId).single();
        if (!sData) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        
        let hasMyProduct = false;
        for (const oi of orderData.order_items || []) {
           const { data: pData } = await admin.from('products').select('seller_id').eq('id', oi.product_id).single();
           if (pData && pData.seller_id === sData.id) {
               hasMyProduct = true;
               break;
           }
        }
        
        if (!hasMyProduct) {
           return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }

      return NextResponse.json({ order: orderData });
    }

    // ─── 3. Orders List ───────────────────────────────────────
    if (isPgConfigured) {
      try {
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
             json_build_object('id', ua.id, 'label', ua.label, 'address', ua.address) as user_addresses,
             json_agg(
               json_build_object(
                 'id', oi.id,
                 'product_id', oi.product_id,
                 'variant_id', oi.variant_id,
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'unit_price', oi.price,
                 'total_price', (oi.price * oi.quantity),
                 'product_name', prod.name,
                 'product_image', prod.image_url,
                 'weight', pv.weight
               )
             ) FILTER (WHERE oi.id IS NOT NULL) as order_items
           FROM orders o
           LEFT JOIN profiles p ON p.id = o.user_id
           LEFT JOIN user_addresses ua ON ua.id = o.address_id
           LEFT JOIN order_items oi ON oi.order_id = o.id
           LEFT JOIN products prod ON prod.id = oi.product_id
           LEFT JOIN product_variants pv ON pv.id = oi.variant_id
           ${whereClause}
           GROUP BY o.id, p.name, p.phone, p.email, ua.id, ua.label, ua.address
           ORDER BY o.created_at DESC
           LIMIT $${pIdx++} OFFSET $${pIdx++}`,
          params
        );

        return NextResponse.json({ orders: result.rows });
      } catch (err: any) {
        console.warn('[Orders GET List] RDS query failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    let queryBuilder = sb
      .from('orders')
      .select(`
        *,
        profiles(name, phone, email),
        user_addresses(id, label, address),
        order_items(*, products(name, image_url), product_variants(weight, price))
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (!auth.isAdmin) {
      queryBuilder = queryBuilder.eq('user_id', auth.userId);
    } else if (status && status !== 'all') {
      queryBuilder = queryBuilder.eq('status', status);
    }

    const { data: ordersData, error } = await queryBuilder;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: ordersData || [] });
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

      if (isPgConfigured) {
        try {
          const checkRes = await query<{ user_id: string; status: string }>(
            'SELECT user_id, status FROM orders WHERE id = $1',
            [orderId]
          );
          if (checkRes.rows.length === 0 || checkRes.rows[0].user_id !== auth.userId) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
          }
          if (checkRes.rows[0].status !== 'pending' && checkRes.rows[0].status !== 'confirmed') {
            return NextResponse.json({ error: 'Only pending/confirmed orders can be cancelled' }, { status: 400 });
          }

          await withTransaction(async (client) => {
            const items = await client.query<{ variant_id: string; quantity: number }>(
              'SELECT variant_id, quantity FROM order_items WHERE order_id = $1',
              [orderId]
            );
            for (const item of items.rows) {
              await client.query('UPDATE product_variants SET stock = stock + $1 WHERE id = $2', [
                item.quantity,
                item.variant_id,
              ]);
            }
            await client.query("UPDATE orders SET status = 'cancelled', updated_at = now() WHERE id = $1", [orderId]);
          });

          return NextResponse.json({ success: true, message: 'Order cancelled' });
        } catch (err: any) {
          console.warn('[Orders Cancel] RDS failed, fallback to Supabase:', err.message);
        }
      }

      const sb = getAdminSupabase();
      const { data: orderData } = await sb.from('orders').select('user_id, status').eq('id', orderId).maybeSingle();
      if (!orderData || orderData.user_id !== auth.userId) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      await sb.from('orders').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', orderId);
      return NextResponse.json({ success: true, message: 'Order cancelled' });
    }

    // Admin status update
    if (isPgConfigured) {
      try {
        const updateResult = await query<{ user_id: string; order_number: string }>(
          `UPDATE orders 
           SET status = $1, 
               notes = COALESCE($2, notes),
               updated_at = now()
           WHERE id = $3
           RETURNING user_id, order_number`,
          [status, notes || null, orderId]
        );

        if (updateResult.rows.length > 0) {
          await writeAuditLog({
            adminId: auth.userId,
            action: 'order.update' as any,
            resourceType: 'order',
            resourceId: orderId,
            details: { status, notes },
            ipAddress: request.headers.get('x-forwarded-for') || ''
          });
          return NextResponse.json({ success: true, status });
        }
      } catch (err: any) {
        console.warn('[Orders PUT] RDS failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    const { error } = await sb
      .from('orders')
      .update({ status, notes: notes || undefined, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAuditLog({
      adminId: auth.userId,
      action: 'order.update' as any,
      resourceType: 'order',
      resourceId: orderId,
      details: { status, notes },
      ipAddress: request.headers.get('x-forwarded-for') || ''
    });

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error('[Orders PUT] Error:', error.message);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}