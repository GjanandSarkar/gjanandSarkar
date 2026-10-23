import { NextRequest, NextResponse } from 'next/server';
import { requireSeller } from '@/lib/api/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { advanceRequest, HttpError } from '@/lib/returns/transitions';
import { startRefund } from '@/lib/refunds';
import { notify } from '@/lib/notify';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSeller(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { to, trackingNo, courier } = body;

  const { data: row } = await supabaseAdmin
    .from('return_requests')
    .select('id, seller_id, request_type, order_id, user_id, refund_amount')
    .eq('id', id)
    .single();

  if (!row || (auth.user.role !== 'admin' && row.seller_id !== auth.seller.sellerId)) {
    return NextResponse.json({ error: 'Request not found or unauthorized' }, { status: 404 });
  }

  if (to === 'completed' && !trackingNo) {
    return NextResponse.json({ error: 'Tracking number is required to dispatch replacement' }, { status: 400 });
  }

  try {
    if (to === 'completed') {
      const { error: stockErr } = await supabaseAdmin.rpc('consume_replacement_stock', { p_request_id: id });
      if (stockErr) {
        return NextResponse.json({ error: stockErr.message }, { status: 400 });
      }
    }

    const extra =
      to === 'completed'
        ? {
            replacement_tracking_no: `${courier ?? ''} ${trackingNo}`.trim(),
            replacement_dispatched_at: new Date().toISOString(),
          }
        : {};

    const updated = await advanceRequest(id, to, { role: 'seller', id: auth.user.id }, extra);

    /* Refund failures must never be silent.

       startRefund throws BEFORE inserting the refunds row in several cases
       (order missing, no razorpay_payment_id, amount exceeds total paid).
       When that happened the error was swallowed and this endpoint still
       returned ok:true. The return was marked received, the seller saw
       success, no refunds row existed for the reconcile cron to retry, and
       the customer was simply never refunded -- with nothing surfaced
       anywhere. Report it so a human can act. */
    let refundError: string | null = null;
    if (to === 'received' && row.request_type === 'return') {
      try {
        await startRefund({ orderId: row.order_id, requestId: id, amount: Number(row.refund_amount) });
        await advanceRequest(id, 'refund_initiated', { role: 'system' });
      } catch (refundErr: any) {
        refundError = refundErr?.message || 'Refund initiation failed';
        console.error('[SellerReturn] Automatic refund initiation error:', refundErr);
        // Escalate: this needs manual intervention, money is owed.
        try {
          await notify(['admin'], 'refund_initiation_failed', id, row.user_id);
        } catch (notifyErr) {
          console.error('[SellerReturn] Failed to notify admin of refund failure:', notifyErr);
        }
      }
    }

    await notify(['customer'], `${row.request_type}_${to}`, id, row.user_id);
    return NextResponse.json({
      ok: true,
      request: updated,
      // Null unless the status change succeeded but the refund did not.
      refund_error: refundError,
    });
  } catch (e: any) {
    if (e instanceof HttpError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: e?.message || 'Failed to advance return request' }, { status: 500 });
  }
}
