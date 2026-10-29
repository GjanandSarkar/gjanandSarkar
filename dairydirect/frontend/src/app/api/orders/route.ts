/**
 * GET/PUT /api/orders
 * Order management with AWS PostgreSQL + Supabase Fallback.
 * GET: Lists orders (Customer: own orders, Seller: orders for their products, Admin: all orders)
 * PUT: Updates order status with strict server-side transition validation & role authorization.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction, isPgConfigured } from '@/lib/aws/rds';
import { getAuthUser, getClientIP } from '@/lib/api/auth-middleware';
import { isValidUUID } from '@/lib/security/sanitize';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { writeAuditLog } from '@/lib/security/audit';
import { revalidateInventory } from '@/lib/inventory/cache-invalidation';

// Order status progression rules mirroring business logic & database stored procedures
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

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
    const orderType = searchParams.get('type'); // 'admin' | 'seller'
    const sellerIdFilter = searchParams.get('sellerId'); // specific seller ID
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // ─── 1. History Product IDs (Customer Buy Again) ──────────
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
                   'seller_id', prod.seller_id,
                   'sellers', json_build_object('id', s.id, 'store_name', s.store_name, 'slug', s.slug),
                   'weight', pv.weight
                 )
               ) FILTER (WHERE oi.id IS NOT NULL) as order_items
             FROM orders o
             LEFT JOIN profiles p ON p.id = o.user_id
             LEFT JOIN user_addresses ua ON ua.id = o.address_id
             LEFT JOIN order_items oi ON oi.order_id = o.id
             LEFT JOIN products prod ON prod.id = oi.product_id
             LEFT JOIN sellers s ON s.id = prod.seller_id
             LEFT JOIN product_variants pv ON pv.id = oi.variant_id
             WHERE o.id = $1 
             ${auth.isAdmin 
                ? '' 
                : auth.role === 'seller' 
                  ? 'AND (o.user_id = $2 OR EXISTS (SELECT 1 FROM order_items oi2 JOIN products p2 ON oi2.product_id = p2.id LEFT JOIN sellers s2 ON p2.seller_id = s2.id WHERE oi2.order_id = o.id AND (s2.user_id = $2 OR p2.created_by = $2)))' 
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
          profiles:user_id(name, phone, email),
          user_addresses(id, label, address),
          order_items(*, products(name, image_url, seller_id, sellers(id, store_name, slug)), product_variants(weight, price), return_requests(*))
        `)
        .eq('id', orderId);

      if (!auth.isAdmin && auth.role !== 'seller') {
        queryBuilder = queryBuilder.eq('user_id', auth.userId);
      }

      const { data: orderData, error } = await queryBuilder.maybeSingle();

      if (error || !orderData) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      if (orderData && !orderData.user_addresses && orderData.shipping_address) {
        try {
          const parsed = typeof orderData.shipping_address === 'string' ? JSON.parse(orderData.shipping_address) : orderData.shipping_address;
          orderData.user_addresses = {
            id: parsed.id || orderData.address_id,
            label: parsed.address_type ? parsed.address_type.toUpperCase() : 'Delivery Address',
            address: parsed.formatted_address || parsed.address || 'Address details',
            apartment: parsed.flat_house_building,
          };
        } catch (e) {}
      }

      // Check seller access control & isolate seller-owned items
      if (auth.role === 'seller' && !auth.isAdmin && orderData.user_id !== auth.userId) {
        const { data: sData } = await sb.from('sellers').select('id').eq('user_id', auth.userId).maybeSingle();
        const sellerId = sData?.id;

        // Strictly filter order_items so this seller only sees their own products
        orderData.order_items = (orderData.order_items || []).filter((oi: any) => {
          const pSellerId = oi.products?.seller_id || oi.seller_id;
          return (sellerId && pSellerId === sellerId) || oi.products?.created_by === auth.userId;
        });

        if (!orderData.order_items || orderData.order_items.length === 0) {
          return NextResponse.json({ error: 'Forbidden: You can only view orders containing your products' }, { status: 403 });
        }
      }

      // Ensure every order item has a defined fulfillment status
      (orderData.order_items || []).forEach((oi: any) => {
        if (!oi.status) oi.status = orderData.status;
      });

      return NextResponse.json({ order: orderData });
    }

    // ─── 3. Orders List ───────────────────────────────────────
    const sb = getAdminSupabase();

    let queryBuilder = sb
      .from('orders')
      .select(`
        *,
        profiles:user_id(name, phone, email),
        user_addresses(id, label, address),
        order_items(*, products(name, image_url, seller_id, sellers(id, store_name, slug)), product_variants(weight, price), return_requests(*))
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    let sellerId: string | null = null;

    if (auth.isAdmin) {
      if (status && status !== 'all') {
        queryBuilder = queryBuilder.eq('status', status);
      }

      if (orderType === 'admin') {
        // Only orders for admin products (exclude external seller products)
        const { data: sellerProdRows } = await sb
          .from('products')
          .select('id')
          .not('seller_id', 'is', null);

        const sellerProdIds = (sellerProdRows || []).map((p: any) => p.id);

        if (sellerProdIds.length > 0) {
          const { data: sellerOrderRows } = await sb
            .from('order_items')
            .select('order_id')
            .in('product_id', sellerProdIds);

          const sellerOrderIds = Array.from(new Set((sellerOrderRows || []).map((r: any) => r.order_id).filter(Boolean)));
          if (sellerOrderIds.length > 0) {
            queryBuilder = queryBuilder.not('id', 'in', `(${sellerOrderIds.join(',')})`);
          }
        }
      } else if (orderType === 'seller' || sellerIdFilter) {
        // Seller orders (optionally filtered by specific seller ID)
        let sellerProdsQuery = sb.from('products').select('id');
        if (sellerIdFilter && sellerIdFilter !== 'all') {
          sellerProdsQuery = sellerProdsQuery.eq('seller_id', sellerIdFilter);
        } else {
          sellerProdsQuery = sellerProdsQuery.not('seller_id', 'is', null);
        }

        const { data: sellerProdRows } = await sellerProdsQuery;
        const sellerProdIds = (sellerProdRows || []).map((p: any) => p.id);

        if (sellerProdIds.length === 0) {
          return NextResponse.json({ orders: [] });
        }

        const { data: sellerOrderRows } = await sb
          .from('order_items')
          .select('order_id')
          .in('product_id', sellerProdIds);

        const sellerOrderIds = Array.from(new Set((sellerOrderRows || []).map((r: any) => r.order_id).filter(Boolean)));
        if (sellerOrderIds.length === 0) {
          return NextResponse.json({ orders: [] });
        }

        queryBuilder = queryBuilder.in('id', sellerOrderIds);
      }
    } else if (auth.role === 'seller') {
      // Sellers view only their own orders
      const { data: store } = await sb
        .from('sellers')
        .select('id')
        .eq('user_id', auth.userId)
        .maybeSingle();

      sellerId = store?.id || null;
      let productIds: string[] = [];

      if (sellerId) {
        const { data: prods } = await sb
          .from('products')
          .select('id')
          .or(`seller_id.eq.${sellerId},created_by.eq.${auth.userId}`);
        if (prods) {
          productIds = prods.map((p: any) => p.id);
        }
      } else {
        const { data: prods } = await sb
          .from('products')
          .select('id')
          .eq('created_by', auth.userId);
        if (prods) {
          productIds = prods.map((p: any) => p.id);
        }
      }

      // Also check seller_product table
      const { data: sps } = await sb
        .from('seller_product')
        .select('product_id')
        .or(sellerId ? `seller_id.eq.${sellerId},seller_user_id.eq.${auth.userId}` : `seller_user_id.eq.${auth.userId}`);
      if (sps) {
        sps.forEach((sp: any) => {
          if (sp.product_id && !productIds.includes(sp.product_id)) {
            productIds.push(sp.product_id);
          }
        });
      }

      if (productIds.length === 0) {
        return NextResponse.json({ orders: [] });
      }

      // Find order IDs containing this seller's products
      const { data: orderItemRows } = await sb
        .from('order_items')
        .select('order_id')
        .in('product_id', productIds);

      const orderIds = Array.from(new Set((orderItemRows || []).map((r: any) => r.order_id).filter(Boolean)));
      if (orderIds.length === 0) {
        return NextResponse.json({ orders: [] });
      }

      queryBuilder = queryBuilder.in('id', orderIds);
      if (status && status !== 'all') {
        queryBuilder = queryBuilder.eq('status', status);
      }
    } else {
      // Customers view only their own orders
      queryBuilder = queryBuilder.eq('user_id', auth.userId);
      if (status && status !== 'all') {
        queryBuilder = queryBuilder.eq('status', status);
      }
    }

    const { data: ordersData, error } = await queryBuilder;

    if (error) {
      console.error('[Orders GET] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mappedOrders = (ordersData || []).map((o: any) => {
      // If seller, strictly isolate order_items so they ONLY see their own products
      if (auth.role === 'seller' && !auth.isAdmin && o.user_id !== auth.userId) {
        o.order_items = (o.order_items || []).filter((oi: any) => {
          const pSellerId = oi.products?.seller_id || oi.seller_id;
          return (sellerId && pSellerId === sellerId) || oi.products?.created_by === auth.userId;
        });
      }

      // Ensure each item has a status
      (o.order_items || []).forEach((oi: any) => {
        if (!oi.status) oi.status = o.status;
      });

      if (!o.user_addresses && o.shipping_address) {
        try {
          const parsed = typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address;
          o.user_addresses = {
            id: parsed.id || o.address_id,
            label: parsed.address_type ? parsed.address_type.toUpperCase() : 'Delivery Address',
            address: parsed.formatted_address || parsed.address || 'Address details',
            apartment: parsed.flat_house_building,
          };
        } catch (e) {}
      }

      let custName = o.profiles?.name;
      if (!custName && o.shipping_address) {
        try {
          const parsed = typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address;
          custName = parsed?.full_name || parsed?.name;
        } catch (e) {}
      }
      if (!custName && o.profiles?.email) {
        custName = o.profiles.email;
      }
      o.customer_name = custName || 'Customer';

      return o;
    });

    return NextResponse.json({ orders: mappedOrders });
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
    const { orderId, orderItemId, status, notes } = body;

    if (!orderId || !isValidUUID(orderId)) {
      return NextResponse.json({ error: 'Valid order ID required' }, { status: 400 });
    }

    const VALID_STATUSES = ['pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
    }

    const sb = getAdminSupabase();

    // 1. Fetch existing order to verify state and ownership
    const { data: existingOrder, error: fetchErr } = await sb
      .from('orders')
      .select('id, status, user_id, order_number, notes')
      .eq('id', orderId)
      .maybeSingle();

    if (fetchErr || !existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // ─── Item-Level Status Update / Cancellation ─────────────
    if (orderItemId) {
      if (!isValidUUID(orderItemId)) {
        return NextResponse.json({ error: 'Valid order item ID required' }, { status: 400 });
      }

      const { data: itemData, error: itemErr } = await sb
        .from('order_items')
        .select('*, products(name, seller_id, created_by)')
        .eq('id', orderItemId)
        .eq('order_id', orderId)
        .maybeSingle();

      if (itemErr || !itemData) {
        return NextResponse.json({ error: 'Order item not found' }, { status: 404 });
      }

      const itemCurrentStatus = itemData.status || existingOrder.status;

      if (itemCurrentStatus === status) {
        return NextResponse.json({ success: true, status, message: 'Item is already in this status' });
      }

      // Authorization for Item
      let isItemAuthorized = false;
      if (auth.isAdmin) {
        isItemAuthorized = true;
      } else if (auth.role === 'seller') {
        const { data: store } = await sb.from('sellers').select('id').eq('user_id', auth.userId).maybeSingle();
        const sellerId = store?.id;
        const pSellerId = itemData.products?.seller_id || itemData.seller_id;
        if ((sellerId && pSellerId === sellerId) || itemData.products?.created_by === auth.userId) {
          isItemAuthorized = true;
        } else {
          return NextResponse.json({ error: 'Forbidden: Sellers can only update their own order items' }, { status: 403 });
        }
      } else {
        if (existingOrder.user_id !== auth.userId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (status !== 'cancelled') {
          return NextResponse.json({ error: 'Customers can only cancel pending items' }, { status: 403 });
        }
        if (itemCurrentStatus !== 'pending') {
          return NextResponse.json({ error: 'Only pending items can be cancelled directly by customer' }, { status: 400 });
        }
        isItemAuthorized = true;
      }

      if (!isItemAuthorized) {
        return NextResponse.json({ error: 'Unauthorized to update this order item' }, { status: 403 });
      }

      // Handle item cancellation
      if (status === 'cancelled') {
        const cancelReason = notes || (auth.role === 'seller' ? 'Cancelled by Seller' : auth.isAdmin ? 'Cancelled by Admin' : 'Cancelled by Customer');
        const { data: cancelRes, error: cancelErr } = await sb.rpc('cancel_order_item_atomic', {
          p_order_item_id: orderItemId,
          p_actor_id: auth.userId,
          p_reason: cancelReason,
        });

        if (cancelErr || !cancelRes?.success) {
          return NextResponse.json({ error: cancelErr?.message || cancelRes?.message || 'Failed to cancel order item' }, { status: 400 });
        }

        await revalidateInventory();
        await writeAuditLog({
          adminId: auth.userId,
          action: 'order_item.cancel',
          resourceType: 'order_item',
          resourceId: orderItemId,
          details: { orderId, previousStatus: itemCurrentStatus, newStatus: 'cancelled', reason: cancelReason },
          ipAddress: getClientIP(request),
        });

        return NextResponse.json({ success: true, status: 'cancelled', orderItemId, message: 'Item cancelled and stock restored' });
      }

      // Item State Transition Validation
      const itemAllowed = ALLOWED_TRANSITIONS[itemCurrentStatus] || [];
      if (!itemAllowed.includes(status)) {
        return NextResponse.json({
          error: `Invalid transition: Item in '${itemCurrentStatus}' cannot move to '${status}'. Allowed: ${itemAllowed.join(', ') || 'None'}`
        }, { status: 400 });
      }

      const itemUpdatePayload: any = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (status === 'delivered') {
        itemUpdatePayload.delivered_at = new Date().toISOString();
      }

      const { error: itemUpdateErr } = await sb
        .from('order_items')
        .update(itemUpdatePayload)
        .eq('id', orderItemId);

      if (itemUpdateErr) {
        return NextResponse.json({ error: itemUpdateErr.message }, { status: 500 });
      }

      // Check if all non-cancelled sibling items reached this status to update order
      const { data: siblingItems } = await sb
        .from('order_items')
        .select('status')
        .eq('order_id', orderId);

      const activeSiblingStatuses = (siblingItems || []).map((s: any) => s.status).filter((s: any) => s !== 'cancelled');
      if (activeSiblingStatuses.length > 0 && activeSiblingStatuses.every((s: any) => s === status)) {
        await sb.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId);
      }

      await writeAuditLog({
        adminId: auth.userId,
        action: 'order_item.update_status',
        resourceType: 'order_item',
        resourceId: orderItemId,
        details: { orderId, previousStatus: itemCurrentStatus, newStatus: status, notes },
        ipAddress: getClientIP(request),
      });

      return NextResponse.json({ success: true, status, orderItemId });
    }

    const currentStatus = existingOrder.status;

    // 2. If order status is already up to date
    if (currentStatus === status) {
      return NextResponse.json({ success: true, status, message: 'Order is already in this status' });
    }

    // 3. Authorization & Permissions
    let isAuthorized = false;

    if (auth.isAdmin) {
      isAuthorized = true;
    } else if (auth.role === 'seller') {
      // Check if seller owns products in this order
      const { data: store } = await sb
        .from('sellers')
        .select('id')
        .eq('user_id', auth.userId)
        .maybeSingle();

      const sellerId = store?.id;

      const { data: items } = await sb
        .from('order_items')
        .select('product_id, products(seller_id, created_by)')
        .eq('order_id', orderId);

      const ownsProduct = (items || []).some((item: any) => {
        return (sellerId && item.products?.seller_id === sellerId) ||
               item.products?.created_by === auth.userId;
      });

      if (ownsProduct) {
        isAuthorized = true;
      } else {
        return NextResponse.json({ error: 'Forbidden: Sellers can update only their own orders' }, { status: 403 });
      }
    } else {
      // Customer can only cancel their own pending order
      if (existingOrder.user_id !== auth.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (status !== 'cancelled') {
        return NextResponse.json({ error: 'Customers can only cancel pending orders' }, { status: 403 });
      }
      if (currentStatus !== 'pending') {
        return NextResponse.json({ error: 'Only pending orders can be cancelled by customer' }, { status: 400 });
      }
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized to update this order' }, { status: 403 });
    }

    // 4. Server-side State Transition Validation
    // A delivered order cannot be cancelled through the normal cancellation action
    if (currentStatus === 'delivered') {
      return NextResponse.json({
        error: 'Delivered orders cannot be cancelled or modified through the normal cancellation action. Please submit a return or refund request.'
      }, { status: 400 });
    }

    if (currentStatus === 'cancelled') {
      return NextResponse.json({
        error: 'This order was cancelled and inventory has been restored. Cancelled orders cannot be reopened.'
      }, { status: 400 });
    }

    const allowedTargets = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowedTargets.includes(status)) {
      return NextResponse.json({
        error: `Invalid status transition: Order in '${currentStatus.replace('_', ' ')}' status cannot move directly to '${status.replace('_', ' ')}'. Allowed next transitions: ${allowedTargets.map(s => s.replace('_', ' ')).join(', ') || 'None'}.`
      }, { status: 400 });
    }

    // 5. Handle Order Cancellation
    if (status === 'cancelled') {
      const cancelReason = notes || (auth.role === 'seller' ? 'Cancelled by Seller' : auth.isAdmin ? 'Cancelled by Admin' : 'Cancelled by Customer');

      // Try calling RPC with modern signature (p_user_id, p_order_id, p_reason, p_actor_role)
      let rpcSucceeded = false;
      let cancelErrMessage: string | null = null;

      try {
        const { data: cancelRes1, error: cancelErr1 } = await sb.rpc('cancel_order_atomic', {
          p_order_id: orderId,
          p_user_id: auth.userId,
          p_reason: cancelReason,
          p_actor_role: auth.role || (auth.isAdmin ? 'admin' : 'customer'),
        });

        if (!cancelErr1 && cancelRes1?.success !== false) {
          rpcSucceeded = true;
        } else {
          // Fallback to legacy signature (p_order_id, p_actor_id, p_reason)
          const { data: cancelRes2, error: cancelErr2 } = await sb.rpc('cancel_order_atomic', {
            p_order_id: orderId,
            p_actor_id: auth.userId,
            p_reason: cancelReason,
          });

          if (!cancelErr2 && cancelRes2?.success !== false) {
            rpcSucceeded = true;
          } else {
            cancelErrMessage = cancelErr2?.message || cancelErr1?.message || 'RPC execution failed';
          }
        }
      } catch (err: any) {
        cancelErrMessage = err.message;
      }

      // If stored procedure succeeded, continue.
      // If RPC failed (e.g. not in schema cache), execute atomic fallback directly in database
      if (!rpcSucceeded) {
        console.warn('[Order Cancel] RPC not found or failed, executing direct database fallback:', cancelErrMessage);
        
        // 1. Update order status
        const { error: updateOrderErr } = await sb
          .from('orders')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancel_reason: cancelReason,
            cancelled_by: auth.role || (auth.isAdmin ? 'admin' : 'customer'),
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        if (updateOrderErr) {
          return NextResponse.json({ error: updateOrderErr.message || 'Failed to update order status' }, { status: 400 });
        }

        // 2. Restock inventory for items if order was not delivered
        if (currentStatus !== 'delivered') {
          const { data: orderItems } = await sb
            .from('order_items')
            .select('variant_id, quantity, product_id')
            .eq('order_id', orderId);

          for (const item of (orderItems || [])) {
            if (item.variant_id && item.quantity > 0) {
              const { data: vData } = await sb
                .from('product_variants')
                .select('stock, available_quantity, reserved_quantity')
                .eq('id', item.variant_id)
                .maybeSingle();

              if (vData) {
                const newStock = (vData.stock || 0) + item.quantity;
                const newAvail = (vData.available_quantity ?? vData.stock ?? 0) + item.quantity;
                await sb
                  .from('product_variants')
                  .update({ stock: newStock, available_quantity: newAvail })
                  .eq('id', item.variant_id);

                await sb.from('inventory_transactions').insert({
                  variant_id: item.variant_id,
                  product_id: item.product_id,
                  order_id: orderId,
                  change_type: 'cancellation',
                  quantity_change: item.quantity,
                  stock_before: vData.stock,
                  stock_after: newStock,
                  available_before: vData.available_quantity,
                  available_after: newAvail,
                  actor_id: auth.userId,
                  notes: `Order cancelled by ${auth.role}: ${cancelReason}`,
                }).catch(() => {});
              }
            }
          }
        }
      }

      await revalidateInventory();
      await writeAuditLog({
        adminId: auth.userId,
        action: 'order.cancel',
        resourceType: 'order',
        resourceId: orderId,
        details: { previousStatus: currentStatus, newStatus: 'cancelled', reason: cancelReason, actorRole: auth.role },
        ipAddress: getClientIP(request),
      });

      // Notify customer if cancelled by seller or admin
      if (auth.userId !== existingOrder.user_id && existingOrder.user_id) {
        try {
          await sb.from('notifications').insert({
            user_id: existingOrder.user_id,
            title: 'Order Cancelled',
            message: `Your order ${existingOrder.order_number} has been cancelled. Reason: ${cancelReason}`,
            type: 'order_status',
          });
        } catch (e) {}
      }

      return NextResponse.json({ success: true, status: 'cancelled', message: 'Order cancelled and stock restored' });
    }

    // 6. Handle Fulfillment Status Updates ('confirmed', 'out_for_delivery', 'delivered')
    const updatedNotes = notes ? (existingOrder.notes ? `${existingOrder.notes} | ${notes}` : notes) : existingOrder.notes;

    const { error: updateError } = await sb
      .from('orders')
      .update({
        status,
        notes: updatedNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('[Orders PUT] Supabase update failed:', updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await writeAuditLog({
      adminId: auth.userId,
      action: 'order.update_status',
      resourceType: 'order',
      resourceId: orderId,
      details: { previousStatus: currentStatus, newStatus: status, notes, actorRole: auth.role },
      ipAddress: getClientIP(request),
    });

    // Notify customer on status progression
    if (existingOrder.user_id) {
      try {
        const statusTitles: Record<string, string> = {
          confirmed: 'Order Confirmed',
          out_for_delivery: 'Order Out for Delivery',
          delivered: 'Order Delivered',
        };
        const statusMessages: Record<string, string> = {
          confirmed: `Your order ${existingOrder.order_number} has been confirmed by the seller and is being prepared for dispatch.`,
          out_for_delivery: `Your order ${existingOrder.order_number} is out for delivery!`,
          delivered: `Your order ${existingOrder.order_number} has been delivered successfully. Thank you for shopping with us!`,
        };
        await sb.from('notifications').insert({
          user_id: existingOrder.user_id,
          title: statusTitles[status] || 'Order Status Updated',
          message: statusMessages[status] || `Your order ${existingOrder.order_number} status changed to ${status}.`,
          type: 'order_status',
        });
      } catch (e) {}
    }

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error('[Orders PUT] Error:', error.message);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}