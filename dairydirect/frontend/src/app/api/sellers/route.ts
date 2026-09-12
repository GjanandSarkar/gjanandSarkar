import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getAuthUser } from '@/lib/api/auth-middleware';

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, storeName, slug, state, category, description, plan, commissionRate, gstin, pan, bankAccount, ifscCode } = body;

    // A user can only create a store for themselves unless they are an admin
    if (userId !== auth.userId && !auth.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!userId || !storeName) {
      return NextResponse.json({ error: 'User ID and Store Name are required' }, { status: 400 });
    }

    const sb = getAdminSupabase();
    const { data: store, error } = await sb
      .from('sellers')
      .upsert({
        user_id: userId,
        store_name: storeName,
        slug: slug || storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        state: state || 'Gujarat',
        category: category || 'General',
        description: description || '',
        plan: plan || 'growth',
        commission_rate: commissionRate || 5.0,
        status: 'active',
        gstin: gstin || null,
        pan: pan || null,
        bank_account: bankAccount || null,
        ifsc_code: ifscCode || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update profile role to seller
    await sb
      .from('profiles')
      .update({ role: 'seller' })
      .eq('id', userId);

    return NextResponse.json({ success: true, store });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    const sb = getAdminSupabase();
    const { data: store, error } = await sb
      .from('sellers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ store: null });
    }

    if (store) {
      return NextResponse.json({
        store: {
          id: store.id,
          storeName: store.store_name,
          state: store.state,
          plan: store.plan,
          commissionRate: store.commission_rate,
          status: store.status,
          totalSales: store.total_sales || 0,
        },
        metrics: {
          grossRevenue: store.total_sales || 0,
          platformCommission: (store.total_sales || 0) * ((store.commission_rate || 5) / 100),
          netPayout: (store.total_sales || 0) * (1 - (store.commission_rate || 5) / 100),
          totalOrders: 0,
          totalProducts: 0,
          pendingDeliveries: 0,
        },
        recentOrders: [],
        payoutHistory: [],
      });
    }

    return NextResponse.json({
      store: null,
      metrics: {
        grossRevenue: 0,
        platformCommission: 0,
        netPayout: 0,
        totalOrders: 0,
        totalProducts: 0,
        pendingDeliveries: 0,
      },
      recentOrders: [],
      payoutHistory: [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch seller' }, { status: 500 });
  }
}
