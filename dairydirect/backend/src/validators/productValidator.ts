import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Product name is required'),
    category: z.enum(['Milk', 'Ghee', 'Paneer', 'Curd', 'Buttermilk', 'Butter', 'Sweets', 'Other']),
    description: z.string().optional(),
    image_url: z.string().optional(),
    seller_id: z.string().uuid().optional(),
    brand: z.string().optional(),
    state_origin: z.string().optional(),
    is_deal_of_the_day: z.boolean().optional(),
    discount_pct: z.number().min(0).max(100).optional(),
    tags: z.array(z.string()).optional(),
    variants: z
      .array(
        z.object({
          weight: z.string().min(1, 'Weight is required'),
          price: z.number().positive('Price must be greater than 0'),
          original_price: z.number().positive().optional(),
          cost_price: z.number().min(0).optional(),
          stock: z.number().int().min(0).optional(),
          batch_number: z.string().optional(),
          expiry_date: z.string().optional(),
        })
      )
      .min(1, 'At least one variant is required'),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    category: z.enum(['Milk', 'Ghee', 'Paneer', 'Curd', 'Buttermilk', 'Butter', 'Sweets', 'Other']).optional(),
    description: z.string().optional(),
    image_url: z.string().optional(),
    seller_id: z.string().uuid().optional(),
    brand: z.string().optional(),
    state_origin: z.string().optional(),
    is_deal_of_the_day: z.boolean().optional(),
    discount_pct: z.number().min(0).max(100).optional(),
    tags: z.array(z.string()).optional(),
    is_active: z.boolean().optional(),
    sort_order: z.number().int().optional(),
  }),
});
