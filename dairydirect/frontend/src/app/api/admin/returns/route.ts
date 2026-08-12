/**
 * GET/POST/PUT /api/admin/returns
 * Returns & refund management with dual RDS + Supabase fallback.
 * Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, isPgConfigured } from '@/lib/aws/rds';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { supabaseAdmin } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

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

    if (isPgConfigured) {
      try {
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
          returns: result.rows || [],
          total: parseInt(countResult.rows[0]?.count || '0'),
        });
      } catch (err) {
        console.warn('[RDS Returns Fallback to Supabase]:', err);
      }
    }

    // Direct Supabase Query
    if (!supabaseAdmin) {
      return NextResponse.json({ returns: [], total: 0 });
    }

    let sbQuery = supabaseAdmin
      .from('return_requests')
      .select('*, orders(order_number, total_amount, payment_method), profiles:user_id(name, email, phone)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && ['pending', 'approved', 'rejected', 'refunded'].includes(status)) {
      sbQuery = sbQuery.eq('status', status);
    }

    const { data: returnsData, error } = await sbQuery;
    if (error) {
      // If return_requests table doesn't exist yet, return empty list gracefully
      return NextResponse.json({ returns: [], total: 0 });
    }

    const formatted = (returnsData || []).map((r: any) => ({
      id: r.id,
      order_id: r.order_id,
      order_number: r.orders?.order_number || 'N/A',
      order_total: Number(r.orders?.total_amount || 0),
      reason: r.reason,
      description: r.description,
      status: r.status,
      refund_amount: r.refund_amount,
      admin_notes: r.admin_notes,
      created_at: r.created_at,
      customer_name: r.profiles?.name || 'Customer',
      customer_email: r.profiles?.email || '',
      customer_phone: r.profiles?.phone || '',
      payment_method: r.orders?.payment_method || 'Razorpay',
    }));

    return NextResponse.json({
      returns: formatted,
      total: formatted.length,
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

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('user_id, status, total_amount')
      .eq('id', orderId)
      .maybeSingle();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.user_id !== auth.userId && !auth.isAdmin) {
      return NextResponse.json({ error: 'You can only return your own orders' }, { status: 403 });
    }

    const { data: newReturn, error: insertErr } = await supabaseAdmin
      .from('return_requests')
      .insert({
        order_id: orderId,
        user_id: auth.userId,
        reason,
        description: description || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, returnRequest: newReturn });
  } catch (error: any) {
    console.error('[Returns POST] Error:', error.message);
    return NextResponse.json({ error: 'Failed to submit return request' }, { status: 500 });
  }
}

// ─── PUT — Admin: Process return request ───────────────────────
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, action, refundAmount, adminNotes } = body;

    if (!id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid return action' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const { data: updated, error } = await supabaseAdmin
      .from('return_requests')
      .update({
        status: newStatus,
        refund_amount: refundAmount ? parseFloat(refundAmount) : null,
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, returnRequest: updated });
  } catch (error: any) {
    console.error('[Returns PUT] Error:', error.message);
    return NextResponse.json({ error: 'Failed to process return request' }, { status: 500 });
  }
}
