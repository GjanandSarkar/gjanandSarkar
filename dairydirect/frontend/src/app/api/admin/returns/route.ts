/**
 * GET/POST/PUT /api/admin/returns
 * Comprehensive Order Cancellation & Product Returns Management API
 * 
 * Roles:
 * - Customer: View own requests, submit item cancellation or return request with defect photos.
 * - Seller: View & manage (approve/reject) requests for their own products only.
 * - Admin: View all requests globally, approve/reject/override, advance return stages, initiate refunds.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getClientIP } from '@/lib/api/auth-middleware';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { writeAuditLog } from '@/lib/security/audit';
import { createRazorpayRefund } from '@/lib/razorpay';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const requestType = searchParams.get('requestType'); // 'cancellation' | 'return'
    const sellerIdFilter = searchParams.get('sellerId');
    const orderIdFilter = searchParams.get('orderId');

    const sb = getAdminSupabase();

    let query = sb
      .from('return_requests')
      .select(`
        *,
        orders:order_id (
          id,
          order_number,
          total_amount,
          payment_method,
          payment_status,
          status,
          created_at,
          delivery_date,
          razorpay_payment_id,
          shipping_address,
          address_id
        ),
        order_items:order_item_id (
          id,
          product_name,
          variant_weight,
          quantity,
          price,
          status
        ),
        products:product_id (
          id,
          name,
          image_url,
          seller_id
        ),
        sellers:seller_id (
          id,
          store_name,
          slug
        ),
        profiles:user_id (
          id,
          name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false });

    // 1. Role-based isolation
    if (auth.isAdmin) {
      if (sellerIdFilter && sellerIdFilter !== 'all') {
        query = query.eq('seller_id', sellerIdFilter);
      }
    } else if (auth.role === 'seller') {
      // Seller sees only requests for their products
      const { data: store } = await sb
        .from('sellers')
        .select('id')
        .eq('user_id', auth.userId)
        .maybeSingle();

      const sellerId = store?.id;

      if (!sellerId) {
        return NextResponse.json({ returns: [], total: 0 });
      }

      query = query.eq('seller_id', sellerId);
    } else {
      // Customer sees only their own requests
      query = query.eq('user_id', auth.userId);
    }

    // 2. Query filters
    if (status && status !== 'all') {
      if (status === 'pending') {
        query = query.in('status', ['submitted', 'under_review', 'pending']);
      } else {
        query = query.eq('status', status);
      }
    }

    if (requestType && requestType !== 'all') {
      query = query.eq('request_type', requestType);
    }

    if (orderIdFilter) {
      query = query.eq('order_id', orderIdFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[Returns GET] Supabase error:', error.message);
      return NextResponse.json({ returns: [], total: 0, error: error.message });
    }

    // Collect address IDs for fallback if needed
    const addressIds = Array.from(new Set(
      (data || [])
        .map((r: any) => r.orders?.address_id)
        .filter((id: any): id is string => Boolean(id))
    ));

    const addressMap = new Map<string, string>();
    if (addressIds.length > 0) {
      const { data: addressRows } = await sb
        .from('user_addresses')
        .select('*')
        .in('id', addressIds);

      (addressRows || []).forEach((a: any) => {
        const parts = [
          a.flat_house_building || a.building || a.apartment,
          a.area_street_sector_village || a.street || a.address,
          a.landmark ? `Near ${a.landmark}` : null,
          a.town_city || a.city ? `${a.town_city || a.city}, ${a.state || ''} ${a.pincode ? `- ${a.pincode}` : ''}`.trim() : null
        ].filter(Boolean);
        const formatted = parts.length > 0 ? parts.join(', ') : (a.address || '');
        if (formatted) addressMap.set(a.id, formatted);
      });
    }

    const formatDeliveryAddress = (order: any): string => {
      if (!order) return '';
      if (order.shipping_address) {
        if (typeof order.shipping_address === 'string') {
          try {
            const parsed = JSON.parse(order.shipping_address);
            if (typeof parsed === 'string') return parsed;
            if (parsed.formatted_address) return parsed.formatted_address;
            const parts = [
              parsed.flat_house_building || parsed.building || parsed.apartment,
              parsed.area_street_sector_village || parsed.street || parsed.address,
              parsed.landmark ? `Near ${parsed.landmark}` : null,
              parsed.town_city || parsed.city ? `${parsed.town_city || parsed.city}, ${parsed.state || ''} ${parsed.pincode ? `- ${parsed.pincode}` : ''}`.trim() : null
            ].filter(Boolean);
            if (parts.length > 0) return parts.join(', ');
          } catch {
            if (order.shipping_address.trim()) return order.shipping_address;
          }
        } else if (typeof order.shipping_address === 'object') {
          const parsed = order.shipping_address;
          if (parsed.formatted_address) return parsed.formatted_address;
          const parts = [
            parsed.flat_house_building || parsed.building || parsed.apartment,
            parsed.area_street_sector_village || parsed.street || parsed.address,
            parsed.landmark ? `Near ${parsed.landmark}` : null,
            parsed.town_city || parsed.city ? `${parsed.town_city || parsed.city}, ${parsed.state || ''} ${parsed.pincode ? `- ${parsed.pincode}` : ''}`.trim() : null
          ].filter(Boolean);
          if (parts.length > 0) return parts.join(', ');
        }
      }
      if (order.address_id && addressMap.has(order.address_id)) {
        return addressMap.get(order.address_id) || '';
      }
      return '';
    };

    // Fetch refund rows for these return requests
    const requestIds = (data || []).map((r: any) => r.id);
    const orderIds = Array.from(new Set((data || []).map((r: any) => r.order_id).filter(Boolean)));
    const { data: refundRows } = requestIds.length > 0
      ? await sb.from('refunds').select('*').or(`return_request_id.in.(${requestIds.join(',')}),order_id.in.(${orderIds.join(',')})`)
      : { data: [] };

    const refundByRequestMap = new Map<string, any>();
    const refundByOrderMap = new Map<string, any>();
    (refundRows || []).forEach((rf: any) => {
      if (rf.return_request_id) {
        refundByRequestMap.set(rf.return_request_id, rf);
      } else if (rf.order_id) {
        refundByOrderMap.set(rf.order_id, rf);
      }
    });

    // Format results with consistent naming
    const mapped = (data || []).map((r: any) => ({
      id: r.id,
      order_id: r.order_id,
      order_item_id: r.order_item_id,
      product_id: r.product_id,
      seller_id: r.seller_id,
      user_id: r.user_id,
      request_type: r.request_type || 'return',
      reason: r.reason,
      description: r.description,
      images: r.images || [],
      status: r.status,
      refund_amount: r.refund_amount ? Number(r.refund_amount) : null,
      seller_notes: r.seller_notes,
      seller_status: r.seller_status || 'pending',
      admin_notes: r.admin_notes,
      rejection_reason: r.rejection_reason,
      history: r.history || [],
      created_at: r.created_at,
      resolved_at: r.resolved_at,
      updated_at: r.updated_at,
      pickup_address_id: r.pickup_address_id,
      picked_up_at: r.picked_up_at,
      received_at: r.received_at,
      refund_initiated_at: r.refund_initiated_at,
      completed_at: r.completed_at,
      replacement_tracking_no: r.replacement_tracking_no,
      replacement_dispatched_at: r.replacement_dispatched_at,
      refund: refundByRequestMap.get(r.id) || refundByOrderMap.get(r.order_id) || null,
      // Joined relations
      order_number: r.orders?.order_number || r.order_id?.slice(0, 8),
      order_total: r.orders?.total_amount ? Number(r.orders.total_amount) : 0,
      order_status: r.orders?.status,
      order_date: r.orders?.created_at,
      payment_method: r.orders?.payment_method || 'COD',
      payment_status: r.orders?.payment_status || 'pending',
      razorpay_payment_id: r.orders?.razorpay_payment_id,
      delivery_address: formatDeliveryAddress(r.orders),
      product_name: r.order_items?.product_name || r.products?.name || 'Dairy Product',
      product_image: r.products?.image_url,
      variant_weight: r.order_items?.variant_weight,
      item_quantity: r.order_items?.quantity || 1,
      item_price: r.order_items?.price ? Number(r.order_items.price) : 0,
      item_status: r.order_items?.status || r.orders?.status,
      seller_name: r.sellers?.store_name || 'Direct Seller',
      seller_slug: r.sellers?.slug,
      customer_name: r.profiles?.name || 'Customer',
      customer_email: r.profiles?.email || '',
      customer_phone: r.profiles?.phone || '',
    }));

    return NextResponse.json({
      returns: mapped,
      total: mapped.length,
    });
  } catch (error: any) {
    console.error('[Returns GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}

const SubmitRequestSchema = z.object({
  orderId: z.string().uuid(),
  orderItemId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  requestType: z.enum(['cancellation', 'return']).default('return'),
  reason: z.string().min(1, 'Reason is required'),
  description: z.string().max(2000).optional(),
  images: z.array(z.string()).max(5).optional(),
}).refine(data => !!(data.orderItemId || data.productId), {
  message: 'Either order item or product must be specified',
});

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Please log in to submit a request' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = SubmitRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const { orderId, orderItemId, productId: inputProductId, requestType, reason, description, images = [] } = parseResult.data;

    const sb = getAdminSupabase();

    // 1. Fetch order and verify ownership
    const { data: order, error: orderErr } = await sb
      .from('orders')
      .select('id, user_id, status, created_at, delivery_date, total_amount')
      .eq('id', orderId)
      .maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.user_id !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden: You can only submit requests for your own orders' }, { status: 403 });
    }

    // 2. Fetch order item and verify it belongs to this order
    let itemQuery = sb
      .from('order_items')
      .select('id, order_id, product_id, quantity, price, status, delivered_at, products(id, name, seller_id, created_by)')
      .eq('order_id', orderId);

    if (orderItemId) {
      itemQuery = itemQuery.eq('id', orderItemId);
    } else if (inputProductId) {
      itemQuery = itemQuery.eq('product_id', inputProductId);
    }

    const { data: item, error: itemErr } = await itemQuery.limit(1).maybeSingle();

    if (itemErr || !item) {
      return NextResponse.json({ error: 'Order item not found in this order' }, { status: 404 });
    }

    const resolvedOrderItemId = item.id;
    const itemStatus = item.status || order.status;
    const prod = (item as any).products;
    const sellerId = prod?.seller_id || null;
    const productId = item.product_id;

    // 3. Business Policy Validation
    if (requestType === 'cancellation') {
      if (itemStatus === 'delivered') {
        return NextResponse.json({
          error: 'Delivered items cannot be cancelled. Please submit a Return Product request instead.'
        }, { status: 400 });
      }
      if (itemStatus === 'cancelled') {
        return NextResponse.json({
          error: 'This item is already cancelled.'
        }, { status: 400 });
      }

      // Check for active duplicate cancellation request
      const { data: existingReq } = await sb
        .from('return_requests')
        .select('id, status')
        .eq('order_item_id', resolvedOrderItemId)
        .eq('request_type', 'cancellation')
        .not('status', 'in', '("rejected")')
        .maybeSingle();

      if (existingReq) {
        return NextResponse.json({
          error: `A cancellation request (#${existingReq.id.slice(0, 8)}) is already ${existingReq.status} for this item.`
        }, { status: 400 });
      }
    } else {
      // Product Return Request
      if (itemStatus !== 'delivered' && order.status !== 'delivered') {
        return NextResponse.json({
          error: 'Only delivered items are eligible for return.'
        }, { status: 400 });
      }

      if (itemStatus === 'cancelled') {
        return NextResponse.json({
          error: 'Cancelled items cannot be returned.'
        }, { status: 400 });
      }

      // Check return eligibility window (e.g. 7 days from delivery)
      const deliveryTime = item.delivered_at || order.delivery_date || order.created_at;
      const daysSinceDelivery = (Date.now() - new Date(deliveryTime).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDelivery > 7) {
        return NextResponse.json({
          error: 'The 7-day return window for this item has expired.'
        }, { status: 400 });
      }

      // Check for active duplicate return request
      const { data: existingReq } = await sb
        .from('return_requests')
        .select('id, status')
        .eq('order_item_id', resolvedOrderItemId)
        .eq('request_type', 'return')
        .not('status', 'in', '("rejected")')
        .maybeSingle();

      if (existingReq) {
        return NextResponse.json({
          error: `A return request (#${existingReq.id.slice(0, 8)}) is already ${existingReq.status} for this item.`
        }, { status: 400 });
      }
    }

    // 4. Record the request permanently against item, product, and seller
    const initialHistory = [{
      action: 'submitted',
      actor_id: auth.userId,
      actor_type: 'customer',
      timestamp: new Date().toISOString(),
      notes: reason,
    }];

    const basePayload = {
      order_id: orderId,
      order_item_id: resolvedOrderItemId,
      product_id: productId,
      seller_id: sellerId,
      user_id: auth.userId,
      request_type: requestType,
      reason,
      description: description || null,
      images: images || [],
      seller_status: 'pending',
      refund_amount: Number(item.price) * Number(item.quantity),
      history: initialHistory,
    };

    let reqData: any = null;
    let reqErr: any = null;

    const resSubmitted = await sb
      .from('return_requests')
      .insert({
        ...basePayload,
        status: 'submitted',
      })
      .select('id')
      .single();

    if (resSubmitted.error && (resSubmitted.error.message?.includes('check constraint') || resSubmitted.error.message?.includes('status'))) {
      const resPending = await sb
        .from('return_requests')
        .insert({
          ...basePayload,
          status: 'pending',
        })
        .select('id')
        .single();
      reqData = resPending.data;
      reqErr = resPending.error;
    } else {
      reqData = resSubmitted.data;
      reqErr = resSubmitted.error;
    }

    if (reqErr || !reqData) {
      console.error('[Returns POST] DB error:', reqErr?.message);
      return NextResponse.json({ error: reqErr?.message || 'Failed to submit request' }, { status: 500 });
    }

    // 5. Notify the relevant seller
    if (sellerId) {
      try {
        const { data: sellerRecord } = await sb.from('sellers').select('user_id').eq('id', sellerId).maybeSingle();
        if (sellerRecord?.user_id) {
          await sb.from('notifications').insert({
            user_id: sellerRecord.user_id,
            title: requestType === 'cancellation' ? 'Item Cancellation Requested' : 'Item Return Requested',
            message: `Customer requested ${requestType} for ${prod?.name || 'an item'} in Order #${order.id.slice(0, 8)}. Reason: ${reason}`,
            type: 'order_request',
          });
        }
      } catch (e) {}
    }

    await writeAuditLog({
      adminId: auth.userId,
      action: `request.${requestType}.submitted`,
      resourceType: 'return_request',
      resourceId: reqData.id,
      details: { orderId, orderItemId: resolvedOrderItemId, requestType, reason, sellerId },
      ipAddress: getClientIP(request),
    });

    return NextResponse.json({
      success: true,
      requestId: reqData.id,
      message: `${requestType === 'cancellation' ? 'Cancellation' : 'Return'} request submitted successfully. The seller and admin team will review it.`,
    });
  } catch (error: any) {
    console.error('[Returns POST] Error:', error.message);
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }
}

const ProcessRequestSchema = z.object({
  requestId: z.string().uuid().optional(),
  returnId: z.string().uuid().optional(), // backwards compatibility
  action: z.enum([
    'approve',
    'reject',
    'override',
    'return_in_progress',
    'item_received',
    'inspection_completed',
    'refund_pending',
    'refunded',
  ]),
  reason: z.string().optional(),
  rejectionReason: z.string().optional(),
  adminNotes: z.string().max(1000).optional(),
  notes: z.string().max(1000).optional(),
  refundAmount: z.number().positive().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = ProcessRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const {
      requestId: reqIdParam,
      returnId: retIdParam,
      action,
      reason: explicitReason,
      rejectionReason: explicitRejReason,
      adminNotes,
      notes: explicitNotes,
      refundAmount,
    } = parseResult.data;

    const targetRequestId = reqIdParam || retIdParam;
    if (!targetRequestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    const finalReason = explicitReason || explicitRejReason || explicitNotes || adminNotes || '';

    // Rejection or override requires a mandatory reason
    if (['reject', 'override'].includes(action) && !finalReason.trim()) {
      return NextResponse.json({
        error: `A recorded reason is mandatory when ${action === 'reject' ? 'rejecting' : 'overriding'} a request.`
      }, { status: 400 });
    }

    const sb = getAdminSupabase();

    // 1. Fetch existing request with order and item details
    const { data: requestRecord, error: fetchErr } = await sb
      .from('return_requests')
      .select(`
        *,
        orders:order_id (*),
        order_items:order_item_id (*),
        products:product_id (*)
      `)
      .eq('id', targetRequestId)
      .maybeSingle();

    if (fetchErr || !requestRecord) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const isCustomer = auth.userId === requestRecord.user_id && !auth.isAdmin && auth.role !== 'seller';
    if (isCustomer) {
      return NextResponse.json({ error: 'Forbidden: Customers cannot process or approve requests' }, { status: 403 });
    }

    // 2. Role-based Isolation Check
    if (auth.isAdmin) {
      // Admin has global oversight and override authority across all products
    } else if (auth.role === 'seller') {
      const { data: store } = await sb
        .from('sellers')
        .select('id')
        .eq('user_id', auth.userId)
        .maybeSingle();

      const sellerId = store?.id;

      const ownsSellerRequest =
        (sellerId && requestRecord.seller_id === sellerId) ||
        (requestRecord.products?.seller_id === sellerId) ||
        (requestRecord.products?.created_by === auth.userId);

      if (!ownsSellerRequest) {
        return NextResponse.json({
          error: 'Forbidden: Sellers can only review and manage requests for their own products'
        }, { status: 403 });
      }

      // Sellers can approve, reject, and track return fulfillment steps
      const allowedSellerActions = ['approve', 'reject', 'return_in_progress', 'item_received', 'inspection_completed'];
      if (!allowedSellerActions.includes(action)) {
        return NextResponse.json({
          error: `Sellers cannot perform administrative action '${action}'`
        }, { status: 403 });
      }
    }

    // 3. Process actions
    const actorRole = auth.isAdmin ? 'admin' : 'seller';
    const currentHistory = Array.isArray(requestRecord.history) ? requestRecord.history : [];
    let updatedStatus = requestRecord.status;
    let updatedSellerStatus = requestRecord.seller_status || 'pending';
    let isFinalizedCancellation = false;

    if (action === 'approve') {
      if (auth.role === 'seller' && !auth.isAdmin) {
        updatedSellerStatus = 'approved';
        // If seller approves, advance request status
        updatedStatus = 'approved';
      } else {
        // Admin approve
        updatedStatus = 'approved';
      }

      // If it is a cancellation request, atomically cancel item and restore stock
      if (requestRecord.request_type === 'cancellation' && requestRecord.order_item_id) {
        const { data: cancelResult, error: cancelErr } = await sb.rpc('cancel_order_item_atomic', {
          p_order_item_id: requestRecord.order_item_id,
          p_actor_id: auth.userId,
          p_reason: finalReason || `${actorRole === 'admin' ? 'Admin' : 'Seller'} approved cancellation`,
          p_request_id: targetRequestId,
        });

        if (cancelErr || !cancelResult?.success) {
          const errMsg = cancelErr?.message || cancelResult?.message || 'Failed to cancel order item';
          return NextResponse.json({ error: errMsg }, { status: 400 });
        }

        isFinalizedCancellation = true;
      }
    } else if (action === 'reject') {
      if (auth.role === 'seller' && !auth.isAdmin) {
        updatedSellerStatus = 'rejected';
        updatedStatus = 'rejected';
      } else {
        updatedStatus = 'rejected';
      }
    } else if (action === 'override') {
      // Admin overrides seller decision
      updatedStatus = 'under_review';
    } else if (action === 'refunded') {
      // 4. Safe Online Refund Verification (Section 7)
      const order = requestRecord.orders;
      const refundTargetAmount = refundAmount || Number(requestRecord.refund_amount) || Number(order?.total_amount) || 0;

      if (order?.payment_method?.toLowerCase() === 'razorpay' && order?.payment_status === 'paid' && order?.razorpay_payment_id) {
        // Verified payment-provider refund
        const refundResult = await createRazorpayRefund(
          order.razorpay_payment_id,
          refundTargetAmount,
          {
            requestId: targetRequestId,
            orderId: order.id,
            adminId: auth.userId,
            reason: finalReason || 'Return refund approved',
          }
        );

        if (!refundResult.success) {
          return NextResponse.json({
            error: `Payment provider refund failed: ${refundResult.error}. Refund status has NOT been updated.`
          }, { status: 400 });
        }
      }

      updatedStatus = 'refunded';
    } else {
      // Operational return statuses ('return_in_progress', 'item_received', 'inspection_completed', 'refund_pending')
      updatedStatus = action;
    }

    const newHistoryEntry = {
      action,
      actor_id: auth.userId,
      actor_type: actorRole,
      timestamp: new Date().toISOString(),
      notes: finalReason || null,
      status_after: updatedStatus,
    };

    // 5. Update database record
    const updatePayload: any = {
      status: updatedStatus,
      seller_status: updatedSellerStatus,
      updated_at: new Date().toISOString(),
      history: [...currentHistory, newHistoryEntry],
    };

    if (action === 'reject') {
      updatePayload.rejection_reason = finalReason;
      updatePayload.resolved_at = new Date().toISOString();
    } else if (action === 'approve') {
      updatePayload.resolved_at = new Date().toISOString();
      if (auth.isAdmin) updatePayload.admin_notes = finalReason || null;
      if (auth.role === 'seller') updatePayload.seller_notes = finalReason || null;
    } else if (action === 'refunded') {
      updatePayload.refund_amount = refundAmount || requestRecord.refund_amount;
    }

    if (auth.isAdmin && adminNotes) {
      updatePayload.admin_notes = adminNotes;
    }
    if (auth.role === 'seller' && finalReason) {
      updatePayload.seller_notes = finalReason;
    }

    const { error: updateErr } = await sb
      .from('return_requests')
      .update(updatePayload)
      .eq('id', targetRequestId);

    if (updateErr) {
      console.error('[Returns PUT] Update error:', updateErr.message);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 6. Notify Customer
    if (requestRecord.user_id) {
      try {
        const orderNumber = requestRecord.orders?.order_number || requestRecord.order_id?.slice(0, 8);
        const actionLabels: Record<string, string> = {
          approve: 'Your request has been APPROVED',
          reject: `Your request was REJECTED: ${finalReason}`,
          return_in_progress: 'Your return is now IN PROGRESS — please keep item packaged',
          item_received: 'Your returned item has been RECEIVED at our hub',
          inspection_completed: 'Inspection COMPLETED for returned item',
          refund_pending: 'Refund has been INITIATED and is being processed',
          refunded: 'Refund has been COMPLETED successfully',
        };

        await sb.from('notifications').insert({
          user_id: requestRecord.user_id,
          title: `Update on Order #${orderNumber} ${requestRecord.request_type === 'cancellation' ? 'Cancellation' : 'Return'}`,
          message: actionLabels[action] || `Your request status changed to ${updatedStatus}.`,
          type: 'order_status',
        });
      } catch (e) {}
    }

    await writeAuditLog({
      adminId: auth.userId,
      action: `request.${requestRecord.request_type}.${action}`,
      resourceType: 'return_request',
      resourceId: targetRequestId,
      details: {
        previousStatus: requestRecord.status,
        newStatus: updatedStatus,
        sellerStatus: updatedSellerStatus,
        reason: finalReason,
        actorRole,
        isFinalizedCancellation,
      },
      ipAddress: getClientIP(request),
    });

    return NextResponse.json({
      success: true,
      status: updatedStatus,
      sellerStatus: updatedSellerStatus,
      message: `Request successfully updated to '${updatedStatus}'.`,
    });
  } catch (error: any) {
    console.error('[Returns PUT] Error:', error.message);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
