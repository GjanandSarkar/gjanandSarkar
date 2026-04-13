import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import crypto from 'crypto';

function getTokenHash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateSubId(): string {
  return `SUB-${Math.floor(100 + Math.random() * 900)}`;
}

function generateRepId(): string {
  return `REP-${Math.floor(1000 + Math.random() * 9000)}`;
}

async function verifySession(token: string | null): Promise<{ userId: string; isAdmin: boolean } | null> {
  if (!token || token === 'new_user') return null;
  
  const tokenHash = getTokenHash(token);
  const { data: session } = await supabaseAdmin
    .from('sessions')
    .select('user_id, expires_at')
    .eq('token_hash', tokenHash)
    .single();

  if (!session) return null;
  
  const expiresAt = new Date(session.expires_at);
  if (new Date() > expiresAt) return null;
  
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', session.user_id)
    .single();

  return {
    userId: session.user_id,
    isAdmin: profile?.role === 'admin'
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    const auth = await verifySession(token);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabaseAdmin
      .from('subscriptions')
      .select('*, products(*), profiles:user_id(name, phone)')
      .order('created_at', { ascending: false });

    if (!auth.isAdmin) {
      query = query.eq('user_id', auth.userId).neq('status', 'Cancelled');
    }

    const { data, error } = await query;

    if (error) {
      console.error('getSubscriptions error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ subscriptions: data });
  } catch (error) {
    console.error('Subscriptions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, userId, productId, volume, plan } = body;

    const auth = await verifySession(token);
    if (!auth || auth.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subId = generateSubId();
    const nextDeliveryDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const { error } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        id: subId,
        user_id: userId,
        product_id: productId,
        volume,
        plan,
        status: 'Active',
        next_delivery_date: nextDeliveryDate,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      role_target: 'customer',
      title: 'Subscription Active! 🥛',
      body: `Your daily milk subscription (${subId}) starts tomorrow, 7–9 AM.`,
      type: 'subscription',
      related_id: subId,
    });

    return NextResponse.json({ success: true, id: subId });
  } catch (error) {
    console.error('Subscriptions POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, subId, action, newVolume, newPlan } = body;

    const auth = await verifySession(token);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'pause' || action === 'resume') {
      const { data: current } = await supabaseAdmin
        .from('subscriptions')
        .select('status')
        .eq('id', subId)
        .single();

      const newStatus = current?.status === 'Paused' ? 'Active' : 'Paused';
      
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({ status: newStatus })
        .eq('id', subId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (action === 'cancel') {
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'Cancelled' })
        .eq('id', subId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (action === 'modify' && newVolume && newPlan) {
      const repId = generateRepId();

      await supabaseAdmin.from('modification_reports').insert({
        id: repId,
        subscription_id: subId,
        user_id: auth.userId,
        new_volume: newVolume,
        new_plan: newPlan,
        status: 'Pending',
      });

      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'Pending Review' })
        .eq('id', subId);

      await supabaseAdmin.from('notifications').insert({
        role_target: 'admin',
        title: 'Modification Request',
        body: `A customer requested to modify subscription ${subId}.`,
        type: 'subscription',
        related_id: subId,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Subscriptions PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}