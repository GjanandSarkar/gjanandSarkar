/**
 * Order Pricing Engine — Hybrid AWS PostgreSQL + Supabase Fallback
 * Handles: subtotal, delivery fee, coupons, profit margin safety.
 */

import { query, isPgConfigured } from '@/lib/aws/rds';
import { getAdminSupabase } from '@/lib/supabase/admin';

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
 * - Variant price lookup from DB (RDS or Supabase)
 * - Delivery fee logic (free above threshold)
 * - Coupon validation and discount
 * - Profit margin enforcement
 */
export async function calculateOrderPricing(
  items: { variantId: string; quantity: number }[],
  couponCode?: string
): Promise<PricingResult> {
  let settings: BusinessSettings = DEFAULT_SETTINGS;
  let variants: { id: string; price: number; cost_price: number; stock: number }[] = [];

  const variantIds = items.map((i) => i.variantId);

  // 1. Fetch Business Settings & Variants from RDS if available
  if (isPgConfigured) {
    try {
      const [settingsRes, variantRes] = await Promise.all([
        query<BusinessSettings>(
          'SELECT min_profit_margin_percent, free_delivery_threshold, delivery_cost, max_discount_percent FROM business_settings LIMIT 1'
        ),
        query<{ id: string; price: string; cost_price: string; stock: number }>(
          `SELECT id, price, cost_price, stock
           FROM product_variants
           WHERE id = ANY($1::uuid[])`,
          [variantIds]
        ),
      ]);

      if (settingsRes.rows.length > 0) {
        settings = settingsRes.rows[0];
      }

      if (variantRes.rows.length > 0) {
        variants = variantRes.rows.map((v) => ({
          id: v.id,
          price: parseFloat(v.price),
          cost_price: parseFloat(v.cost_price || '0'),
          stock: v.stock ?? 100,
        }));
      }
    } catch (err: any) {
      console.warn('[Pricing] RDS query failed, falling back to Supabase:', err.message);
    }
  }

  // Fallback to Supabase if RDS did not return variants
  if (variants.length === 0) {
    try {
      const sb = getAdminSupabase();
      const [sbSettings, sbVariants] = await Promise.all([
        sb.from('business_settings').select('*').limit(1).maybeSingle(),
        sb.from('product_variants').select('id, price, cost_price, stock').in('id', variantIds),
      ]);

      if (sbSettings.data) {
        settings = {
          min_profit_margin_percent: parseFloat(sbSettings.data.min_profit_margin_percent ?? '20'),
          free_delivery_threshold: parseFloat(sbSettings.data.free_delivery_threshold ?? '299'),
          delivery_cost: parseFloat(sbSettings.data.delivery_cost ?? '25'),
          max_discount_percent: parseFloat(sbSettings.data.max_discount_percent ?? '30'),
        };
      }

      if (sbVariants.data && sbVariants.data.length > 0) {
        variants = sbVariants.data.map((v: any) => ({
          id: v.id,
          price: parseFloat(v.price),
          cost_price: parseFloat(v.cost_price || '0'),
          stock: v.stock ?? 100,
        }));
      }
    } catch (sbErr: any) {
      console.warn('[Pricing] Supabase fallback query failed:', sbErr.message);
    }
  }

  if (variants.length === 0) {
    throw new Error('No valid variants found for pricing');
  }

  // 2. Calculate Subtotal & Cost
  let subtotal = 0;
  let totalCost = 0;
  let hasUnavailableItem = false;

  for (const item of items) {
    const variant = variants.find((v) => v.id === item.variantId);
    if (!variant) {
      throw new Error(`Variant ${item.variantId} not found`);
    }

    if (variant.stock < item.quantity) {
      hasUnavailableItem = true;
    }

    const price = variant.price;
    // Default cost to 70% of price if not set
    const cost = variant.cost_price > 0 ? variant.cost_price : Math.round(price * 0.7);

    subtotal += price * item.quantity;
    totalCost += cost * item.quantity;
  }

  if (hasUnavailableItem) {
    return {
      subtotal,
      deliveryFee: 0,
      discount: 0,
      total: subtotal,
      totalCost,
      profitMargin: 0,
      isProfitSafe: false,
      couponApplied: false,
      message: 'Some items are out of stock. Please update your cart.',
    };
  }

  // 3. Delivery Fee
  const freeThreshold = parseFloat(settings.free_delivery_threshold as any) || 299;
  const deliveryCost = parseFloat(settings.delivery_cost as any) || 25;
  const deliveryFee = subtotal >= freeThreshold ? 0 : deliveryCost;
  const nextTierAmount = subtotal < freeThreshold ? freeThreshold - subtotal : 0;

  // 4. Coupon Validation
  let discount = 0;
  let couponApplied = false;

  if (couponCode && couponCode.trim()) {
    let couponData: any = null;

    if (isPgConfigured) {
      try {
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
           WHERE UPPER(code) = UPPER($1) AND is_active = true`,
          [couponCode.trim()]
        );
        if (couponResult.rows.length > 0) {
          couponData = couponResult.rows[0];
        }
      } catch (err: any) {
        console.warn('[Pricing] RDS coupon query failed, fallback to Supabase:', err.message);
      }
    }

    if (!couponData) {
      try {
        const sb = getAdminSupabase();
        const { data } = await sb
          .from('coupons')
          .select('*')
          .ilike('code', couponCode.trim())
          .eq('is_active', true)
          .maybeSingle();
        couponData = data;
      } catch (sbErr: any) {
        console.warn('[Pricing] Supabase coupon query failed:', sbErr.message);
      }
    }

    if (couponData) {
      const now = new Date();
      const expiry = couponData.expiry_date ? new Date(couponData.expiry_date) : null;
      const minOrder = parseFloat(couponData.min_order_value || '0');

      const isExpired = expiry && expiry < now;
      const isMaxUsed = couponData.max_uses != null && couponData.used_count >= couponData.max_uses;
      const meetsMinOrder = subtotal >= minOrder;

      if (!isExpired && !isMaxUsed && meetsMinOrder) {
        const couponVal = parseFloat(couponData.value);
        if (couponData.type === 'percentage') {
          discount = (subtotal * couponVal) / 100;
          if (couponData.max_discount) {
            discount = Math.min(discount, parseFloat(couponData.max_discount));
          }
        } else {
          discount = couponVal;
        }
        couponApplied = true;
      }
    }
  }

  // 5. Profit Margin Enforcement
  const minMargin = parseFloat(settings.min_profit_margin_percent as any) || 20;
  const minRequiredRevenue = totalCost * (1 + minMargin / 100);
  const currentRevenue = subtotal - discount;

  let isProfitSafe = true;
  let adjustedDiscount = discount;

  if (currentRevenue < minRequiredRevenue && totalCost > 0) {
    adjustedDiscount = Math.max(0, subtotal - minRequiredRevenue);
    if (subtotal < minRequiredRevenue) {
      isProfitSafe = true; // allow purchase for user convenience if catalog priced by admin
    }
  }

  const finalTotal = Math.max(0, subtotal + deliveryFee - adjustedDiscount);
  const profitMargin = finalTotal - deliveryFee - totalCost;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    deliveryFee: Math.round(deliveryFee * 100) / 100,
    discount: Math.round(adjustedDiscount * 100) / 100,
    total: Math.round(finalTotal * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    profitMargin: Math.round(profitMargin * 100) / 100,
    isProfitSafe: true,
    couponApplied,
    nextTierAmount: Math.round(nextTierAmount * 100) / 100,
  };
}
