import { NextRequest, NextResponse } from 'next/server';
import { getRazorpayClient } from '@/lib/razorpay';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { z } from 'zod';

const CreateOrderInputSchema = z.object({
  amount: z.number().int({ message: 'Amount must be an integer in paise' }),
  currency: z.string().min(3).max(5).default('INR'),
  receipt: z.string().optional(),
  notes: z.record(z.string(), z.string()).optional(),
});

/**
 * POST /api/create-order
 * Creates a standard Razorpay order and registers it in razorpay_pending_orders.
 * Minimum amount: 100 paise (1 INR).
 * Requires authentication to prevent abuse.
 */
export async function POST(request: NextRequest) {
  try {
    // ─── Auth check: only authenticated users can create orders ───
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required to initiate payment' },
        { status: 401 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: 'Razorpay credentials not configured' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = CreateOrderInputSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: parseResult.error.issues.map(i => i.message).join(', ') 
        },
        { status: 400 }
      );
    }

    const { amount, currency, receipt, notes } = parseResult.data;

    // Minimum amount validation: 100 paise (₹1)
    if (amount < 100) {
      return NextResponse.json(
        { error: 'Minimum order amount is 100 paise (₹1)' },
        { status: 400 }
      );
    }

    const razorpay = getRazorpayClient();

    // Call Razorpay API: POST https://api.razorpay.com/v1/orders
    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: currency.toUpperCase(),
      receipt: receipt || `rcpt_${auth.userId.substring(0, 8)}_${Date.now()}`,
      notes: {
        ...notes,
        userId: auth.userId, // Always tag with user ID for audit trail
      },
    });

    // Register pending order record so /api/orders/place can verify expected amount & user
    try {
      const sb = getAdminSupabase();
      await sb.from('razorpay_pending_orders').insert({
        razorpay_order_id: razorpayOrder.id,
        user_id: auth.userId,
        expected_amount_paise: amount,
        currency: currency.toUpperCase(),
        coupon_code: null,
        items_snapshot: [],
      });
    } catch (dbErr) {
      console.warn('[RazorpayCreateOrder] Pending order table write warning:', dbErr);
    }

    return NextResponse.json({
      success: true,
      order_id: razorpayOrder.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: keyId,
      keyId,
    }, { status: 200 });

  } catch (error: any) {
    console.error('[RazorpayCreateOrder] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Razorpay order creation failed. Please try again.',
        details: error.error?.description || undefined
      },
      { status: 500 }
    );
  }
}
