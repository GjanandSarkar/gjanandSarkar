import { supabaseAdmin } from './db';

export interface PricingResult {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  totalCost: number;
  profitMargin: number;
  isProfitSafe: boolean;
  message?: string;
  nextTierAmount?: number; // For "Add ₹X more for free delivery"
}

export interface CouponData {
  id: string;
  code: string;
  type: 'flat' | 'percentage';
  value: number;
  min_order_value: number;
  max_discount: number | null;
  is_active: boolean;
  expiry_date: string | null;
}

export interface BusinessSettings {
  min_profit_margin_percent: number;
  free_delivery_threshold: number;
  delivery_cost: number;
  max_discount_percent: number;
}

export async function calculateOrderPricing(
  items: { variantId: string; quantity: number }[],
  couponCode?: string
): Promise<PricingResult> {
  // 1. Fetch Settings
  const { data: settingsData } = await supabaseAdmin
    .from('business_settings')
    .select('*')
    .single();
  
  const settings: BusinessSettings = settingsData || {
    min_profit_margin_percent: 20,
    free_delivery_threshold: 299,
    delivery_cost: 25,
    max_discount_percent: 30
  };

  // 2. Fetch Variant Details (including cost_price)
  const variantIds = items.map(i => i.variantId);
  const { data: variants } = await supabaseAdmin
    .from('product_variants')
    .select('id, price, cost_price')
    .in('id', variantIds);

  if (!variants || variants.length === 0) {
    throw new Error("Missing variant data");
  }

  // 3. Calculate Base Values
  let subtotal = 0;
  let totalCost = 0;
  let blockedProduct = false;

  items.forEach(item => {
    const v = variants.find(v => v.id === item.variantId);
    if (v) {
      if (v.cost_price <= 0) blockedProduct = true;
      subtotal += parseFloat(v.price) * item.quantity;
      totalCost += parseFloat(v.cost_price) * item.quantity;
    }
  });

  if (blockedProduct) {
    return {
      subtotal, deliveryFee: 0, discount: 0, total: subtotal, totalCost,
      profitMargin: 0, isProfitSafe: false, 
      message: "One or more products are currently unavailable due to pricing updates."
    };
  }

  // 4. Delivery Fee Logic
  const deliveryFee = subtotal >= settings.free_delivery_threshold ? 0 : settings.delivery_cost;
  const nextTierAmount = subtotal < settings.free_delivery_threshold ? settings.free_delivery_threshold - subtotal : 0;

  // 5. Coupon Logic
  let discount = 0;
  if (couponCode) {
    const { data: coupon } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (coupon) {
      const now = new Date();
      const expiry = coupon.expiry_date ? new Date(coupon.expiry_date) : null;
      
      if (!expiry || expiry > now) {
        if (subtotal >= coupon.min_order_value) {
          if (coupon.type === 'percentage') {
            discount = (subtotal * parseFloat(coupon.value)) / 100;
            if (coupon.max_discount) {
              discount = Math.min(discount, parseFloat(coupon.max_discount));
            }
          } else {
            discount = parseFloat(coupon.value);
          }
        }
      }
    }
  }

  // 6. Enforce Profit Margin
  // Rule: total_selling - discount >= total_cost * (1 + margin)
  const minRequiredRevenue = totalCost * (1 + settings.min_profit_margin_percent / 100);
  const currentRevenue = subtotal - discount;

  let isProfitSafe = true;
  let adjustedDiscount = discount;

  if (currentRevenue < minRequiredRevenue) {
    // Reduce discount if it violates profit margin
    adjustedDiscount = Math.max(0, subtotal - minRequiredRevenue);
    // If even with 0 discount we are below cost, it's unsafe (someone set a bad selling price)
    if (subtotal < minRequiredRevenue) {
      isProfitSafe = false;
    }
  }

  const finalTotal = subtotal + deliveryFee - adjustedDiscount;
  const profitMargin = finalTotal - deliveryFee - totalCost;

  return {
    subtotal,
    deliveryFee,
    discount: adjustedDiscount,
    total: finalTotal,
    totalCost,
    profitMargin,
    isProfitSafe,
    nextTierAmount,
    message: !isProfitSafe ? "Pricing error: Product prices are set incorrectly." : undefined
  };
}
