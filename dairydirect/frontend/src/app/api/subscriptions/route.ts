import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 20, // 20 requests per minute per IP
});
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabaseAdmin
      .from('subscriptions')
      .select('*, products:product_id(*), product_variants:variant_id(*), profiles:user_id(name, phone)')
      .order('created_at', { ascending: false });

    if (!auth.isAdmin) {
      query = query.eq('user_id', auth.userId).neq('status', 'cancelled');
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
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    try {
      await limiter.check(5, ip); // Max 5 subscription creations per minute per IP
    } catch {
      return NextResponse.json({ error: 'Too Many Requests. Please try again later.' }, { status: 429 });
    }

    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, productId, volume, plan, startDate } = body;

    if (auth.userId !== userId && !auth.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const nextDeliveryDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const { data: newSub, error } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        product_id: productId,
        volume,
        plan,
        status: 'active',
        start_date: startDate,
        next_delivery_date: nextDeliveryDate,
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const subId = newSub.id;

    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      role_target: 'customer',
      title: 'Subscription Active! 🥛',
      message: `Your daily milk subscription starts tomorrow, 7–9 AM.`,
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
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subId, action, newVolume, newPlan } = body;

    if (action === 'cancel') {
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (action === 'modify' && newVolume && newPlan) {
      await supabaseAdmin.from('modification_reports').insert({
        subscription_id: subId,
        user_id: auth.userId,
        new_volume: newVolume,
        new_plan: newPlan,
        action: 'Update',
      });

      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'pending_review' })
        .eq('id', subId);

      await supabaseAdmin.from('notifications').insert({
        role_target: 'admin',
        title: 'Modification Request',
        message: `A customer requested to modify subscription ${subId}.`,
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
