/**
 * Business & Delivery Configuration
 *
 * This is the central configuration file for Gjanand Sarkar.
 * You can easily adjust delivery costs, minimum order requirements,
 * free delivery thresholds, and business rules right here.
 *
 * Keep this file free of external imports so it can be safely used
 * across both client and server components without increasing bundle size.
 */

export const BUSINESS_CONFIG = {
  // ─── Store Identity ──────────────────────────────────────────────────────────
  store: {
    name: 'Gjanand Sarkar',
    tagline: 'Direct from Verified Indian Manufacturers',
    supportPhone: '+91 90810 70163',
    supportEmail: 'gjanandsarkar09@gmail.com',
    currency: 'INR',
    currencySymbol: '₹',
  },

  // ─── Delivery & Logistics Fees ───────────────────────────────────────────────
  delivery: {
    /**
     * Standard delivery fee (₹) charged when cart subtotal is below the freeDeliveryThreshold.
     * Change this value (e.g. 20, 25, 30, 40) to adjust delivery charges.
     */
    standardDeliveryFee: 25,

    /**
     * Minimum cart subtotal (₹) required for 100% FREE delivery.
     * Changing this (e.g. 199, 299, 499) immediately updates the checkout,
     * cart drawer progress bar, and top announcement banners.
     */
    freeDeliveryThreshold: 199,

    /**
     * Minimum order subtotal (₹) required before a customer can place an order.
     */
    minOrderValue: 149,

    /**
     * Estimated internal fulfillment & transport cost (₹) per order.
     * Used for backend profit margin and safety calculations.
     */
    deliveryCost: 25,

    /**
     * Freshness guarantee window in hours for perishable items.
     */
    freshnessGuaranteeHours: 36,

    /**
     * Estimated delivery timing promise shown across product cards and checkout.
     */
    estimatedDeliveryText: 'Delivery Tomorrow',
  },

  // ─── Margins & Discount Guards ───────────────────────────────────────────────
  margins: {
    /**
     * Minimum acceptable gross profit margin percent.
     */
    minProfitMarginPercent: 20,

    /**
     * Maximum coupon or promotional discount percent allowed on any order.
     */
    maxDiscountPercent: 30,
  },
} as const;

export type BusinessConfig = typeof BUSINESS_CONFIG;
