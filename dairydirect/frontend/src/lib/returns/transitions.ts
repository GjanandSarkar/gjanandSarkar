import { supabaseAdmin } from '@/lib/supabase/admin';

export const RETURN_FLOW: Record<string, string[]> = {
  initiated: ['picked_up'],
  picked_up: ['received'],
  received: ['refund_initiated'],
  refund_initiated: ['refunded'],
  refunded: [],
};

export const REPLACEMENT_FLOW: Record<string, string[]> = {
  initiated: ['picked_up'],
  picked_up: ['received'],
  received: ['completed'],
  completed: [],
};

const CAN_SET: Record<string, string[]> = {
  seller: ['picked_up', 'received', 'completed'],
  customer: [],
  system: ['refund_initiated', 'refunded'],
};

const STAMP: Record<string, string> = {
  picked_up: 'picked_up_at',
  received: 'received_at',
  refund_initiated: 'refund_initiated_at',
  refunded: 'completed_at',
  completed: 'completed_at',
};

export class HttpError extends Error {
  constructor(public status: number, m: string) {
    super(m);
  }
}

export async function advanceRequest(
  id: string,
  to: string,
  actor: { role: 'seller' | 'admin' | 'system'; id?: string },
  extra: Record<string, unknown> = {}
) {
  const { data: req } = await supabaseAdmin.from('return_requests').select('*').eq('id', id).single();
  if (!req) throw new HttpError(404, 'Request not found');

  const flow = req.request_type === 'return' ? RETURN_FLOW : REPLACEMENT_FLOW;
  if (!flow[req.status]?.includes(to)) {
    throw new HttpError(409, `Cannot move from ${req.status} to ${to}`);
  }
  if (actor.role !== 'admin' && !CAN_SET[actor.role]?.includes(to)) {
    throw new HttpError(403, 'Not allowed');
  }

  const now = new Date().toISOString();
  const { data: updated } = await supabaseAdmin
    .from('return_requests')
    .update({
      status: to,
      updated_at: now,
      ...(STAMP[to] ? { [STAMP[to]]: now } : {}),
      ...extra,
    })
    .eq('id', id)
    .eq('status', req.status) // compare and swap: prevents race conditions and double transitions
    .select()
    .single();

  if (!updated) {
    throw new HttpError(409, 'Request was changed by someone else. Reload.');
  }

  await supabaseAdmin.from('status_events').insert({
    entity_type: req.request_type,
    entity_id: id,
    from_status: req.status,
    to_status: to,
    actor_role: actor.role,
    actor_id: actor.id ?? null,
  });

  return updated;
}
