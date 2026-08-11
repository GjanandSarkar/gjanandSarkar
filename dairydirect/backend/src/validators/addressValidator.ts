import { z } from 'zod';

export const saveAddressSchema = z.object({
  body: z.object({
    userId: z.string().uuid().optional(),
    label: z.string().min(1, 'Label is required'),
    address: z.string().min(5, 'Address must be at least 5 characters'),
    apartment: z.string().optional(),
    pincode: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    isDefault: z.boolean().optional(),
  }),
});

export const updateAddressSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    label: z.string().min(1).optional(),
    address: z.string().min(5).optional(),
    apartment: z.string().optional(),
    pincode: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    isDefault: z.boolean().optional(),
  }),
});
