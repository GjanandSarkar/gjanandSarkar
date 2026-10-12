import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { getCachedSellerProfile, cacheSellerProfile, invalidateSellerProfileCache } from '@/lib/aws/redis';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      userId,
      storeName,
      slug,
      state,
      category,
      description,
      plan,
      commissionRate,
      status,
      gstin,
      pan,
      bankAccount,
      ifscCode,
      fssaiNumber,
      logoUrl,
      bannerUrl,
    } = body;

    // A user can only create a store for themselves unless they are an admin
    if (userId !== auth.userId && !auth.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const targetUserId = userId || auth.userId;
    if (!targetUserId || !storeName) {
      return NextResponse.json({ error: 'User ID and Store Name are required' }, { status: 400 });
    }

    const sb = getAdminSupabase();

    // Check if seller record already exists
    const { data: existingStore } = await sb
      .from('sellers')
      .select('id, status')
      .eq('user_id', targetUserId)
      .maybeSingle();

    const initialStatus = status || existingStore?.status || 'active';
    const storeSlug = slug || storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const sellerPayload: any = {
      user_id: targetUserId,
      store_name: storeName.trim(),
      slug: storeSlug,
      state: state || 'Gujarat',
      category: category || 'General',
      description: description || '',
      plan: plan || 'growth',
      commission_rate: commissionRate !== undefined ? Number(commissionRate) : 5.0,
      status: initialStatus,
      gstin: gstin || null,
      pan: pan || null,
      bank_account: bankAccount || null,
      ifsc_code: ifscCode || null,
      fssai_number: fssaiNumber || null,
      updated_at: new Date().toISOString(),
    };

    if (logoUrl !== undefined) sellerPayload.logo_url = logoUrl;
    if (bannerUrl !== undefined) sellerPayload.banner_url = bannerUrl;

    const { data: store, error } = await sb
      .from('sellers')
      .upsert(sellerPayload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('[Sellers POST] Supabase upsert error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update profile role to seller
    await sb
      .from('profiles')
      .update({ role: 'seller' })
      .eq('id', targetUserId);

    // Audit log in seller_status_history
    try {
      await sb.from('seller_status_history').insert({
        seller_id: store.id,
        previous_status: existingStore?.status || null,
        new_status: initialStatus,
        action: existingStore ? 'store_updated' : 'store_created',
        reason: 'Seller profile saved via application',
        notes: `Store '${store.store_name}' live configuration saved`,
        changed_by: auth.userId,
      });
    } catch (historyErr) {
      console.warn('[Sellers POST] Status history audit warning:', historyErr);
    }

    // Invalidate cached seller profile so fresh store data is served immediately
    await invalidateSellerProfileCache(targetUserId);

    return NextResponse.json({ success: true, store });
  } catch (err: any) {
    console.error('[Sellers POST] Exception:', err.message);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  const sb = getAdminSupabase();

  // ─── Case 1: Fetch single seller dashboard & live data for a specific user ───
  if (userId) {
    try {
      const isFresh = searchParams.get('fresh') === 'true' || request.headers.get('cache-control')?.includes('no-cache');
      // Check cache first (scoped by userId) only if fresh is not requested
      if (!isFresh) {
        const cached = await getCachedSellerProfile(userId);
        if (cached) {
          return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } });
        }
      }

      const { data: store, error } = await sb
        .from('sellers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ store: null });
      }

      if (store) {
        // 1. Fetch live product IDs for this seller from seller_product & products
        const { data: sellerProds } = await sb
          .from('seller_product')
          .select('id, product_id, stock, status')
          .or(`seller_id.eq.${store.id},seller_user_id.eq.${userId}`);

        const { data: mainProds } = await sb
          .from('products')
          .select('id, is_active')
          .or(`seller_id.eq.${store.id},created_by.eq.${userId}`);

        const allProductIds = new Set<string>();
        sellerProds?.forEach((sp: any) => {
          if (sp.product_id) allProductIds.add(sp.product_id);
        });
        mainProds?.forEach((mp: any) => {
          if (mp.id) allProductIds.add(mp.id);
        });

        const activeProductCount = (sellerProds?.filter((p: any) => p.status === 'active')?.length || 0) +
          (mainProds?.filter((p: any) => p.is_active)?.length || 0);

        // 2. Fetch live orders and order items for this seller
        let grossRevenue = 0;
        let totalOrdersCount = 0;
        let pendingDeliveriesCount = 0;
        const recentOrdersFormatted: any[] = [];
        const seenOrderIds = new Set<string>();

        if (allProductIds.size > 0 || store.id) {
          const productIdsArray = Array.from(allProductIds);
          
          let oiQuery = sb
            .from('order_items')
            .select(`
              id,
              order_id,
              product_id,
              quantity,
              price,
              orders (
                id,
                order_number,
                total_amount,
                status,
                payment_status,
                created_at,
                profiles:user_id (name, email)
              )
            `);

          if (productIdsArray.length > 0) {
            oiQuery = oiQuery.or(`seller_id.eq.${store.id},product_id.in.(${productIdsArray.join(',')})`);
          } else {
            oiQuery = oiQuery.eq('seller_id', store.id);
          }

          const { data: orderItems } = await oiQuery;

          if (orderItems && orderItems.length > 0) {
            // Group by order_id
            const orderMap = new Map<string, { order: any; itemsCount: number; sellerTotal: number }>();

            orderItems.forEach((oi: any) => {
              const o = oi.orders;
              if (!o) return;
              if (['cancelled', 'refunded', 'returned'].includes(o.status)) return;

              const itemTotal = Number(oi.price || 0) * Number(oi.quantity || 1);
              if (o.payment_status === 'paid' || o.status === 'delivered') {
                grossRevenue += itemTotal;
              }

              if (!orderMap.has(o.id)) {
                orderMap.set(o.id, {
                  order: o,
                  itemsCount: Number(oi.quantity || 1),
                  sellerTotal: itemTotal,
                });
                seenOrderIds.add(o.id);
              } else {
                const existing = orderMap.get(o.id)!;
                existing.itemsCount += Number(oi.quantity || 1);
                existing.sellerTotal += itemTotal;
              }
            });

            totalOrdersCount = orderMap.size;

            // Sort orders descending by created_at and format top 10
            const sortedOrders = Array.from(orderMap.values()).sort(
              (a, b) => new Date(b.order.created_at).getTime() - new Date(a.order.created_at).getTime()
            );

            sortedOrders.slice(0, 10).forEach((entry) => {
              const o = entry.order;
              if (o.status !== 'delivered') {
                pendingDeliveriesCount++;
              }
              recentOrdersFormatted.push({
                id: o.order_number || `ORD-${o.id.substring(0, 8).toUpperCase()}`,
                customerName: o.profiles?.name || o.profiles?.email || 'Customer',
                itemsCount: entry.itemsCount,
                amount: Math.round(entry.sellerTotal),
                status: o.status || 'processing',
                date: new Date(o.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }),
              });
            });
          }
        }

        // If store.total_sales was tracked directly in table, ensure non-zero fallback
        const finalGrossRevenue = Math.max(grossRevenue, Number(store.total_sales || 0));
        const commissionRate = Number(store.commission_rate || 5.0);
        const platformCommission = finalGrossRevenue * (commissionRate / 100);
        const netPayout = Math.max(0, finalGrossRevenue - platformCommission);

        // 3. Fetch live payout history from seller_payouts table
        const { data: payouts } = await sb
          .from('seller_payouts')
          .select('*')
          .eq('seller_id', store.id)
          .order('payout_date', { ascending: false })
          .limit(10);

        const payoutHistoryFormatted = (payouts || []).map((p: any) => ({
          id: p.reference_no || `PAY-${p.id.substring(0, 8).toUpperCase()}`,
          amount: Number(p.amount || 0),
          fee: Number(p.fee_deducted || 0),
          net: Number(p.net_amount || 0),
          status: p.status || 'completed',
          date: new Date(p.payout_date || p.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
        }));

        const responseData = {
          store: {
            id: store.id,
            storeName: store.store_name,
            slug: store.slug,
            state: store.state,
            category: store.category,
            description: store.description,
            logoUrl: store.logo_url,
            bannerUrl: store.banner_url,
            plan: store.plan,
            commissionRate: store.commission_rate,
            status: store.status,
            totalSales: finalGrossRevenue,
            gstin: store.gstin,
            pan: store.pan,
            bankAccount: store.bank_account,
            ifscCode: store.ifsc_code,
            fssaiNumber: store.fssai_number,
            review_started_at: store.review_started_at || null,
            review_expires_at: store.review_expires_at || null,
            review_reason: store.review_reason || null,
            deactivation_reason: store.deactivation_reason || null,
            reactivation_reason: store.reactivation_reason || null,
          },
          metrics: {
            grossRevenue: Math.round(finalGrossRevenue),
            platformCommission: Math.round(platformCommission),
            netPayout: Math.round(netPayout),
            totalOrders: totalOrdersCount,
            totalProducts: activeProductCount,
            pendingDeliveries: pendingDeliveriesCount,
          },
          recentOrders: recentOrdersFormatted,
          payoutHistory: payoutHistoryFormatted,
        };

        // Cache the non-sensitive seller dashboard data
        cacheSellerProfile(userId, responseData).catch(() => {});
        return NextResponse.json(responseData, { headers: { 'X-Cache': 'MISS' } });
      }

      // Check if user has an inquiry submitted
      const { data: inquiry } = await sb
        .from('seller_inquiries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return NextResponse.json({
        store: null,
        inquiry: inquiry || null,
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
      console.error('[Sellers GET single] Error:', err.message);
      return NextResponse.json({ error: err.message || 'Failed to fetch seller' }, { status: 500 });
    }
  }

  // ─── Case 2: Fetch all sellers (Admin directory or Marketplace list) ───
  try {
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const state = searchParams.get('state');
    const search = searchParams.get('search');
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50', 10));
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = sb
      .from('sellers')
      .select('*, profiles:user_id(name, email, phone, avatar_url)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (category && category !== 'all') {
      query = query.ilike('category', `%${category}%`);
    }
    if (state && state !== 'all') {
      query = query.ilike('state', `%${state}%`);
    }
    if (search) {
      query = query.or(`store_name.ilike.%${search}%,description.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const { data: sellers, error, count } = await query;

    if (error) {
      console.error('[Sellers GET list] Error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      sellers: sellers || [],
      total: count || (sellers || []).length,
      limit,
      offset,
    });
  } catch (err: any) {
    console.error('[Sellers GET list] Exception:', err.message);
    return NextResponse.json({ error: err.message || 'Failed to fetch sellers list' }, { status: 500 });
  }
}
