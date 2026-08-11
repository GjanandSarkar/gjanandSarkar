import { z } from 'zod';

export const addToCartSchema = z.object({
  body: z.object({
    userId: z.string().uuid().optional(),
    productId: z.string().uuid(),
    variantId: z.string().uuid(),
    quantity: z.number().int().min(1).default(1),
  }),
});

export const updateCartSchema = z.object({
  body: z.object({
    userId: z.string().uuid().optional(),
    productId: z.string().uuid(),
    variantId: z.string().uuid(),
    quantity: z.number().int().min(0),
  }),
});
