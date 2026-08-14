/**
 * POST /api/payments/webhook
 * Razorpay Webhook Handler.
 * Verifies webhook signature and processes asynchronous payment events:
 * - payment.captured  → update order payment_status to 'paid'
 * - payment.failed    → update order payment_status to 'failed'
 * - refund.processed  → update order payment_status to 'refunded'
 * 
 * Security: Uses HMAC-SHA256 with RAZORPAY_WEBHOOK_SECRET.
 * RAZORPAY_WEBHOOK_SECRET must be set separately from RAZORPAY_KEY_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query, withTransaction, isPgConfigured } from '@/lib/aws/rds';
import { getAdminSupabase } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-razorpay-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Signature missing' }, { status: 400 });
    }

    const rawBody = await request.text();

    // ─── Strict: RAZORPAY_WEBHOOK_SECRET MUST be configured ───
    // Do NOT fallback to RAZORPAY_KEY_SECRET — they serve different purposes.
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[RazorpayWebhook] RAZORPAY_WEBHOOK_SECRET is not configured!');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Verify HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    // Use timingSafeEqual to prevent timing attacks
    const expectedBuf = Buffer.from(expectedSignature, 'hex');
    const receivedBuf = Buffer.from(signature, 'hex');

    if (expectedBuf.length !== receivedBuf.length) {
      console.error('[RazorpayWebhook] Invalid signature length');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const isValid = crypto.timingSafeEqual(expectedBuf, receivedBuf);

    if (!isValid) {
      console.error('[RazorpayWebhook] Invalid signature received');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload;

    console.log(`[RazorpayWebhook] Processing event: ${eventType}`);

    // ─── Helper: Update order in DB (with RDS → Supabase fallback) ───
    const updateOrderByRazorpayOrderId = async (
      razorpayOrderId: string,
      updates: {
        payment_status?: string;
        razorpay_payment_id?: string;
      }
    ) => {
      if (isPgConfigured) {
        try {
          const setClauses: string[] = ['updated_at = now()'];
          const params: any[] = [];
          let pIdx = 1;

          if (updates.payment_status) {
            setClauses.push(`payment_status = $${pIdx++}`);
            params.push(updates.payment_status);
          }
          if (updates.razorpay_payment_id) {
            setClauses.push(`razorpay_payment_id = $${pIdx++}`);
            params.push(updates.razorpay_payment_id);
          }
          params.push(razorpayOrderId);

          await query(
            `UPDATE orders SET ${setClauses.join(', ')} WHERE razorpay_order_id = $${pIdx}`,
            params
          );
          return;
        } catch (err: any) {
          console.warn('[RazorpayWebhook] RDS update failed, using Supabase fallback:', err.message);
        }
      }

      // Supabase fallback
      const sb = getAdminSupabase();
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (updates.payment_status) updateData.payment_status = updates.payment_status;
      if (updates.razorpay_payment_id) updateData.razorpay_payment_id = updates.razorpay_payment_id;

      await sb
        .from('orders')
        .update(updateData)
        .eq('razorpay_order_id', razorpayOrderId);
    };

    const updateOrderByPaymentId = async (
      razorpayPaymentId: string,
      updates: { payment_status?: string }
    ) => {
      if (isPgConfigured) {
        try {
          await query(
            `UPDATE orders SET payment_status = $1, updated_at = now() WHERE razorpay_payment_id = $2`,
            [updates.payment_status, razorpayPaymentId]
          );
          return;
        } catch (err: any) {
          console.warn('[RazorpayWebhook] RDS update failed, using Supabase fallback:', err.message);
        }
      }

      const sb = getAdminSupabase();
      await sb
        .from('orders')
        .update({ payment_status: updates.payment_status, updated_at: new Date().toISOString() })
        .eq('razorpay_payment_id', razorpayPaymentId);
    };

    // ─── Handle Events ───
    if (eventType === 'payment.captured') {
      const payment = payload.payment?.entity;
      if (!payment) {
        console.warn('[RazorpayWebhook] payment.captured: missing payment entity');
        return NextResponse.json({ status: 'ok' });
      }

      const razorpayOrderId = payment.order_id;
      const razorpayPaymentId = payment.id;

      await updateOrderByRazorpayOrderId(razorpayOrderId, {
        payment_status: 'paid',
        razorpay_payment_id: razorpayPaymentId,
      });

      console.log(`[RazorpayWebhook] payment.captured → order updated for razorpay_order_id: ${razorpayOrderId}`);

    } else if (eventType === 'payment.failed') {
      const payment = payload.payment?.entity;
      if (!payment) return NextResponse.json({ status: 'ok' });

      const razorpayOrderId = payment.order_id;

      await updateOrderByRazorpayOrderId(razorpayOrderId, {
        payment_status: 'failed',
      });

      console.log(`[RazorpayWebhook] payment.failed → order marked failed for razorpay_order_id: ${razorpayOrderId}`);

    } else if (eventType === 'refund.processed') {
      const refund = payload.refund?.entity;
      if (!refund) return NextResponse.json({ status: 'ok' });

      const paymentId = refund.payment_id;

      await updateOrderByPaymentId(paymentId, {
        payment_status: 'refunded',
      });

      console.log(`[RazorpayWebhook] refund.processed → order marked refunded for payment_id: ${paymentId}`);

    } else {
      console.log(`[RazorpayWebhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('[RazorpayWebhook] Error:', error.message);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
