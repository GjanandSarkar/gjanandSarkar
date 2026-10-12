import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { getAdminSupabase } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    const body = await request.json().catch(() => ({}));
    const { subject, message, orderId, priority = 'normal', name, email, phone, userId } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    const admin = getAdminSupabase();

    // ─── 1. Resolve User ID Safely ──────────────────────────────────────────
    const candidateUserId = auth?.userId || userId || null;
    let finalUserId: string | null = null;

    if (candidateUserId) {
      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .eq('id', candidateUserId)
        .maybeSingle();

      if (profile) {
        finalUserId = profile.id;
      }
    }

    // ─── 2. Resolve Order ID Safely ─────────────────────────────────────────
    let finalOrderId: string | null = null;
    let orderRefNote = '';

    if (orderId && typeof orderId === 'string' && orderId.trim()) {
      const trimmed = orderId.trim();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      if (uuidRegex.test(trimmed)) {
        const { data: orderById } = await admin
          .from('orders')
          .select('id')
          .eq('id', trimmed)
          .maybeSingle();

        if (orderById) {
          finalOrderId = orderById.id;
        } else {
          orderRefNote = `\n[Referenced Order UUID: ${trimmed}]`;
        }
      } else {
        // Try matching against order_number
        const { data: orderByNum } = await admin
          .from('orders')
          .select('id')
          .ilike('order_number', trimmed)
          .maybeSingle();

        if (orderByNum) {
          finalOrderId = orderByNum.id;
        } else {
          orderRefNote = `\n[Referenced Order Number: ${trimmed}]`;
        }
      }
    }

    // ─── 3. Validate Priority ───────────────────────────────────────────────
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    const safePriority = validPriorities.includes(priority) ? priority : 'normal';

    // ─── 4. Compile Message with Contact / Meta Info ────────────────────────
    let compiledMessage = message.trim();
    const contactParts: string[] = [];
    if (name?.trim()) contactParts.push(`Name: ${name.trim()}`);
    if (email?.trim()) contactParts.push(`Email: ${email.trim()}`);
    if (phone?.trim()) contactParts.push(`Phone: ${phone.trim()}`);

    if (contactParts.length > 0) {
      compiledMessage = `[Customer Info: ${contactParts.join(' | ')}]\n\n${compiledMessage}`;
    }
    if (orderRefNote) {
      compiledMessage = `${compiledMessage}${orderRefNote}`;
    }

    // ─── 5. Insert Ticket Into Database ─────────────────────────────────────
    const { data, error } = await admin
      .from('support_tickets')
      .insert({
        user_id: finalUserId,
        order_id: finalOrderId,
        subject: subject.trim(),
        message: compiledMessage,
        priority: safePriority,
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      console.error('[support/tickets POST] DB insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, ticket: data });
  } catch (err: any) {
    console.error('[support/tickets POST] Handler error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');

    const admin = getAdminSupabase();

    if (auth?.isAdmin) {
      // Admin sees all tickets or filters by user
      let query = admin
        .from('support_tickets')
        .select('*, profiles(name, email, phone)')
        .order('created_at', { ascending: false });

      if (userIdParam) {
        query = query.eq('user_id', userIdParam);
      }

      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json({ success: true, tickets: data || [] });
    }

    const targetUserId = auth?.userId || userIdParam;
    if (!targetUserId) {
      return NextResponse.json({ success: true, tickets: [] });
    }

    // Customer sees their own tickets
    const { data, error } = await admin
      .from('support_tickets')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, tickets: data || [] });
  } catch (err: any) {
    console.error('[support/tickets GET] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
