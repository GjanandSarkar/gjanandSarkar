/**
 * GET/POST/PUT /api/admin/returns
 * Returns & refund management with dual AWS PostgreSQL + Supabase Fallback.
 * GET: List return requests (admin)
 * POST: Customer submits return
 * PUT: Admin processes (approve/reject)
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction, isPgConfigured } from '@/lib/aws/rds';
import { getAuthUser, getClientIP } from '@/lib/api/auth-middleware';
import { sendOrderStatusEmail } from '@/lib/aws/ses';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { writeAuditLog } from '@/lib/security/audit';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    if (isPgConfigured) {
      try {
        const conditions = ['1=1'];
        const params: any[] = [];
        let paramIdx = 1;

        if (status && ['pending', 'approved', 'rejected', 'refunded'].includes(status)) {
          conditions.push(`rr.status = $${paramIdx++}`);
          params.push(status);
        }

        const result = await query(
          `SELECT
             rr.*,
             o.order_number,
             o.total_amount as order_total,
             o.payment_method,
             p.name as customer_name,
             p.email as customer_email,
             p.phone as customer_phone
           FROM return_requests rr
           JOIN orders o ON o.id = rr.order_id
           JOIN profiles p ON p.id = rr.user_id
           WHERE ${conditions.join(' AND ')}
           ORDER BY rr.created_at DESC`,
          params
        );

        return NextResponse.json({
          returns: result.rows,
          total: result.rows.length,
        });
      } catch (err: any) {
        console.warn('[Returns GET] RDS failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    let sbQuery = sb.from('return_requests').select('*, orders(*), profiles(*)').order('created_at', { ascending: false });
    if (status && ['pending', 'approved', 'rejected', 'refunded'].includes(status)) {
      sbQuery = sbQuery.eq('status', status);
    }

    const { data, error } = await sbQuery;
    if (error) {
      return NextResponse.json({ returns: [], total: 0 });
    }

    return NextResponse.json({ returns: data || [], total: data?.length || 0 });
  } catch (error: any) {
    console.error('[Returns GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 });
  }
}

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

    if (isPgConfigured) {
      try {
        const orderResult = await query<{
          user_id: string;
          status: string;
          total_amount: string;
          delivered_at: string | null;
        }>('SELECT user_id, status, total_amount, delivered_at FROM orders WHERE id = $1', [orderId]);

        if (orderResult.rows.length === 0) {
          return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }
        const order = orderResult.rows[0];

        if (order.user_id !== auth.userId) {
          return NextResponse.json({ error: 'You can only return your own orders' }, { status: 403 });
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
      } catch (err: any) {
        console.warn('[Returns POST] RDS failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    const { data: order } = await sb.from('orders').select('user_id, status').eq('id', orderId).maybeSingle();
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.user_id !== auth.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: retData, error: retErr } = await sb
      .from('return_requests')
      .insert({
        order_id: orderId,
        user_id: auth.userId,
        reason,
        description: description || null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (retErr || !retData) {
      return NextResponse.json({ error: retErr?.message || 'Failed to submit return' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      returnId: retData.id,
      message: 'Return request submitted. We will process it within 24 hours.',
    });
  } catch (error: any) {
    console.error('[Returns POST] Error:', error.message);
    return NextResponse.json({ error: 'Failed to submit return request' }, { status: 500 });
  }
}

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
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    if (isPgConfigured) {
      try {
        await query(
          `UPDATE return_requests
           SET status = $1, refund_amount = $2, admin_notes = $3, 
               processed_at = now(), updated_at = now()
           WHERE id = $4`,
          [newStatus, refundAmount || null, adminNotes || null, returnId]
        );
        return NextResponse.json({ success: true, status: newStatus });
      } catch (err: any) {
        console.warn('[Returns PUT] RDS failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    await sb
      .from('return_requests')
      .update({
        status: newStatus,
        refund_amount: refundAmount || null,
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', returnId);

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error: any) {
    console.error('[Returns PUT] Error:', error.message);
    return NextResponse.json({ error: 'Failed to process return' }, { status: 500 });
  }
}
