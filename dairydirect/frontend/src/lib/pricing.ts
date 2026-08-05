/**
 * Order Pricing Engine — AWS PostgreSQL Version
 * Replaces Supabase-based pricing with direct pg queries.
 * Handles: subtotal, delivery fee, coupons, profit margin validation.
 */

import { query } from '@/lib/aws/rds';

export interface PricingResult {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  totalCost: number;
  profitMargin: number;
  isProfitSafe: boolean;
  message?: string;
  nextTierAmount?: number;
  couponApplied: boolean;
}

export interface BusinessSettings {
  min_profit_margin_percent: number;
  free_delivery_threshold: number;
  delivery_cost: number;
  max_discount_percent: number;
}

const DEFAULT_SETTINGS: BusinessSettings = {
  min_profit_margin_percent: 20,
  free_delivery_threshold: 299,
  delivery_cost: 25,
  max_discount_percent: 30,
};

/**
 * Calculate complete order pricing with:
 * - Variant price lookup from DB
 * - Delivery fee logic (free above threshold)
 * - Coupon validation and discount
 * - Profit margin enforcement
 * All using parameterized queries (SQL injection safe)
 */
export async function calculateOrderPricing(
  items: { variantId: string; quantity: number }[],
  couponCode?: string
): Promise<PricingResult> {
  // 1. Fetch Business Settings
  const settingsResult = await query<BusinessSettings>(
    'SELECT min_profit_margin_percent, free_delivery_threshold, delivery_cost, max_discount_percent FROM business_settings LIMIT 1'
  );
  const settings: BusinessSettings = settingsResult.rows[0] ?? DEFAULT_SETTINGS;

  // 2. Fetch Variant Prices (parameterized — SQL injection safe)
  const variantIds = items.map((i) => i.variantId);
  const variantResult = await query<{
    id: string;
    price: string;
    cost_price: string;
    is_available: boolean;
    stock: number;
  }>(
    `SELECT id, price, cost_price, is_available, stock
     FROM product_variants
     WHERE id = ANY($1::uuid[])`,
    [variantIds]
  );

  if (variantResult.rows.length === 0) {
    throw new Error('No valid variants found for pricing');
  }

  // 3. Calculate Subtotal & Cost
  let subtotal = 0;
  let totalCost = 0;
  let hasUnavailableItem = false;

  for (const item of items) {
    const variant = variantResult.rows.find((v) => v.id === item.variantId);
    if (!variant) {
      throw new Error(`Variant ${item.variantId} not found`);
    }
    if (!variant.is_available || variant.stock < item.quantity) {
      hasUnavailableItem = true;
    }

    const price = parseFloat(variant.price);
    const cost = parseFloat(variant.cost_price);

    if (cost <= 0) {
      return {
        subtotal: 0, deliveryFee: 0, discount: 0, total: 0, totalCost: 0,
        profitMargin: 0, isProfitSafe: false, couponApplied: false,
        message: 'One or more products have invalid pricing. Please contact support.',
      };
    }

    subtotal += price * item.quantity;
    totalCost += cost * item.quantity;
  }

  if (hasUnavailableItem) {
    return {
      subtotal, deliveryFee: 0, discount: 0, total: subtotal, totalCost,
      profitMargin: 0, isProfitSafe: false, couponApplied: false,
      message: 'Some items are out of stock or unavailable. Please update your cart.',
    };
  }

  // 4. Delivery Fee
  const freeThreshold = parseFloat(settings.free_delivery_threshold as any);
  const deliveryCost = parseFloat(settings.delivery_cost as any);
  const deliveryFee = subtotal >= freeThreshold ? 0 : deliveryCost;
  const nextTierAmount = subtotal < freeThreshold ? freeThreshold - subtotal : 0;

  // 5. Coupon Validation
  let discount = 0;
  let couponApplied = false;

  if (couponCode && couponCode.trim()) {
    const couponResult = await query<{
      id: string;
      type: string;
      value: string;
      min_order_value: string;
      max_discount: string | null;
      max_uses: number | null;
      used_count: number;
      is_active: boolean;
      expiry_date: string | null;
    }>(
      `SELECT id, type, value, min_order_value, max_discount, max_uses, used_count, is_active, expiry_date
       FROM coupons
       WHERE code = upper($1) AND is_active = true`,
      [couponCode.trim()]
    );

    if (couponResult.rows.length > 0) {
      const coupon = couponResult.rows[0];
      const now = new Date();
      const expiry = coupon.expiry_date ? new Date(coupon.expiry_date) : null;
      const minOrder = parseFloat(coupon.min_order_value);

      const isExpired = expiry && expiry < now;
      const isMaxUsed = coupon.max_uses !== null && coupon.used_count >= coupon.max_uses;
      const meetsMinOrder = subtotal >= minOrder;

      if (!isExpired && !isMaxUsed && meetsMinOrder) {
        const couponValue = parseFloat(coupon.value);
        if (coupon.type === 'percentage') {
          discount = (subtotal * couponValue) / 100;
          if (coupon.max_discount) {
            discount = Math.min(discount, parseFloat(coupon.max_discount));
          }
        } else {
          discount = couponValue;
        }
        couponApplied = true;
      }
    }
  }

  // 6. Profit Margin Enforcement
  const minMargin = parseFloat(settings.min_profit_margin_percent as any);
  const minRequiredRevenue = totalCost * (1 + minMargin / 100);
  const currentRevenue = subtotal - discount;

  let isProfitSafe = true;
  let adjustedDiscount = discount;

  if (currentRevenue < minRequiredRevenue) {
    adjustedDiscount = Math.max(0, subtotal - minRequiredRevenue);
    if (subtotal < minRequiredRevenue) {
      isProfitSafe = false;
    }
    if (couponApplied) {
      couponApplied = false; // Coupon was too aggressive
    }
  }

  const finalTotal = subtotal + deliveryFee - adjustedDiscount;
  const profitMargin = finalTotal - deliveryFee - totalCost;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    deliveryFee: Math.round(deliveryFee * 100) / 100,
    discount: Math.round(adjustedDiscount * 100) / 100,
    total: Math.round(finalTotal * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    profitMargin: Math.round(profitMargin * 100) / 100,
    isProfitSafe,
    couponApplied,
    nextTierAmount: Math.round(nextTierAmount * 100) / 100,
    message: !isProfitSafe
      ? 'Pricing configuration error. Please contact support.'
      : undefined,
  };
}

/**
 * Deduct stock atomically using SELECT FOR UPDATE to prevent overselling.
 * Must be called inside a transaction.
 */
export async function deductStockInTransaction(
  client: import('pg').PoolClient,
  items: { variantId: string; quantity: number }[]
): Promise<{ success: boolean; error?: string }> {
  for (const item of items) {
    // Lock the row and check stock atomically
    const stockResult = await client.query<{ stock: number }>(
      'SELECT stock FROM product_variants WHERE id = $1 FOR UPDATE',
      [item.variantId]
    );

    if (stockResult.rows.length === 0) {
      return { success: false, error: `Variant ${item.variantId} not found` };
    }

    const currentStock = stockResult.rows[0].stock;
    if (currentStock < item.quantity) {
      return {
        success: false,
        error: `Insufficient stock. Only ${currentStock} available.`,
      };
    }

    await client.query(
      'UPDATE product_variants SET stock = stock - $1 WHERE id = $2',
      [item.quantity, item.variantId]
    );
  }

  return { success: true };
}
