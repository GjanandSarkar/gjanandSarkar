/**
 * POST /api/payments/webhook
 * Razorpay Webhook Handler.
 * Verifies webhook signature and processes asynchronous payment events:
 * - payment.captured
 * - payment.failed
 * - refund.processed
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query, withTransaction } from '@/lib/aws/rds';
import { sendOrderStatusEmail } from '@/lib/aws/ses';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-razorpay-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Signature missing' }, { status: 400 });
    }

    const rawBody = await request.text();
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    if (!webhookSecret) {
      console.error('[RazorpayWebhook] Secret not configured');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    // Verify HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );

    if (!isValid) {
      console.error('[RazorpayWebhook] Invalid signature received');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload;

    console.log(`[RazorpayWebhook] Processing event: ${eventType}`);

    if (eventType === 'payment.captured') {
      const payment = payload.payment.entity;
      const razorpayOrderId = payment.order_id;
      const razorpayPaymentId = payment.id;

      await withTransaction(async (client) => {
        // Find order by razorpay_order_id or notes
        const orderRes = await client.query<{ id: string; user_id: string; status: string }>(
          'SELECT id, user_id, status FROM orders WHERE razorpay_order_id = $1',
          [razorpayOrderId]
        );

        if (orderRes.rows.length > 0) {
          const order = orderRes.rows[0];

          await client.query(
            `UPDATE orders 
             SET payment_status = 'paid', payment_id = $1, updated_at = now()
             WHERE id = $2`,
            [razorpayPaymentId, order.id]
          );

          await client.query(
            `UPDATE payment_transactions 
             SET razorpay_payment_id = $1, status = 'captured', updated_at = now()
             WHERE razorpay_order_id = $2`,
            [razorpayPaymentId, razorpayOrderId]
          );
        }
      });
    } else if (eventType === 'payment.failed') {
      const payment = payload.payment.entity;
      const razorpayOrderId = payment.order_id;

      await query(
        `UPDATE payment_transactions 
         SET status = 'failed', notes = $1, updated_at = now()
         WHERE razorpay_order_id = $2`,
        [payment.error_description || 'Payment failed', razorpayOrderId]
      );
    } else if (eventType === 'refund.processed') {
      const refund = payload.refund.entity;
      const paymentId = refund.payment_id;

      await query(
        `UPDATE orders 
         SET payment_status = 'refunded', updated_at = now()
         WHERE payment_id = $1`,
        [paymentId]
      );
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('[RazorpayWebhook] Error:', error.message);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
