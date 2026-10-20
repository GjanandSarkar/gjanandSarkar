import { describe, it, expect, vi, beforeEach } from 'vitest';
import { canCancelOrder } from '@/lib/orders/cancel-rules';

describe('canCancelOrder', () => {
  it.each(['confirmed', 'out_for_delivery'])('allows %s', (s) => expect(canCancelOrder(s)).toBe(true));
  it.each(['delivered', 'cancelled', 'pending', 'processing', '', null, undefined])('blocks %s', (s) =>
    expect(canCancelOrder(s as any)).toBe(false));
});

const rpc = vi.fn();
const getAuthUser = vi.fn();
const startRefund = vi.fn();
vi.mock('@/lib/auth', () => ({ getAuthUser: (...a: any[]) => getAuthUser(...a) }));
vi.mock('@/lib/supabase/admin', () => ({ supabaseAdmin: { rpc: (...a: any[]) => rpc(...a) } }));
vi.mock('@/lib/refunds', () => ({ startRefund: (...a: any[]) => startRefund(...a) }));

import { POST } from '@/app/api/orders/[id]/cancel/route';
const ID = '11111111-1111-4111-8111-111111111111';
const call = () => POST(new Request('http://x', { method: 'POST', body: '{}' }) as any, { params: Promise.resolve({ id: ID }) });

describe('POST /api/orders/[id]/cancel', () => {
  beforeEach(() => { vi.clearAllMocks(); getAuthUser.mockResolvedValue({ id: 'u1' }); });

  it('401 when not signed in', async () => {
    getAuthUser.mockResolvedValue(null);
    expect((await call()).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });
  it('404 for another customer order', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'ORDER_NOT_FOUND' } });
    expect((await call()).status).toBe(404);
  });
  it('409 for a delivered order', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'CANCEL_NOT_ALLOWED:delivered' } });
    const res = await call();
    expect(res.status).toBe(409);
    expect((await res.json()).currentStatus).toBe('delivered');
  });
  it('200 and no refund for an unpaid order', async () => {
    rpc.mockResolvedValue({ data: { refund_needed: false, amount: 100 }, error: null });
    expect((await call()).status).toBe(200);
    expect(startRefund).not.toHaveBeenCalled();
  });
  it('200 and one refund start for a paid order, even if the refund call fails', async () => {
    rpc.mockResolvedValue({ data: { refund_needed: true, amount: 250 }, error: null });
    startRefund.mockRejectedValue(new Error('gateway down'));
    const res = await call();
    expect(res.status).toBe(200);
    expect((await res.json()).refund).toBe('queued_for_admin');
    expect(startRefund).toHaveBeenCalledTimes(1);
  });
});
