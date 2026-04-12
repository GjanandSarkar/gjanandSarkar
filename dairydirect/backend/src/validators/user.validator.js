// src/validators/user.validator.js
import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
});

export const addAddressSchema = z.object({
  label: z.enum(['Home', 'Work', 'Other']).default('Home'),
  street: z.string().trim().min(5, 'Street address too short').max(200),
  area: z.string().trim().min(2).max(100),
  city: z.string().trim().default('Ahmedabad'),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Pincode must be a 6-digit number'),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  isDefault: z.boolean().default(false),
});
