import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayPaymentSignature } from '@/lib/razorpay';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { z } from 'zod';

const VerifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, { message: 'razorpay_order_id is required' }),
  razorpay_payment_id: z.string().min(1, { message: 'razorpay_payment_id is required' }),
  razorpay_signature: z.string().min(1, { message: 'razorpay_signature is required' }),
  order_id: z.string().optional(), // Optional internal system order ID
});

/**
 * POST /api/verify-payment
 * Verifies Razorpay payment signature (HMAC-SHA256).
 * Cryptographically compares generated HMAC against razorpay_signature.
 * 
 * Security:
 * - Requires authentication to prevent unauthenticated abuse
 * - Idempotent: returns success if payment_id already processed
 * - Uses timingSafeEqual to prevent timing attacks
 */
export async function POST(request: NextRequest) {
  try {
    // ─── Auth check: only authenticated users can verify payments ───
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = VerifyPaymentSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: 'Missing or invalid required payment verification fields',
          details: parseResult.error.issues.map(i => i.message).join(', ')
        },
        { status: 400 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = parseResult.data;

    // ─── Idempotency: check if this payment_id was already verified ───
    // This prevents replay attacks where the same successful response is submitted twice
    const sb = getAdminSupabase();
    const { data: existingOrder } = await sb
      .from('orders')
      .select('id, payment_status')
      .eq('razorpay_payment_id', razorpay_payment_id)
      .maybeSingle();

    if (existingOrder && existingOrder.payment_status === 'paid') {
      // Already verified and paid — return success (idempotent)
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        internal_order_id: existingOrder.id,
      }, { status: 200 });
    }

    // ─── Cryptographic HMAC-SHA256 signature verification ───
    const isSignatureValid = verifyRazorpayPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isSignatureValid) {
      console.error('[RazorpayVerify] Signature mismatch for order:', razorpay_order_id, {
        userId: auth.userId,
        ip: request.headers.get('x-forwarded-for'),
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payment verification failed. Signature mismatch.' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      internal_order_id: order_id || null,
    }, { status: 200 });

  } catch (error: any) {
    console.error('[RazorpayVerify] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal error during payment verification' 
      },
      { status: 500 }
    );
  }
}
