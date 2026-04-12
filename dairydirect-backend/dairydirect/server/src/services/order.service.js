// src/services/order.service.js — Order Business Logic

import { supabase, cc, dbError } from '../utils/supabase.js';
import { ApiError } from '../utils/ApiError.js';

// ─── Order State Machine ──────────────────────────────────
const VALID_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

const ORDER_DETAIL_SELECT = `
  id, type, status, total_amount, payment_mode, payment_status,
  delivered_at, notes, created_at, updated_at,
  addresses!address_id(label, street, area, city, pincode),
  order_items(
    id, quantity, unit_price, subtotal,
    products!product_id(id, name, category, image_url),
    product_variants!variant_id(id, label)
  ),
  quality_reports!order_id(id, issue_type, status, created_at)
`;

/**
 * Create a new one-time order from cart items.
 * Note: stock decrement is sequential (no DB transaction for trial project).
 */
export const createOrder = async (userId, { addressId, paymentMode, items, notes }) => {
  // 1. Verify address belongs to user
  const { data: address, error: addrErr } = await supabase
    .from('addresses')
    .select('id')
    .eq('id', addressId)
    .eq('user_id', userId)
    .single();

  if (addrErr || !address) throw new ApiError(404, 'Address not found or does not belong to you');

  // 2. Fetch all variants in one query
  const variantIds = items.map((i) => i.variantId);

  const { data: variants, error: varErr } = await supabase
    .from('product_variants')
    .select('id, label, price, stock, is_active, product_id, products!product_id(id, name, is_active)')
    .in('id', variantIds)
    .eq('is_active', true);

  dbError(varErr, 'Failed to fetch variants');

  if (!variants || variants.length !== variantIds.length) {
    throw new ApiError(400, 'One or more product variants are invalid or no longer available');
  }

  // 3. Validate products and build order item data
  const orderItems = [];
  let totalAmount = 0;

  for (const item of items) {
    const variant = variants.find((v) => v.id === item.variantId);
    const product = variant.products;

    if (!product.is_active) {
      throw new ApiError(400, `Product "${product.name}" is no longer available`);
    }

    if (variant.stock < item.quantity) {
      throw new ApiError(
        409,
        `Insufficient stock for ${product.name} (${variant.label}). Available: ${variant.stock}`
      );
    }

    const unitPrice = parseFloat(variant.price);
    const subtotal = unitPrice * item.quantity;
    totalAmount += subtotal;

    orderItems.push({
      product_id: product.id,
      variant_id: variant.id,
      quantity: item.quantity,
      unit_price: unitPrice,
      subtotal,
    });
  }

  // 4. Decrement stock for each variant
  for (const item of orderItems) {
    const variant = variants.find((v) => v.id === item.variant_id);
    const { error: stockErr } = await supabase
      .from('product_variants')
      .update({ stock: variant.stock - item.quantity })
      .eq('id', item.variant_id)
      .gte('stock', item.quantity); // guard: only update if still sufficient

    if (stockErr) {
      throw new ApiError(409, `Stock update failed for variant ${item.variant_id}`);
    }
  }

  // 5. Create the order
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      address_id: addressId,
      type: 'SINGLE',
      status: 'PENDING',
      total_amount: totalAmount,
      payment_mode: paymentMode || 'MOCK',
      payment_status: paymentMode === 'MOCK' ? 'PAID' : 'PENDING',
      notes: notes || null,
    })
    .select('id')
    .single();

  dbError(orderErr, 'Failed to create order');

  // 6. Create order items
  const itemRows = orderItems.map((i) => ({ ...i, order_id: order.id }));
  const { error: itemErr } = await supabase.from('order_items').insert(itemRows);
  dbError(itemErr, 'Failed to create order items');

  // Return full order detail
  return getOrderById(userId, order.id);
};

/**
 * Get current user's orders
 */
export const getMyOrders = async (userId, { page = 1, limit = 20, status } = {}) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);

  let query = supabase
    .from('orders')
    .select(`
      id, type, status, total_amount, payment_mode, created_at,
      order_items(
        quantity,
        products!product_id(name, image_url),
        product_variants!variant_id(label)
      )
    `, { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(skip, skip + parseInt(limit) - 1);

  if (status) query = query.eq('status', status);

  const { data: orders, error, count } = await query;
  dbError(error, 'Failed to fetch orders');

  // Limit preview items to 3
  const trimmed = (orders || []).map((o) => ({
    ...o,
    order_items: (o.order_items || []).slice(0, 3),
  }));

  return {
    orders: cc(trimmed),
    total: count || 0,
    page: parseInt(page),
    limit: parseInt(limit),
  };
};

/**
 * Get single order detail (ownership enforced)
 */
export const getOrderById = async (userId, orderId, isAdmin = false) => {
  let query = supabase
    .from('orders')
    .select(
      isAdmin
        ? ORDER_DETAIL_SELECT + ', users!user_id(id, name, phone), subscriptions!subscription_id(id, frequency, quantity)'
        : ORDER_DETAIL_SELECT + ', subscriptions!subscription_id(id, frequency, quantity)'
    )
    .eq('id', orderId);

  if (!isAdmin) query = query.eq('user_id', userId);

  const { data: order, error } = await query.single();

  if (error || !order) throw new ApiError(404, 'Order not found');
  return cc(order);
};

/**
 * Admin: Update order status with state machine validation
 */
export const updateOrderStatus = async (orderId, newStatus) => {
  const { data: order, error: findErr } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .single();

  if (findErr || !order) throw new ApiError(404, 'Order not found');

  const allowed = VALID_TRANSITIONS[order.status];
  if (!allowed.includes(newStatus)) {
    throw new ApiError(
      400,
      `Invalid transition: ${order.status} → ${newStatus}. Allowed: ${allowed.join(', ') || 'none (terminal state)'}`
    );
  }

  const updateData = { status: newStatus };
  if (newStatus === 'DELIVERED') updateData.delivered_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select('id, status, delivered_at, updated_at')
    .single();

  dbError(error, 'Failed to update order status');
  return cc(updated);
};
