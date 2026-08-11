import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  body: z.object({
    userId: z.string().uuid().optional(),
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional(),
    volume: z.number().int().min(1).default(1),
    plan: z.enum(['daily', 'alternate', 'weekly', 'custom']).default('daily'),
    deliverySlot: z.string().optional(),
    startDate: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updateSubscriptionSchema = z.object({
  body: z.object({
    subId: z.string().uuid(),
    action: z.enum(['pause', 'resume', 'change_volume', 'change_plan', 'cancel']),
    newVolume: z.number().int().min(1).optional(),
    newPlan: z.enum(['daily', 'alternate', 'weekly', 'custom']).optional(),
    pauseUntil: z.string().optional(),
  }),
});
