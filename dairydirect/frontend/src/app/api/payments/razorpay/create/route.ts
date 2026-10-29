/**
 * POST /api/payments/razorpay/create
 * Creates a Razorpay order for payment initiation.
 *
 * Flow:
 * 1. Client sends cart items → server calculates price (never trusts client amount)
 * 2. Server creates Razorpay order → stores {razorpay_order_id, user_id, expected_amount_paise}
 *    in razorpay_pending_orders so /api/orders/place can verify ownership and amount.
 * 3. Returns razorpay_order_id to the client.
 * 4. Client opens Razorpay checkout, then calls /api/orders/place with the payment IDs.
 *
 * Security invariant: the expected amount is committed server-side BEFORE the client
 * ever touches Razorpay. /api/orders/place reads it back and rejects any order where
 * the captured amount does not match.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRazorpayClient } from '@/lib/razorpay';
import { calculateOrderPricing } from '@/lib/pricing';
import { getAuthUser, getClientIP } from '@/lib/api/auth-middleware';
import { checkRateLimit } from '@/lib/aws/redis';
import { getAdminSupabase } from '@/lib/supabase/admin';
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

    // ─── Server-side price calculation (never trust client) ───
    const pricing = await calculateOrderPricing(items, couponCode);
    if (!pricing.isProfitSafe) {
      return NextResponse.json({ error: pricing.message }, { status: 400 });
    }

    // Create Razorpay order (amount in paise = total * 100)
    const amountInPaise = Math.round(pricing.total * 100);
    if (amountInPaise < 100) {
      return NextResponse.json({ error: 'Minimum order amount is ₹1' }, { status: 400 });
    }

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

    // ─── Store pending order server-side so /api/orders/place can verify ───
    // This is the critical anti-fraud record: it binds the razorpay_order_id
    // to the user who created it and the server-computed expected amount.
    const sb = getAdminSupabase();
    const { error: insertErr } = await sb.from('razorpay_pending_orders').insert({
      razorpay_order_id: razorpayOrder.id,
      user_id: auth.userId,
      expected_amount_paise: amountInPaise,
      currency: 'INR',
      coupon_code: couponCode || null,
      items_snapshot: items,
    });

    if (insertErr) {
      // If we cannot persist the pending order, cancel the Razorpay order and fail.
      console.error('[RazorpayCreate] Failed to store pending order record:', insertErr.message);
      return NextResponse.json({ error: 'Payment initiation failed. Please try again.' }, { status: 500 });
    }

    // Get user profile for Razorpay prefill (optional, non-blocking)
    let profile: { name: string | null; email: string | null; phone: string | null } | null = null;
    try {
      const { data } = await sb
        .from('profiles')
        .select('name, email, phone')
        .eq('id', auth.userId)
        .maybeSingle();
      profile = data;
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
