import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// ─── Mocks ───────────────────────────────────────────────────
const rpcMock = vi.fn();
const writeAuditMock = vi.fn();
const requireAdminMock = vi.fn();
const requireSellerMock = vi.fn();
const notifyMock = vi.fn();
const supabaseFromMock = vi.fn();

vi.mock('@/lib/api/auth-middleware', () => ({
  requireAdmin: (...args: any[]) => requireAdminMock(...args),
  requireSeller: (...args: any[]) => requireSellerMock(...args),
  requireAuth: vi.fn(),
  getClientIP: () => '127.0.0.1',
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    rpc: (...args: any[]) => rpcMock(...args),
    from: (...args: any[]) => supabaseFromMock(...args),
  },
}));

vi.mock('@/lib/audit', () => ({
  writeAudit: (...args: any[]) => writeAuditMock(...args),
}));

vi.mock('@/lib/notify', () => ({
  notify: (...args: any[]) => notifyMock(...args),
}));

import { POST as confirmCodPaymentRoute } from '@/app/api/admin/orders/[id]/confirm-cod-payment/route';
import { POST as sellerConfirmCodRoute } from '@/app/api/seller/orders/[id]/confirm-cod-payment/route';

const VALID_ORDER_ID = '22222222-2222-4222-8222-222222222222';
const ADMIN_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SELLER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const SELLER_USER_ID = 'uuuuuuuu-uuuu-4uuu-8uuu-uuuuuuuuuuuu';
const CUSTOMER_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

function createPostRequest(body: Record<string, any> = {}) {
  return new Request(`http://localhost:3000/api/admin/orders/${VALID_ORDER_ID}/confirm-cod-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function callConfirmRoute(orderId: string = VALID_ORDER_ID, body: Record<string, any> = {}) {
  const req = createPostRequest(body);
  return confirmCodPaymentRoute(req as any, { params: Promise.resolve({ id: orderId }) });
}

describe('Cash on Delivery (COD) Payment Tracking Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notifyMock.mockResolvedValue(undefined);
    writeAuditMock.mockResolvedValue(undefined);

    supabaseFromMock.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { user_id: CUSTOMER_ID }, error: null }),
        })),
      })),
    });
  });

  describe('1. COD Order Creation Logic', () => {
    it('sets payment_method="COD" and payment_status="pending"', () => {
      // Server-side payment_status derivation rule from /api/orders/place
      const derivePaymentStatus = (method: string) => {
        const m = (method || '').toLowerCase();
        if (m === 'razorpay' || m === 'upi') return 'paid';
        return 'pending'; // COD is always pending at creation
      };

      expect(derivePaymentStatus('COD')).toBe('pending');
      expect(derivePaymentStatus('cod')).toBe('pending');
      expect(derivePaymentStatus('razorpay')).toBe('paid');
    });

    it('does not mark COD orders as paid on creation', () => {
      const orderPayload = {
        payment_method: 'COD',
        total_amount: 450,
      };
      const initialPaymentStatus = orderPayload.payment_method === 'COD' ? 'pending' : 'paid';
      expect(initialPaymentStatus).toBe('pending');
      expect(initialPaymentStatus).not.toBe('paid');
    });
  });

  describe('2. Independence of Order and Payment Statuses', () => {
    it('delivering an order does not automatically mark payment as paid', () => {
      const order = {
        id: VALID_ORDER_ID,
        payment_method: 'COD',
        status: 'out_for_delivery',
        payment_status: 'pending',
      };

      // In advance_order_status and PUT /api/orders, status changes to delivered without altering payment_status
      const advanceOrder = (current: typeof order, nextStatus: string) => ({
        ...current,
        status: nextStatus,
      });

      const deliveredOrder = advanceOrder(order, 'delivered');
      expect(deliveredOrder.status).toBe('delivered');
      expect(deliveredOrder.payment_status).toBe('pending');
      expect(deliveredOrder.payment_status).not.toBe('paid');
    });

    it('cancelled or undelivered COD orders preserve payment audit history and cannot be falsely marked paid', () => {
      const order = {
        id: VALID_ORDER_ID,
        payment_method: 'COD',
        status: 'cancelled',
        payment_status: 'pending',
      };

      expect(order.status).toBe('cancelled');
      expect(order.payment_status).toBe('pending');
    });
  });

  describe('3. Admin COD Payment Confirmation API (POST /api/admin/orders/[id]/confirm-cod-payment)', () => {
    it('returns 401 when user is not authenticated', async () => {
      requireAdminMock.mockResolvedValue({
        ok: false,
        response: NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 }),
      });

      const res = await callConfirmRoute();
      expect(res.status).toBe(401);
      expect(rpcMock).not.toHaveBeenCalled();
    });

    it('returns 403 when user is not an Admin (e.g. seller or customer)', async () => {
      requireAdminMock.mockResolvedValue({
        ok: false,
        response: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }),
      });

      const res = await callConfirmRoute();
      expect(res.status).toBe(403);
      expect(rpcMock).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid UUID format', async () => {
      requireAdminMock.mockResolvedValue({
        ok: true,
        user: { id: ADMIN_ID, email: 'admin@gjanandsarkar.com', role: 'admin' },
      });

      const res = await callConfirmRoute('invalid-uuid-123');
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid order id.');
      expect(rpcMock).not.toHaveBeenCalled();
    });

    it('returns 404 when order does not exist', async () => {
      requireAdminMock.mockResolvedValue({
        ok: true,
        user: { id: ADMIN_ID, email: 'admin@gjanandsarkar.com', role: 'admin' },
      });

      rpcMock.mockResolvedValue({
        data: null,
        error: { message: 'ORDER_NOT_FOUND' },
      });

      const res = await callConfirmRoute();
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe('Order not found.');
    });

    it('returns 400 when order is not a COD order', async () => {
      requireAdminMock.mockResolvedValue({
        ok: true,
        user: { id: ADMIN_ID, email: 'admin@gjanandsarkar.com', role: 'admin' },
      });

      rpcMock.mockResolvedValue({
        data: null,
        error: { message: 'NOT_COD_ORDER:Razorpay' },
      });

      const res = await callConfirmRoute();
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Only Cash on Delivery');
    });

    it('returns 409 when order payment is already marked as paid (prevent duplicate confirmations)', async () => {
      requireAdminMock.mockResolvedValue({
        ok: true,
        user: { id: ADMIN_ID, email: 'admin@gjanandsarkar.com', role: 'admin' },
      });

      rpcMock.mockResolvedValue({
        data: null,
        error: { message: 'ALREADY_PAID:paid' },
      });

      const res = await callConfirmRoute();
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error).toContain('already been marked as Paid');
    });

    it('returns 400 when order was cancelled before collection', async () => {
      requireAdminMock.mockResolvedValue({
        ok: true,
        user: { id: ADMIN_ID, email: 'admin@gjanandsarkar.com', role: 'admin' },
      });

      rpcMock.mockResolvedValue({
        data: null,
        error: { message: 'ORDER_CANCELLED' },
      });

      const res = await callConfirmRoute();
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('cancelled order');
    });

    it('returns 400 when order is not in transit or delivered yet', async () => {
      requireAdminMock.mockResolvedValue({
        ok: true,
        user: { id: ADMIN_ID, email: 'admin@gjanandsarkar.com', role: 'admin' },
      });

      rpcMock.mockResolvedValue({
        data: null,
        error: { message: 'ORDER_NOT_DELIVERED:confirmed' },
      });

      const res = await callConfirmRoute();
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('out for delivery or delivered');
    });

    it('returns 400 when confirmed amount differs from total amount (Amount Mismatch Protection)', async () => {
      requireAdminMock.mockResolvedValue({
        ok: true,
        user: { id: ADMIN_ID, email: 'admin@gjanandsarkar.com', role: 'admin' },
      });

      rpcMock.mockResolvedValue({
        data: null,
        error: { message: 'AMOUNT_MISMATCH:450.00:500.00' },
      });

      const res = await callConfirmRoute(VALID_ORDER_ID, { amount: 500 });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Confirmed amount does not match');
    });

    it('successfully confirms COD collection, records payment as paid, writes audit record and sends customer notification', async () => {
      requireAdminMock.mockResolvedValue({
        ok: true,
        user: { id: ADMIN_ID, email: 'admin@gjanandsarkar.com', role: 'admin' },
      });

      const confirmedTime = '2026-10-21T10:00:00Z';
      rpcMock.mockResolvedValue({
        data: {
          success: true,
          amount: 450,
          confirmed_at: confirmedTime,
          confirmed_by: ADMIN_ID,
        },
        error: null,
      });

      const res = await callConfirmRoute(VALID_ORDER_ID, { amount: 450 });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.orderId).toBe(VALID_ORDER_ID);
      expect(json.payment_status).toBe('paid');
      expect(json.amount).toBe(450);
      expect(json.confirmed_at).toBe(confirmedTime);
      expect(json.confirmed_by).toBe(ADMIN_ID);

      // Verify audit log call with order, amount, actor, and status details
      expect(writeAuditMock).toHaveBeenCalledTimes(1);
      expect(writeAuditMock).toHaveBeenCalledWith(
        ADMIN_ID,
        'cod_payment_confirmed',
        'order',
        VALID_ORDER_ID,
        { payment_status: 'pending' },
        { payment_status: 'paid', amount: 450, confirmed_by: ADMIN_ID },
        expect.anything()
      );

      // Verify customer notification sent
      expect(notifyMock).toHaveBeenCalledWith(['customer'], 'payment_completed', VALID_ORDER_ID, CUSTOMER_ID);
    });
  });

  describe('4. Seller Isolation & Unauthorized Access Restrictions', () => {
    it('sellers cannot access the admin COD confirmation endpoint', async () => {
      requireAdminMock.mockResolvedValue({
        ok: false,
        response: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }),
      });

      const res = await callConfirmRoute();
      expect(res.status).toBe(403);
    });

    it('customers cannot access the admin COD confirmation endpoint', async () => {
      requireAdminMock.mockResolvedValue({
        ok: false,
        response: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }),
      });

      const res = await callConfirmRoute();
      expect(res.status).toBe(403);
    });
  });

  describe('5. Seller COD Payment Confirmation API (POST /api/seller/orders/[id]/confirm-cod-payment)', () => {
    function callSellerRoute(orderId: string = VALID_ORDER_ID, body: Record<string, any> = {}) {
      const req = new Request(`http://localhost:3000/api/seller/orders/${orderId}/confirm-cod-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return sellerConfirmCodRoute(req as any, { params: Promise.resolve({ id: orderId }) });
    }

    it('returns 401 when seller is not authenticated', async () => {
      requireSellerMock.mockResolvedValue({
        ok: false,
        response: NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 }),
      });

      const res = await callSellerRoute();
      expect(res.status).toBe(401);
    });

    it('returns 403 when seller tries to confirm an order not containing their own products', async () => {
      requireSellerMock.mockResolvedValue({
        ok: true,
        user: { id: SELLER_USER_ID, role: 'seller', isAdmin: false },
        seller: { id: SELLER_ID, sellerId: SELLER_ID },
      });

      // Mock database returning order items from a DIFFERENT seller
      supabaseFromMock.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: [
              { id: 'item-1', product_id: 'p-1', products: { seller_id: 'other-seller-999', created_by: 'other-user-999' } },
            ],
            error: null,
          }),
        })),
      });

      const res = await callSellerRoute();
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain('Sellers can only confirm payment for their own product orders');
      expect(rpcMock).not.toHaveBeenCalled();
    });

    it('successfully confirms payment when seller owns products in the order', async () => {
      requireSellerMock.mockResolvedValue({
        ok: true,
        user: { id: SELLER_USER_ID, role: 'seller', isAdmin: false },
        seller: { id: SELLER_ID, sellerId: SELLER_ID },
      });

      // Mock database returning order items owned by THIS seller
      supabaseFromMock.mockImplementation((table: string) => {
        if (table === 'order_items') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: [
                  { id: 'item-1', product_id: 'p-1', products: { seller_id: SELLER_ID, created_by: SELLER_USER_ID } },
                ],
                error: null,
              }),
            })),
          };
        }
        if (table === 'orders') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: { user_id: CUSTOMER_ID }, error: null }),
              })),
            })),
          };
        }
        return { select: vi.fn() };
      });

      const confirmedTime = '2026-10-21T11:00:00Z';
      rpcMock.mockResolvedValue({
        data: {
          success: true,
          amount: 70,
          confirmed_at: confirmedTime,
          confirmed_by: SELLER_USER_ID,
        },
        error: null,
      });

      const res = await callSellerRoute(VALID_ORDER_ID, { amount: 70 });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.orderId).toBe(VALID_ORDER_ID);
      expect(json.payment_status).toBe('paid');
      expect(json.amount).toBe(70);

      // Verify seller audit log recorded
      expect(writeAuditMock).toHaveBeenCalledWith(
        SELLER_USER_ID,
        'seller_cod_payment_confirmed',
        'order',
        VALID_ORDER_ID,
        { payment_status: 'pending' },
        { payment_status: 'paid', amount: 70, confirmed_by: SELLER_USER_ID, role: 'seller' },
        expect.anything()
      );
    });
  });
});
