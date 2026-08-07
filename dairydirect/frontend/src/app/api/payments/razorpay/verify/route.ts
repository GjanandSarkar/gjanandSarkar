/**
 * POST /api/payments/razorpay/verify
 * Verifies Razorpay payment signature (HMAC-SHA256).
 * Only marks order as paid after cryptographic verification.
 * 
 * Security: Signature verification prevents payment bypass attacks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayPaymentSignature } from '@/lib/razorpay';
import { query } from '@/lib/aws/rds';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { sendOrderStatusEmail } from '@/lib/aws/ses';
import { z } from 'zod';

const VerifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  order_id: z.string().uuid(), // Our internal order ID
});

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = VerifySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid verification data' }, { status: 400 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = parseResult.data;

    // ═══ CRITICAL: Verify HMAC-SHA256 Signature ═══
    // This prevents payment bypass — any tampered payment will fail here.
    const isSignatureValid = verifyRazorpayPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isSignatureValid) {
      console.error('[RazorpayVerify] SIGNATURE MISMATCH — Possible payment fraud attempt!', {
        userId: auth.userId,
        orderId: order_id,
        ip: request.headers.get('x-forwarded-for'),
      });
      return NextResponse.json({ error: 'Payment verification failed. Signature mismatch.' }, { status: 400 });
    }

    // Verify the order belongs to this user
    const orderResult = await query<{ user_id: string; status: string; payment_status: string }>(
      'SELECT user_id, status, payment_status FROM orders WHERE id = $1',
      [order_id]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderResult.rows[0];
    if (order.user_id !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json({ success: true, message: 'Already paid' });
    }

    // Update order payment status
    await query(
      `UPDATE orders 
       SET payment_status = 'paid', payment_id = $1, razorpay_order_id = $2, updated_at = now()
       WHERE id = $3`,
      [razorpay_payment_id, razorpay_order_id, order_id]
    );

    // Update payment transaction record
    await query(
      `UPDATE payment_transactions 
       SET razorpay_payment_id = $1, razorpay_signature = $2, status = 'paid', updated_at = now()
       WHERE razorpay_order_id = $3`,
      [razorpay_payment_id, razorpay_signature, razorpay_order_id]
    );

    // Send confirmation asynchronously
    setImmediate(async () => {
      try {
        const profileResult = await query<{ name: string | null; email: string | null }>(
          'SELECT name, email FROM profiles WHERE id = $1',
          [auth.userId]
        );
        const profile = profileResult.rows[0];

        if (profile?.email) {
          await sendOrderStatusEmail({
            to: profile.email,
            customerName: profile.name || 'Valued Customer',
            orderId: order_id,
            status: 'confirmed',
            message: `Your payment of ₹${''} was successful. Your order is confirmed and will be delivered tomorrow!`,
          });
        }
      } catch {}
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
    });
  } catch (error: any) {
    console.error('[RazorpayVerify] Error:', error.message);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}
