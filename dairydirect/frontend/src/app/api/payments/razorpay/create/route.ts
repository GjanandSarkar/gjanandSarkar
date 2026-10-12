/**
 * POST /api/payments/razorpay/create
 * Creates a Razorpay order for payment initiation.
 * 
 * Flow:
 * 1. Client sends cart items → server calculates price
 * 2. Server creates Razorpay order → returns order_id
 * 3. Client opens Razorpay checkout with order_id
 * 4. After payment, client calls /api/payments/razorpay/verify
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRazorpayClient } from '@/lib/razorpay';
import { calculateOrderPricing } from '@/lib/pricing';
import { getAuthUser, getClientIP } from '@/lib/api/auth-middleware';
import { checkRateLimit } from '@/lib/aws/redis';
import { query } from '@/lib/aws/rds';
import { z } from 'zod';

const CreateOrderSchema = z.object({
  items: z.array(z.object({
    variantId: z.string().uuid(),
    quantity: z.number().int().min(1).max(100),
  })).min(1),
  couponCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const limit = await checkRateLimit(ip, 'payment_create', 10, 60);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = CreateOrderSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    const { items, couponCode } = parseResult.data;

    // Server-side price calculation (never trust client)
    const pricing = await calculateOrderPricing(items, couponCode);
    if (!pricing.isProfitSafe) {
      return NextResponse.json({ error: pricing.message }, { status: 400 });
    }

    // Create Razorpay order (amount in paise = total * 100)
    const amountInPaise = Math.round(pricing.total * 100);
    const razorpay = getRazorpayClient();

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: auth.userId,
        itemCount: items.length.toString(),
      },
    });

    // NOTE: payment_transactions table is not in use.
    // The razorpay_order_id is stored directly in the orders table after payment is confirmed.

    // Get user profile for Razorpay prefill (optional, non-blocking)
    let profile: { name: string | null; email: string | null; phone: string | null } | null = null;
    try {
      const profileResult = await query<{ name: string | null; email: string | null; phone: string | null }>(
        'SELECT name, email, phone FROM profiles WHERE id = $1',
        [auth.userId]
      );
      profile = profileResult.rows[0] || null;
    } catch {
      // Non-critical: proceed without prefill
    }

    return NextResponse.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      pricing: {
        subtotal: pricing.subtotal,
        deliveryFee: pricing.deliveryFee,
        discount: pricing.discount,
        total: pricing.total,
      },
      prefill: {
        name: profile?.name || '',
        email: profile?.email || '',
        contact: profile?.phone || '',
      },
    });
  } catch (error: any) {
    console.error('[RazorpayCreate] Error:', error.message);
    return NextResponse.json({ error: 'Payment initiation failed. Please try again.' }, { status: 500 });
  }
}
