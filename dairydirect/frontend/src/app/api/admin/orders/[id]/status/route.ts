import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { writeAudit } from '@/lib/audit';
import { notify } from '@/lib/notify';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const to = body?.to;

  if (!to || !['confirmed', 'processing', 'out_for_delivery', 'delivered'].includes(to)) {
    return NextResponse.json({ error: 'Invalid status transition target' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.rpc('advance_order_status', {
    p_order_id: id,
    p_to: to,
    p_actor_role: 'admin',
    p_actor_id: auth.user.id,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('INVALID_TRANSITION') ? 409 : 400 }
    );
  }

  await writeAudit(auth.user.id, 'order_status_change', 'order', id, { status: data?.from }, { status: to }, req);
  if (data?.user_id) {
    await notify(['customer'], `order_${to}`, id, data.user_id);
  }

  return NextResponse.json({ ok: true, ...data });
}
