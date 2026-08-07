import { NextRequest, NextResponse } from 'next/server';
import { getRazorpayClient } from '@/lib/razorpay';
import { z } from 'zod';

const CreateOrderInputSchema = z.object({
  amount: z.number().int({ message: 'Amount must be an integer in paise' }),
  currency: z.string().min(3).max(5).default('INR'),
  receipt: z.string().optional(),
  notes: z.record(z.string(), z.string()).optional(),
});

/**
 * POST /api/create-order
 * Creates a standard Razorpay order.
 * Minimum amount: 100 paise (1 INR).
 */
export async function POST(request: NextRequest) {
  try {
    // Check credentials configuration
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: 'Razorpay credentials not configured' },
        { status: 401 }
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
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    });

    return NextResponse.json({
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
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
