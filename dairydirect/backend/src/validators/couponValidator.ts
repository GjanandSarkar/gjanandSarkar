import { z } from 'zod';

export const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Coupon code is required'),
    subtotal: z.number().nonnegative(),
  }),
});

export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(2, 'Coupon code must be at least 2 characters'),
    type: z.enum(['percentage', 'flat']),
    value: z.number().positive('Value must be positive'),
    min_order_value: z.number().nonnegative().optional(),
    max_discount: z.number().positive().optional(),
    max_uses: z.number().int().positive().optional(),
    expiry_date: z.string().optional(),
  }),
});
