import { z } from 'zod';

export const updateInventorySchema = z.object({
  body: z.object({
    updates: z.array(
      z.object({
        variantId: z.string().uuid(),
        stock: z.number().int().min(0),
        costPrice: z.number().min(0).optional(),
        batchNumber: z.string().optional(),
      })
    ),
  }),
});

export const updateSettingsSchema = z.object({
  body: z.object({
    min_order_value: z.number().min(0).optional(),
    standard_delivery_fee: z.number().min(0).optional(),
    delivery_cost: z.number().min(0).optional(),
    free_delivery_threshold: z.number().min(0).optional(),
    min_profit_margin_percent: z.number().min(0).max(100).optional(),
    max_discount_percent: z.number().min(0).max(100).optional(),
    freshness_guarantee_hours: z.number().int().min(1).optional(),
    is_store_open: z.boolean().optional(),
    store_closure_reason: z.string().optional(),
    support_phone: z.string().optional(),
    support_email: z.string().email().optional(),
    razorpay_enabled: z.boolean().optional(),
    cod_enabled: z.boolean().optional(),
    gst_rate_percent: z.number().min(0).max(100).optional(),
  }),
});
