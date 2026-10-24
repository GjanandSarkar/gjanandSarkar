import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { fetchRazorpayRefund, createRazorpayRefund } from '@/lib/razorpay-refund';
import { settleRefund } from '@/lib/refunds';

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour cutoff
  const { data: stale } = await supabaseAdmin
    .from('refunds')
    .select('*')
    .eq('method', 'razorpay')
    .eq('status', 'initiated')
    .lt('created_at', cutoff)
    .limit(50);

  let processedCount = 0;
  for (const r of stale ?? []) {
    try {
      // The create call may have succeeded but our save failed: same idempotency key returns the same refund
      const rf = r.razorpay_refund_id
        ? await fetchRazorpayRefund(r.razorpay_refund_id)
        : await createRazorpayRefund({
            paymentId: r.razorpay_payment_id,
            amountInr: Number(r.amount),
            refundRowId: r.id,
            meta: { order_id: r.order_id, request_id: r.return_request_id || 'cancel' },
          });

      await supabaseAdmin
        .from('refunds')
        .update({
          razorpay_refund_id: rf.id,
          last_checked_at: new Date().toISOString(),
        })
        .eq('id', r.id);

      if (rf.status === 'processed') {
        await settleRefund(r.id);
      }
      processedCount++;
    } catch (e) {
      await supabaseAdmin
        .from('refunds')
        .update({ last_checked_at: new Date().toISOString() })
        .eq('id', r.id);
    }
  }

  return NextResponse.json({ ok: true, checked: stale?.length ?? 0, processed: processedCount });
}
