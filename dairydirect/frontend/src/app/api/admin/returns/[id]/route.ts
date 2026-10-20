import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { advanceRequest, HttpError } from '@/lib/returns/transitions';
import { startRefund } from '@/lib/refunds';
import { writeAudit } from '@/lib/audit';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { action, to, note } = body;

  if (!note) {
    return NextResponse.json({ error: 'An audit note is required for admin overrides' }, { status: 400 });
  }

  const { data: rr } = await supabaseAdmin.from('return_requests').select('*').eq('id', id).single();
  if (!rr) {
    return NextResponse.json({ error: 'Return request not found' }, { status: 404 });
  }

  try {
    if (action === 'advance') {
      if (!to) {
        return NextResponse.json({ error: 'Target status "to" is required for advance action' }, { status: 400 });
      }
      await advanceRequest(id, to, { role: 'admin', id: auth.user.id }, { admin_notes: note });
    } else if (action === 'retry_refund') {
      await supabaseAdmin.from('refunds').delete().eq('return_request_id', id).eq('status', 'failed');
      await startRefund({ orderId: rr.order_id, requestId: id, amount: Number(rr.refund_amount) });
    } else if (action === 'mark_cod_paid') {
      await supabaseAdmin
        .from('refunds')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('return_request_id', id)
        .eq('method', 'manual_upi');
      await advanceRequest(id, 'refunded', { role: 'admin', id: auth.user.id });
    } else {
      return NextResponse.json({ error: 'Unknown action specified' }, { status: 400 });
    }
  } catch (e: any) {
    if (e instanceof HttpError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: e?.message || 'Operation failed' }, { status: 500 });
  }

  await writeAudit(
    auth.user.id,
    `request_${action}`,
    'return_request',
    id,
    { status: rr.status },
    { to, note },
    req
  );

  return NextResponse.json({ ok: true });
}
