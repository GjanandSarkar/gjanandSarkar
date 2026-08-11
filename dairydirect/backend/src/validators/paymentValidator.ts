import { z } from 'zod';

export const createRazorpayOrderSchema = z.object({
  body: z.object({
    orderId: z.string().uuid(),
  }),
});

export const verifyRazorpayPaymentSchema = z.object({
  body: z.object({
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1),
    orderId: z.string().uuid().optional(),
  }),
});
