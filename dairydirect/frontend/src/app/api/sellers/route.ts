import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, storeName, slug, state, category, description, plan, commissionRate, gstin, pan, bankAccount, ifscCode } = body;

    if (!userId || !storeName) {
      return NextResponse.json({ error: 'User ID and Store Name are required' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    // Try inserting into sellers table
    const { data: store, error } = await supabaseAdmin
      .from('sellers')
      .upsert({
        user_id: userId,
        store_name: storeName.trim(),
        slug: slug || storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
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
      console.error('Supabase seller insert error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update profile role to seller
    await supabaseAdmin
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

  if (!supabaseAdmin) {
    return NextResponse.json({
      store: null,
      products: [],
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
  }

  try {
    // 1. Fetch store info from sellers table for this authenticated user
    const { data: store } = await supabaseAdmin
      .from('sellers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!store) {
      // User is not an approved seller with a store
      return NextResponse.json({
        store: null,
        products: [],
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
    }

    // 2. Fetch live products for this seller from database
    const { data: dbProducts } = await supabaseAdmin
      .from('products')
      .select('*, product_variants(*)')
      .or(`seller_id.eq.${store.id},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    const rawProducts = dbProducts || [];
    const liveProducts = rawProducts.map((p) => {
      const v0 = p.product_variants?.[0];
      const totalStock = p.product_variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) ?? 0;
      return {
        id: p.id,
        name: p.name,
        category: p.category || 'Dairy & Essentials',
        price: v0?.price ?? 0,
        stock: totalStock,
        status: totalStock > 10 ? 'In Stock' : totalStock > 0 ? 'Low Stock' : 'Out of Stock',
        rating: p.rating || 5.0,
        image_url: p.image_url || '/milk.png',
      };
    });

    // 3. Fetch live orders for this seller from database
    const { data: dbOrders } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    const recentOrders = (dbOrders && dbOrders.length > 0)
      ? dbOrders.map((o) => ({
          id: o.id,
          customerName: o.customer_name || 'Customer',
          itemsCount: o.items_count || 1,
          amount: Number(o.total_amount || 0),
          status: o.status || 'confirmed',
          date: new Date(o.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }),
        }))
      : [];

    const grossRev = Number(store.total_revenue || store.total_sales || 0);
    const commRate = Number(store.commission_rate || 5.0);
    const platformComm = Math.round(grossRev * (commRate / 100));
    const netPayout = grossRev - platformComm;

    return NextResponse.json({
      store: {
        id: store.id,
        storeName: store.store_name,
        state: store.state,
        plan: store.plan,
        commissionRate: commRate,
        status: store.status,
        totalSales: grossRev,
      },
      products: liveProducts,
      metrics: {
        grossRevenue: grossRev,
        platformCommission: platformComm,
        netPayout: netPayout,
        totalOrders: recentOrders.length,
        totalProducts: liveProducts.length,
        pendingDeliveries: (dbOrders || []).filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length,
      },
      recentOrders,
      payoutHistory: [],
    });
  } catch (err: any) {
    console.error('api/sellers GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
