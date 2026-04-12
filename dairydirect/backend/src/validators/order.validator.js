// src/validators/order.validator.js
// FIX: Changed .cuid() to .uuid() — Supabase generates UUIDs, not CUIDs.
//      Using .cuid() was silently rejecting all valid Supabase IDs with a 400 error.
import { z } from 'zod';

export const createOrderSchema = z.object({
  addressId: z.string().uuid('Invalid address ID'),
  paymentMode: z.enum(['UPI', 'COD', 'CARD', 'MOCK']).default('MOCK'),
  notes: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        variantId: z.string().uuid('Invalid variant ID'),
        quantity: z
          .number()
          .int('Quantity must be a whole number')
          .min(1, 'Minimum quantity is 1')
          .max(50, 'Maximum quantity per item is 50'),
      })
    )
    .min(1, 'Order must have at least one item')
    .max(20, 'Maximum 20 different items per order'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'], {
    errorMap: () => ({
      message: 'Status must be one of: CONFIRMED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED',
    }),
  }),
});
