import { supabaseAdmin } from '@/lib/supabase/admin';
import { createRazorpayRefund, RazorpayError } from '@/lib/razorpay-refund';
import { advanceRequest } from '@/lib/returns/transitions';
import { notify } from '@/lib/notify';

export async function startRefund({
  orderId,
  requestId,
  amount,
}: {
  orderId: string;
  requestId: string | null;
  amount: number;
}) {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, user_id, total_amount, payment_method, payment_status, razorpay_payment_id')
    .eq('id', orderId)
    .single();

  if (!order) throw new Error('Order not found');

  const isCod = order.payment_method === 'COD';
  if (!isCod && !order.razorpay_payment_id) {
    throw new Error('No Razorpay payment id found on this order');
  }

  // never refund more than the customer paid
  const { data: prior } = await supabaseAdmin
    .from('refunds')
    .select('amount')
    .eq('order_id', orderId)
    .neq('status', 'failed');

  const alreadyRefunded = (prior ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0);
  if (alreadyRefunded + amount > Number(order.total_amount) + 0.001) {
    throw new Error('Refund amount exceeds total paid for this order');
  }

  let destination = null;
  if (isCod) {
    const { data: p } = await supabaseAdmin
      .from('profiles')
      .select('default_upi_id')
      .eq('id', order.user_id)
      .single();
    destination = { upi_id: p?.default_upi_id ?? null };
  }

  // Insert refund record first: unique indexes (uq_refund_per_request, uq_refund_per_cancel) make this idempotent
  const { data: refund, error } = await supabaseAdmin
    .from('refunds')
    .insert({
      order_id: orderId,
      return_request_id: requestId,
      amount,
      method: isCod ? 'manual_upi' : 'razorpay',
      destination,
      razorpay_payment_id: order.razorpay_payment_id ?? null,
      speed_requested: process.env.RAZORPAY_REFUND_SPEED || 'normal',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return; // duplicate request: already initiated
    throw error;
  }

  if (isCod) return; // COD manual refund queue processed by admin

  try {
    const rf = await createRazorpayRefund({
      paymentId: order.razorpay_payment_id!,
      amountInr: amount,
      refundRowId: refund.id,
      meta: { order_id: orderId, request_id: requestId ?? 'cancel' },
    });

    await supabaseAdmin
      .from('refunds')
      .update({
        razorpay_refund_id: rf.id,
        speed_processed: rf.speed_processed ?? null,
      })
      .eq('id', refund.id);

    if (rf.status === 'processed') {
      await settleRefund(refund.id);
    }
  } catch (e: any) {
    const msg = e instanceof RazorpayError ? e.message : String(e?.message || e);
    await supabaseAdmin
      .from('refunds')
      .update({ status: 'failed', failure_reason: msg })
      .eq('id', refund.id);
    await notify(['admin'], 'refund_failed', refund.id);
  }
}

// Marks one refund completed and advances request or order payment status (idempotent)
export async function settleRefund(refundId: string) {
  const { data: row } = await supabaseAdmin
    .from('refunds')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', refundId)
    .neq('status', 'completed')
    .select()
    .maybeSingle();

  if (!row) return; // already settled

  if (row.return_request_id) {
    await advanceRequest(row.return_request_id, 'refunded', { role: 'system' });
  } else {
    await supabaseAdmin
      .from('orders')
      .update({ payment_status: 'refunded' })
      .eq('id', row.order_id);
  }

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('user_id')
    .eq('id', row.order_id)
    .single();

  await notify(['customer'], 'refund_completed', row.id, order?.user_id);
}
