import { settingsRepository } from '../repositories/settingsRepository';
import { couponRepository } from '../repositories/couponRepository';
import { ValidationError } from '../errors/AppError';

export interface PricingCalculationResult {
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  loyaltyEarned: number;
  couponApplied?: {
    code: string;
    type: 'percentage' | 'flat';
    value: number;
    discount: number;
  };
}

export const pricingService = {
  /**
   * Calculate totals with profit-guard protection & settings
   */
  async calculateOrderTotals(params: {
    items: Array<{ price: number; costPrice?: number; quantity: number }>;
    couponCode?: string;
  }): Promise<PricingCalculationResult> {
    const settings = await settingsRepository.getSettings();

    const subtotal = params.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalCost = params.items.reduce(
      (sum, item) => sum + (item.costPrice || 0) * item.quantity,
      0
    );

    // Free delivery threshold
    const deliveryFee =
      subtotal >= settings.free_delivery_threshold ? 0 : settings.standard_delivery_fee;

    let discountAmount = 0;
    let couponApplied: PricingCalculationResult['couponApplied'];

    if (params.couponCode && params.couponCode.trim()) {
      const coupon = await couponRepository.findByCode(params.couponCode.trim());
      if (coupon) {
        if (subtotal < coupon.min_order_value) {
          throw new ValidationError(
            `Minimum order value of ₹${coupon.min_order_value} required for coupon ${coupon.code}`
          );
        }

        if (coupon.type === 'flat') {
          discountAmount = coupon.value;
        } else {
          discountAmount = Math.round((subtotal * coupon.value) / 100 * 100) / 100;
          if (coupon.max_discount) {
            discountAmount = Math.min(discountAmount, coupon.max_discount);
          }
        }

        // Profit-margin safeguard: Ensure revenue after discount preserves minimum profit margin
        if (totalCost > 0) {
          const minMarginPercent = settings.min_profit_margin_percent || 15;
          const minAllowedRevenue = totalCost * (1 + minMarginPercent / 100);
          const maxAllowedDiscount = Math.max(0, subtotal - minAllowedRevenue);

          if (discountAmount > maxAllowedDiscount) {
            discountAmount = Math.round(maxAllowedDiscount * 100) / 100;
          }
        }

        couponApplied = {
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          discount: discountAmount,
        };
      }
    }

    const totalAmount = Math.max(0, Math.round((subtotal + deliveryFee - discountAmount) * 100) / 100);
    const loyaltyEarned = Math.floor(totalAmount);

    return {
      subtotal,
      deliveryFee,
      discountAmount,
      totalAmount,
      loyaltyEarned,
      couponApplied,
    };
  },
};
