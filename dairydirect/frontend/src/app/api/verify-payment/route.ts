/**
 * POST /api/verify-payment
 * Legacy compatibility shim — forwards to /api/payments/razorpay/verify.
 *
 * This route previously only verified the HMAC signature and returned success
 * without updating the database. That meant a forged signature failure was the
 * ONLY guard, and the DB update (marking payment as 'paid') was a separate
 * optional step that could be skipped.
 *
 * The canonical payment verification flow is now:
 *   1. /api/payments/razorpay/create  → creates Razorpay order, stores pending record
 *   2. /api/orders/place              → full 5-step verification + order creation
 *
 * This endpoint is kept for backwards compatibility with existing client code.
 * It now performs the same full verification as /api/payments/razorpay/verify
 * and will also update the order's payment_status in the database.
 * DB errors are surfaced (not swallowed) so the webhook can reconcile.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayPaymentSignature } from '@/lib/razorpay';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { z } from 'zod';

const VerifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, { message: 'razorpay_order_id is required' }),
  razorpay_payment_id: z.string().min(1, { message: 'razorpay_payment_id is required' }),
  razorpay_signature: z.string().min(1, { message: 'razorpay_signature is required' }),
  order_id: z.string().uuid().optional(), // Optional internal system order ID
});

export async function POST(request: NextRequest) {
  try {
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
          details: parseResult.error.issues.map(i => i.message).join(', '),
        },
        { status: 400 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = parseResult.data;

    // ─── Idempotency: check if this payment_id was already verified ───
    const sb = getAdminSupabase();
    const { data: existingOrder } = await sb
      .from('orders')
      .select('id, payment_status')
      .eq('razorpay_payment_id', razorpay_payment_id)
      .maybeSingle();

    if (existingOrder?.payment_status === 'paid') {
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
      console.error('[VerifyPayment] Signature mismatch:', {
        userId: auth.userId,
        razorpayOrderId: razorpay_order_id,
        ip: request.headers.get('x-forwarded-for'),
      });
      return NextResponse.json(
        { success: false, error: 'Payment verification failed. Signature mismatch.' },
        { status: 400 }
      );
    }

    // ─── Update order payment_status — errors are surfaced, not swallowed ───
    // The webhook will reconcile if this fails, but we must not silently hide errors.
    const updateData = {
      payment_status: 'paid',
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      updated_at: new Date().toISOString(),
    };

    let updateError: any = null;

    if (order_id) {
      // Verify ownership before updating
      const { data: targetOrder, error: fetchErr } = await sb
        .from('orders')
        .select('id, user_id')
        .eq('id', order_id)
        .maybeSingle();

      if (fetchErr) {
        throw new Error(`Failed to fetch order for verification: ${fetchErr.message}`);
      }
      if (!targetOrder) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
      }
      if (targetOrder.user_id !== auth.userId && !auth.isAdmin) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      const { error } = await sb
        .from('orders')
        .update(updateData)
        .eq('id', order_id)
        .eq('user_id', auth.userId);
      updateError = error;
    } else {
      const { error } = await sb
        .from('orders')
        .update(updateData)
        .eq('razorpay_order_id', razorpay_order_id)
        .eq('user_id', auth.userId);
      updateError = error;
    }

    if (updateError) {
      // Surface the DB error rather than swallowing it. The webhook will reconcile.
      throw new Error(`DB update failed: ${updateError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      internal_order_id: order_id || null,
    }, { status: 200 });

  } catch (error: any) {
    console.error('[VerifyPayment] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error during payment verification' },
      { status: 500 }
    );
  }
}
