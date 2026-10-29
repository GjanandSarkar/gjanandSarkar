import { NextRequest, NextResponse } from 'next/server';
import { requireCustomer } from '@/lib/api/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { windowHours } from '@/lib/orders/policy';
import { notify } from '@/lib/notify';

export async function POST(req: NextRequest) {
  const auth = await requireCustomer(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({}));
  const { orderItemId, requestType, reason, description, images = [], pickupAddressId } = body;

  if (!orderItemId || !requestType || !reason) {
    return NextResponse.json({ error: 'orderItemId, requestType, and reason are required' }, { status: 400 });
  }

  if (!['return', 'replacement'].includes(requestType)) {
    return NextResponse.json({ error: 'requestType must be return or replacement' }, { status: 400 });
  }

  // 1. Load order item + parent order
  const { data: item, error: itemError } = await supabaseAdmin
    .from('order_items')
    .select('*, orders(*)')
    .eq('id', orderItemId)
    .single();

  if (itemError || !item) {
    return NextResponse.json({ error: 'Order item not found' }, { status: 404 });
  }

  const order = item.orders;
  if (!order || (order.user_id !== auth.user.id && auth.user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized to request return for this item' }, { status: 403 });
  }

  // 2. Order must be delivered and item must have delivered_at
  if (order.status !== 'delivered' || !item.delivered_at) {
    return NextResponse.json(
      { error: 'Returns and replacements are only allowed after order has been delivered' },
      { status: 400 }
    );
  }

  // 3. Load product category and seller
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('id, category, seller_id')
    .eq('id', item.product_id)
    .single();

  const category = product?.category ?? 'Other';
  const sellerId = product?.seller_id ?? item.seller_id ?? null;

  // 4. Policy window validation
  const { data: settings } = await supabaseAdmin.from('business_settings').select('*').limit(1).single();
  const policy = settings || {
    freshness_guarantee_hours: 24,
    return_window_hours: 168,
    replacement_window_hours: 168,
  };

  const hoursSince = (Date.now() - new Date(item.delivered_at).getTime()) / 36e5;
  const allowedHours = windowHours(category, requestType, policy);
  if (hoursSince > allowedHours) {
    return NextResponse.json(
      { error: `The ${requestType} period for this ${category} item has expired (${allowedHours} hours policy)` },
      { status: 409 }
    );
  }

  // 5. Image requirement for quality / damage / spoiling reasons
  const lowerReason = (reason || '').toLowerCase();
  const requiresImage =
    lowerReason.includes('defect') ||
    lowerReason.includes('spoil') ||
    lowerReason.includes('damage') ||
    lowerReason.includes('sour') ||
    lowerReason.includes('wrong');

  if (requiresImage && (!images || images.length === 0)) {
    return NextResponse.json(
      { error: 'Photo evidence is required for damaged, spoiled, or defective item requests' },
      { status: 400 }
    );
  }

  // 6. If replacement, check variant inventory stock availability
  if (requestType === 'replacement') {
    if (item.variant_id) {
      const { data: variant } = await supabaseAdmin
        .from('product_variants')
        .select('stock, available_quantity')
        .eq('id', item.variant_id)
        .single();

      if (!variant || variant.available_quantity < item.quantity || variant.stock < item.quantity) {
        return NextResponse.json(
          {
            error:
              'Replacement is currently out of stock for this variant. Please select Return for a full refund.',
          },
          { status: 400 }
        );
      }
    }
  }

  // 7. Calculate prorated refund amount for returns
  let refundAmount = 0;
  if (requestType === 'return') {
    const itemQty = Number(item.quantity) || 1;
    const unitPrice = Number(item.price ?? item.unit_price ?? 0) || 0;
    const rawTotal = Number(item.total_price) || (unitPrice * itemQty) || 0;
    const itemTotal = isNaN(rawTotal) || rawTotal < 0 ? 0 : rawTotal;

    const subtotal = Number(order?.subtotal || order?.total_amount || itemTotal) || 0;
    const discount = Number(order?.discount_amount || 0) || 0;
    const proratedDiscount = (subtotal > 0 && discount > 0)
      ? (discount * itemTotal) / subtotal
      : 0;

    const netRefund = itemTotal - (isNaN(proratedDiscount) ? 0 : proratedDiscount);
    refundAmount = isNaN(netRefund) ? 0 : Math.max(0, Math.round(netRefund * 100) / 100);
  }

  // 8. Insert return request (unique index uq_active_request_per_item prevents duplicates)
  const { data: requestRow, error: insertError } = await supabaseAdmin
    .from('return_requests')
    .insert({
      order_id: item.order_id,
      order_item_id: item.id,
      user_id: auth.user.id,
      product_id: item.product_id,
      seller_id: sellerId,
      request_type: requestType,
      reason,
      description: description || null,
      images: images || [],
      status: 'initiated',
      seller_status: 'auto_approved',
      refund_amount: Number(refundAmount) || 0,
      pickup_address_id: pickupAddressId || null,
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json(
        { error: 'An active return or replacement request is already in progress for this item' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  // 9. Insert status event
  await supabaseAdmin.from('status_events').insert({
    entity_type: requestType,
    entity_id: requestRow.id,
    from_status: null,
    to_status: 'initiated',
    actor_role: 'customer',
    actor_id: auth.user.id,
    note: reason,
  });

  // 10. Dispatch notifications
  await notify(
    ['customer', 'seller', 'admin'],
    `${requestType}_initiated`,
    requestRow.id,
    auth.user.id,
    sellerId
  );

  return NextResponse.json({ ok: true, request: requestRow });
}

export async function GET(req: NextRequest) {
  const auth = await requireCustomer(req);
  if (!auth.ok) return auth.response;

  const { data: requests, error } = await supabaseAdmin
    .from('return_requests')
    .select(`
      *,
      order_items (
        id, product_name, variant_weight, quantity, price, status, delivered_at,
        products (id, name, image_url)
      ),
      orders (
        id, order_number, created_at, payment_method, status
      )
    `)
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, requests: requests ?? [] });
}
