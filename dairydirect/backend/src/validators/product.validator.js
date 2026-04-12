// src/validators/product.validator.js
// FIX: Added isActive field to createProductSchema — service reads productData.isActive
//      but it was never declared in the validator, so it was always stripped/undefined.
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(100),
  category: z.enum(['MILK', 'PANEER', 'GHEE', 'BUTTERMILK']),
  description: z.string().trim().max(500).optional().nullable(),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
  isActive: z.boolean().default(true),
  variants: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(20),
        price: z.number().positive('Price must be positive').max(10000),
        stock: z.number().int().min(0).default(0),
        isActive: z.boolean().default(true),
      })
    )
    .min(1, 'Product must have at least one variant'),
});

// Used by PATCH /products/:id/status
// Enforces that isActive is a strict boolean — rejects strings like "true", null, or missing field
export const toggleProductStatusSchema = z.object({
  isActive: z.boolean({
    required_error: 'isActive is required',
    invalid_type_error: 'isActive must be a boolean (true or false)',
  }),
});
