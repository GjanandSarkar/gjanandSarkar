import { z } from 'zod';

export const submitReturnSchema = z.object({
  body: z.object({
    orderId: z.string().uuid(),
    reason: z.string().min(3, 'Reason is required'),
    description: z.string().optional(),
    images: z.array(z.string()).optional(),
  }),
});

export const updateReturnSchema = z.object({
  body: z.object({
    id: z.string().uuid().optional(),
    returnId: z.string().uuid().optional(),
    status: z.enum(['pending', 'approved', 'rejected', 'refunded']),
    refundAmount: z.number().nonnegative().optional(),
    adminNotes: z.string().optional(),
  }),
});
