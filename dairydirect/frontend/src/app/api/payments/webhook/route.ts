/**
 * POST /api/payments/webhook
 * Razorpay Webhook Handler.
 * Verifies webhook signature and processes asynchronous payment events:
 * - payment.captured  → verify amount+currency against order, then mark 'paid' idempotently
 * - payment.failed    → update order payment_status to 'failed'
 * - refund.processed  → update order payment_status to 'refunded'
 *
 * Security: Uses HMAC-SHA256 with RAZORPAY_WEBHOOK_SECRET.
 * RAZORPAY_WEBHOOK_SECRET must be set separately from RAZORPAY_KEY_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminSupabase } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-razorpay-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Signature missing' }, { status: 400 });
    }

    const rawBody = await request.text();

    // ─── Strict: RAZORPAY_WEBHOOK_SECRET MUST be configured ───
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[RazorpayWebhook] RAZORPAY_WEBHOOK_SECRET is not configured!');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Verify HMAC-SHA256 signature using timingSafeEqual
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'hex');
    const receivedBuf = Buffer.from(signature, 'hex');

    if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
      console.error('[RazorpayWebhook] Invalid signature received');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload;

    console.log(`[RazorpayWebhook] Processing event: ${eventType}`);

    const sb = getAdminSupabase();

    // ─── Helper: idempotent order update by Razorpay order_id ───
    const updateOrderByRazorpayOrderId = async (
      razorpayOrderId: string,
      updates: { payment_status?: string; razorpay_payment_id?: string }
    ) => {
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (updates.payment_status) updateData.payment_status = updates.payment_status;
      if (updates.razorpay_payment_id) updateData.razorpay_payment_id = updates.razorpay_payment_id;

      const { error } = await sb
        .from('orders')
        .update(updateData)
        .eq('razorpay_order_id', razorpayOrderId);

      if (error) {
        throw new Error(`[RazorpayWebhook] DB update failed for order ${razorpayOrderId}: ${error.message}`);
      }
    };

    const updateOrderByPaymentId = async (
      razorpayPaymentId: string,
      updates: { payment_status?: string }
    ) => {
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (updates.payment_status) updateData.payment_status = updates.payment_status;

      const { error } = await sb
        .from('orders')
        .update(updateData)
        .eq('razorpay_payment_id', razorpayPaymentId);

      if (error) {
        throw new Error(`[RazorpayWebhook] DB update by payment_id failed: ${error.message}`);
      }
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
      const capturedAmountPaise = Number(payment.amount);
      const capturedCurrency = payment.currency;

      // ─── Idempotency: skip if already marked paid ───
      const { data: existingOrder } = await sb
        .from('orders')
        .select('id, payment_status, total_amount, razorpay_order_id')
        .eq('razorpay_order_id', razorpayOrderId)
        .maybeSingle();

      if (!existingOrder) {
        console.warn(`[RazorpayWebhook] payment.captured: no order found for razorpay_order_id=${razorpayOrderId}`);
        return NextResponse.json({ status: 'ok' });
      }

      if (existingOrder.payment_status === 'paid') {
        console.log(`[RazorpayWebhook] payment.captured: already paid, skipping (idempotent) for ${razorpayOrderId}`);
        return NextResponse.json({ status: 'ok' });
      }

      // ─── Verify amount and currency match the order ───
      const expectedAmountPaise = Math.round(Number(existingOrder.total_amount) * 100);
      if (capturedAmountPaise !== expectedAmountPaise) {
        console.error('[RazorpayWebhook] AMOUNT MISMATCH for payment.captured:', {
          razorpayOrderId,
          capturedPaise: capturedAmountPaise,
          expectedPaise: expectedAmountPaise,
          orderId: existingOrder.id,
        });
        // Do NOT mark as paid — flag for manual review
        await sb.from('orders').update({
          payment_status: 'amount_mismatch',
          updated_at: new Date().toISOString(),
        }).eq('id', existingOrder.id);
        return NextResponse.json({ status: 'ok' });
      }

      if (capturedCurrency !== 'INR') {
        console.error('[RazorpayWebhook] CURRENCY MISMATCH for payment.captured:', {
          razorpayOrderId,
          capturedCurrency,
          expectedCurrency: 'INR',
        });
        return NextResponse.json({ status: 'ok' });
      }

      await updateOrderByRazorpayOrderId(razorpayOrderId, {
        payment_status: 'paid',
        razorpay_payment_id: razorpayPaymentId,
      });

      console.log(`[RazorpayWebhook] payment.captured → order marked paid for razorpay_order_id: ${razorpayOrderId}`);

    } else if (eventType === 'payment.failed') {
      const payment = payload.payment?.entity;
      if (!payment) return NextResponse.json({ status: 'ok' });

      await updateOrderByRazorpayOrderId(payment.order_id, { payment_status: 'failed' });
      console.log(`[RazorpayWebhook] payment.failed → order marked failed for razorpay_order_id: ${payment.order_id}`);

    } else if (eventType === 'refund.created') {
      const rf = payload.refund?.entity;
      if (rf) {
        const { findRefund } = await import('@/lib/refund-helper');
        const row = await findRefund(rf);
        if (row && !row.razorpay_refund_id) {
          await sb.from('refunds').update({ razorpay_refund_id: rf.id }).eq('id', row.id);
        }
      }
      console.log(`[RazorpayWebhook] refund.created for refund id: ${payload.refund?.entity?.id}`);

    } else if (eventType === 'refund.processed') {
      const rf = payload.refund?.entity;
      if (!rf) return NextResponse.json({ status: 'ok' });

      const { findRefund } = await import('@/lib/refund-helper');
      const { settleRefund } = await import('@/lib/refunds');
      const row = await findRefund(rf);

      if (row) {
        await sb.from('refunds').update({
          razorpay_refund_id: rf.id,
          speed_processed: rf.speed_processed ?? null,
        }).eq('id', row.id);
        await settleRefund(row.id);
      } else {
        await updateOrderByPaymentId(rf.payment_id, { payment_status: 'refunded' });
      }

      console.log(`[RazorpayWebhook] refund.processed → handled refund ${rf.id}`);

    } else if (eventType === 'refund.failed') {
      const rf = payload.refund?.entity;
      if (rf) {
        const { findRefund } = await import('@/lib/refund-helper');
        const { notify } = await import('@/lib/notify');
        const row = await findRefund(rf);
        if (row && row.status !== 'completed') {
          await sb.from('refunds').update({
            status: 'failed',
            failure_reason: 'Razorpay reported refund.failed',
          }).eq('id', row.id);
          await notify(['admin'], 'refund_failed', row.id);
        }
      }
      console.log(`[RazorpayWebhook] refund.failed for refund id: ${payload.refund?.entity?.id}`);

    } else if (eventType === 'refund.speed_changed') {
      console.log('[RazorpayWebhook] refund.speed_changed received');
    } else {
      console.log(`[RazorpayWebhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('[RazorpayWebhook] Error:', error.message);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
