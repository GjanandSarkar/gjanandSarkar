import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { getAdminSupabase } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { subject, message, orderId, priority = 'normal' } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    const admin = getAdminSupabase();
    const { data, error } = await admin
      .from('support_tickets')
      .insert({
        user_id: auth.userId,
        order_id: orderId || null,
        subject,
        message,
        priority
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ ticket: data });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = getAdminSupabase();
    
    if (auth.isAdmin) {
      // Admin sees all
      const { data, error } = await admin.from('support_tickets').select('*, profiles(name, email, phone)').order('created_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ tickets: data });
    } else {
      // Customer sees theirs
      const { data, error } = await admin.from('support_tickets').select('*').eq('user_id', auth.userId).order('created_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ tickets: data });
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
