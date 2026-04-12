// src/validators/report.validator.js
// FIX: Changed .cuid() to .uuid() — Supabase generates UUIDs, not CUIDs.
import { z } from 'zod';

export const createReportSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  issueType: z.enum(['SPOILED', 'WRONG_QUANTITY', 'WRONG_PRODUCT', 'LATE_DELIVERY', 'OTHER']),
  description: z
    .string()
    .trim()
    .min(10, 'Please provide at least 10 characters describing the issue')
    .max(1000),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
});

export const updateReportSchema = z.object({
  status: z.enum(['IN_REVIEW', 'RESOLVED', 'DISMISSED']).optional(),
  resolution: z.string().trim().max(500).optional(),
});
