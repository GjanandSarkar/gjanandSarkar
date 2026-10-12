/**
 * POST /api/payments/razorpay/verify
 * Verifies Razorpay payment signature (HMAC-SHA256).
 * Only marks order as paid after cryptographic verification.
 * 
 * Security: Signature verification prevents payment bypass attacks.
 * This route is for the advanced payment flow (via /api/payments/razorpay/create).
 * For the standard checkout flow, /api/verify-payment is used.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayPaymentSignature } from '@/lib/razorpay';
import { query, isPgConfigured } from '@/lib/aws/rds';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { z } from 'zod';

const VerifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  order_id: z.string().uuid().optional(), // Our internal order ID (if known)
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
        razorpayOrderId: razorpay_order_id,
        ip: request.headers.get('x-forwarded-for'),
      });
      return NextResponse.json({ error: 'Payment verification failed. Signature mismatch.' }, { status: 400 });
    }

    // Update order payment status using razorpay_order_id (always available)
    // We update by razorpay_order_id since we may not have the internal order_id here
    if (isPgConfigured) {
      try {
        if (order_id) {
          // If we have the internal order ID, update by that + verify ownership
          const orderResult = await query<{ user_id: string; payment_status: string }>(
            'SELECT user_id, payment_status FROM orders WHERE id = $1',
            [order_id]
          );

          if (orderResult.rows.length === 0) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
          }

          const order = orderResult.rows[0];
          if (order.user_id !== auth.userId && !auth.isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }

          if (order.payment_status !== 'paid') {
            await query(
              `UPDATE orders 
               SET payment_status = 'paid', razorpay_payment_id = $1, razorpay_order_id = $2, razorpay_signature = $3, updated_at = now()
               WHERE id = $4`,
              [razorpay_payment_id, razorpay_order_id, razorpay_signature, order_id]
            );
          }
        } else {
          // Update by razorpay_order_id
          await query(
            `UPDATE orders 
             SET payment_status = 'paid', razorpay_payment_id = $1, razorpay_signature = $2, updated_at = now()
             WHERE razorpay_order_id = $3 AND user_id = $4`,
            [razorpay_payment_id, razorpay_signature, razorpay_order_id, auth.userId]
          );
        }
      } catch (dbErr: any) {
        console.warn('[RazorpayVerify] DB update failed:', dbErr.message);
        // Non-critical: signature is valid, proceed
      }
    } else {
      // Supabase fallback
      const sb = getAdminSupabase();
      const updateData = {
        payment_status: 'paid',
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        updated_at: new Date().toISOString(),
      };

      if (order_id) {
        await sb.from('orders').update(updateData).eq('id', order_id).eq('user_id', auth.userId);
      } else {
        await sb.from('orders').update(updateData).eq('razorpay_order_id', razorpay_order_id).eq('user_id', auth.userId);
      }
    }

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
