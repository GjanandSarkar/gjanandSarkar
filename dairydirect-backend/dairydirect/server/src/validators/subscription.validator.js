// src/validators/subscription.validator.js
// FIX: Changed .cuid() to .uuid() — Supabase generates UUIDs, not CUIDs.
import { z } from 'zod';

export const createSubscriptionSchema = z
  .object({
    variantId: z.string().uuid('Invalid variant ID'),
    quantity: z
      .number()
      .int()
      .min(1, 'Minimum quantity is 1')
      .max(10, 'Maximum subscription quantity is 10'),
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).default('DAILY'),
    startDate: z
      .string()
      .refine((d) => !isNaN(Date.parse(d)), 'Invalid date format')
      .refine(
        (d) => new Date(d) >= new Date(new Date().toDateString()),
        'Start date cannot be in the past'
      ),
    endDate: z
      .string()
      .refine((d) => !isNaN(Date.parse(d)), 'Invalid date format')
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (!data.endDate) return true;
      return new Date(data.endDate) > new Date(data.startDate);
    },
    {
      message: 'endDate must be after startDate',
      path: ['endDate'],
    }
  );
