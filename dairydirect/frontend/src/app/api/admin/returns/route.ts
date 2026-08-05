/**
 * GET/POST/PUT /api/admin/returns
 * Returns & refund management.
 * GET: List return requests (admin)
 * POST: Customer submits return
 * PUT: Admin processes (approve/reject)
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/aws/rds';
import { getAuthUser, getClientIP } from '@/lib/api/auth-middleware';
import { sendOrderStatusEmail } from '@/lib/aws/ses';
import { writeAuditLog } from '@/lib/security/audit';
import { z } from 'zod';

// ─── GET — Admin: List all return requests ────────────────────
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const conditions = ['1=1'];
    const params: any[] = [];
    let paramIdx = 1;

    if (status && ['pending', 'approved', 'rejected', 'refunded'].includes(status)) {
      conditions.push(`rr.status = $${paramIdx++}`);
      params.push(status);
    }

    params.push(limit, offset);

    const result = await query(
      `SELECT
         rr.*,
         o.order_number,
         o.total_amount as order_total,
         o.payment_method,
         o.payment_id,
         p.name as customer_name,
         p.email as customer_email,
         p.phone as customer_phone
       FROM return_requests rr
       JOIN orders o ON o.id = rr.order_id
       JOIN profiles p ON p.id = rr.user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY rr.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM return_requests rr WHERE ${conditions.join(' AND ')}`,
      params.slice(0, -2)
    );

    return NextResponse.json({
      returns: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error: any) {
    console.error('[Returns GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 });
  }
}

// ─── POST — Customer: Submit return request ────────────────────
const SubmitReturnSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.enum(['damaged', 'wrong_item', 'quality_issue', 'not_delivered', 'changed_mind', 'other']),
  description: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Please log in to submit a return' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = SubmitReturnSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const { orderId, reason, description } = parseResult.data;

    // Verify order belongs to user and is delivered
    const orderResult = await query<{
      user_id: string;
      status: string;
      total_amount: string;
      delivered_at: string | null;
    }>(
      'SELECT user_id, status, total_amount, delivered_at FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderResult.rows[0];

    if (order.user_id !== auth.userId) {
      return NextResponse.json({ error: 'You can only return your own orders' }, { status: 403 });
    }

    if (order.status !== 'delivered') {
      return NextResponse.json(
        { error: 'Returns can only be requested for delivered orders' },
        { status: 400 }
      );
    }

    // Check 48-hour return window
    if (order.delivered_at) {
      const hoursSinceDelivery = (Date.now() - new Date(order.delivered_at).getTime()) / 3600000;
      if (hoursSinceDelivery > 48) {
        return NextResponse.json(
          { error: 'Return window has closed. Returns must be requested within 48 hours of delivery.' },
          { status: 400 }
        );
      }
    }

    // Check no existing return for this order
    const existingReturn = await query(
      'SELECT id FROM return_requests WHERE order_id = $1 AND status NOT IN (\'rejected\')',
      [orderId]
    );
    if (existingReturn.rows.length > 0) {
      return NextResponse.json({ error: 'A return request already exists for this order' }, { status: 409 });
    }

    const returnResult = await query<{ id: string }>(
      `INSERT INTO return_requests (order_id, user_id, reason, description, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id`,
      [orderId, auth.userId, reason, description || null]
    );

    return NextResponse.json({
      success: true,
      returnId: returnResult.rows[0].id,
      message: 'Return request submitted. We will process it within 24 hours.',
    });
  } catch (error: any) {
    console.error('[Returns POST] Error:', error.message);
    return NextResponse.json({ error: 'Failed to submit return request' }, { status: 500 });
  }
}

// ─── PUT — Admin: Process return (approve/reject) ─────────────
const ProcessReturnSchema = z.object({
  returnId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  refundAmount: z.number().positive().optional(),
  adminNotes: z.string().max(500).optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = ProcessReturnSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const { returnId, action, refundAmount, adminNotes } = parseResult.data;

    // Get return request details
    const returnResult = await query<{
      id: string;
      order_id: string;
      user_id: string;
      status: string;
    }>(
      'SELECT id, order_id, user_id, status FROM return_requests WHERE id = $1',
      [returnId]
    );

    if (returnResult.rows.length === 0) {
      return NextResponse.json({ error: 'Return request not found' }, { status: 404 });
    }

    const returnReq = returnResult.rows[0];
    if (returnReq.status !== 'pending') {
      return NextResponse.json({ error: 'Return request already processed' }, { status: 409 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    await query(
      `UPDATE return_requests
       SET status = $1, refund_amount = $2, admin_notes = $3, 
           processed_by = $4, processed_at = now(), updated_at = now()
       WHERE id = $5`,
      [newStatus, refundAmount || null, adminNotes || null, auth.userId, returnId]
    );

    // Notify customer
    const profileResult = await query<{ name: string | null; email: string | null }>(
      'SELECT name, email FROM profiles WHERE id = $1',
      [returnReq.user_id]
    );
    const profile = profileResult.rows[0];

    if (profile?.email) {
      await sendOrderStatusEmail({
        to: profile.email,
        customerName: profile.name || 'Customer',
        orderId: returnReq.order_id,
        status: action === 'approve' ? 'confirmed' : 'cancelled',
        message: action === 'approve'
          ? `Your return request has been approved. ${refundAmount ? `Refund of ₹${refundAmount} will be processed in 3-5 business days.` : 'Our team will contact you shortly.'}`
          : `Your return request has been reviewed. ${adminNotes || 'Unfortunately, we cannot process this return.'}`,
      });
    }

    await writeAuditLog({
      adminId: auth.userId,
      action: action === 'approve' ? 'return.approve' : 'return.reject',
      resourceType: 'return_request',
      resourceId: returnId,
      details: { refundAmount, adminNotes },
      ipAddress: getClientIP(request),
    });

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error: any) {
    console.error('[Returns PUT] Error:', error.message);
    return NextResponse.json({ error: 'Failed to process return' }, { status: 500 });
  }
}
