import { z } from 'zod';

export const placeOrderSchema = z.object({
  body: z.object({
    orderData: z
      .object({
        userId: z.string().uuid().optional(),
        addressId: z.string().uuid().optional(),
        shippingAddress: z.string().optional(),
        deliverySlot: z.string().optional(),
        deliveryDate: z.string().optional(),
        notes: z.string().optional(),
        paymentMethod: z.enum(['COD', 'Razorpay', 'UPI', 'Card', 'NetBanking', 'Wallet']).default('COD'),
        items: z
          .array(
            z.object({
              variantId: z.string().uuid(),
              quantity: z.number().int().min(1),
            })
          )
          .min(1, 'Order must have at least one item'),
        couponCode: z.string().optional(),
      })
      .or(
        z.object({
          userId: z.string().uuid().optional(),
          addressId: z.string().uuid().optional(),
          shippingAddress: z.string().optional(),
          deliverySlot: z.string().optional(),
          deliveryDate: z.string().optional(),
          notes: z.string().optional(),
          paymentMethod: z.enum(['COD', 'Razorpay', 'UPI', 'Card', 'NetBanking', 'Wallet']).default('COD'),
          items: z
            .array(
              z.object({
                variantId: z.string().uuid(),
                quantity: z.number().int().min(1),
              })
            )
            .min(1, 'Order must have at least one item'),
          couponCode: z.string().optional(),
        })
      ),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled']),
    paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  }),
});
