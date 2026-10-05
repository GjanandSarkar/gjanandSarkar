import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { query, isPgConfigured } from '@/lib/aws/rds';
import { getCachedSellerAnalytics, cacheSellerAnalytics } from '@/lib/aws/redis';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth || (auth.role !== 'seller' && auth.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sellerIdParam = searchParams.get('sellerId');

    const admin = getAdminSupabase();
    
    // Enforce seller ownership or admin delegation
    let storeQuery = admin.from('sellers').select('id, user_id, commission_rate, total_sales');
    if (auth.role === 'admin' && sellerIdParam) {
      storeQuery = storeQuery.eq('id', sellerIdParam);
    } else {
      storeQuery = storeQuery.eq('user_id', auth.userId);
    }

    const { data: store, error } = await storeQuery.maybeSingle();

    if (error || !store) {
      return NextResponse.json({ error: 'Seller store not found' }, { status: 404 });
    }

    // Check cache (authorization + store ownership verified above)
    const cachedAnalytics = await getCachedSellerAnalytics(store.id);
    if (cachedAnalytics) {
      return NextResponse.json(cachedAnalytics, { headers: { 'X-Cache': 'HIT' } });
    }

    let grossRevenue = 0;
    let totalOrders = 0;
    let pendingDeliveries = 0;
    let totalProducts = 0;

    if (isPgConfigured) {
      // Real database analytics
      const prodRes = await query(
        `SELECT count(DISTINCT id) as count FROM (
           SELECT id FROM products WHERE seller_id = $1 OR created_by = $2
           UNION
           SELECT id FROM seller_product WHERE seller_id = $1 OR seller_user_id = $2
         ) p`,
        [store.id, store.user_id]
      );
      totalProducts = parseInt(prodRes.rows[0]?.count || '0');

      const metricsRes = await query(`
        SELECT 
          COUNT(DISTINCT o.id) as total_orders,
          SUM(oi.price * oi.quantity) as gross_revenue,
          COUNT(DISTINCT CASE WHEN o.status NOT IN ('delivered') THEN o.id END) as pending_deliveries
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE (oi.seller_id = $1 OR p.seller_id = $1 OR p.created_by = $2)
          AND (o.payment_status = 'paid' OR o.status = 'delivered')
          AND o.status NOT IN ('cancelled', 'refunded', 'returned')
      `, [store.id, store.user_id]);

      if (metricsRes.rows.length > 0) {
        totalOrders = parseInt(metricsRes.rows[0].total_orders || '0');
        grossRevenue = parseFloat(metricsRes.rows[0].gross_revenue || '0');
        pendingDeliveries = parseInt(metricsRes.rows[0].pending_deliveries || '0');
      }
    } else {
      // Supabase fallback: collect products from products and seller_product
      const { data: myProducts } = await admin
        .from('products')
        .select('id')
        .or(`seller_id.eq.${store.id},created_by.eq.${store.user_id}`);

      const { data: mySellerProducts } = await admin
        .from('seller_product')
        .select('product_id')
        .or(`seller_id.eq.${store.id},seller_user_id.eq.${store.user_id}`);

      const prodIdSet = new Set<string>();
      myProducts?.forEach((p: any) => prodIdSet.add(p.id));
      mySellerProducts?.forEach((p: any) => { if (p.product_id) prodIdSet.add(p.product_id); });

      totalProducts = prodIdSet.size;
      const productIds = Array.from(prodIdSet);
      
      let oiQuery = admin
        .from('order_items')
        .select('order_id, price, quantity, orders(status, payment_status)');

      if (productIds.length > 0) {
        oiQuery = oiQuery.or(`seller_id.eq.${store.id},product_id.in.(${productIds.join(',')})`);
      } else {
        oiQuery = oiQuery.eq('seller_id', store.id);
      }

      const { data: oiData } = await oiQuery;
        if (oiData) {
          const orderIds = new Set();
          const pendingIds = new Set();
          oiData.forEach((item: any) => {
            const order = item.orders;
            if (!order || order.payment_status !== 'paid' || ['cancelled', 'refunded', 'returned'].includes(order.status)) {
              return;
            }
            orderIds.add(item.order_id);
            grossRevenue += item.price * item.quantity;
            if (order.status !== 'delivered') {
              pendingIds.add(item.order_id);
            }
          });
          totalOrders = orderIds.size;
          pendingDeliveries = pendingIds.size;
        }
      }

    const platformCommission = grossRevenue * ((store.commission_rate || 5) / 100);
    const netPayout = grossRevenue - platformCommission;

    const analyticsPayload = {
      metrics: {
        grossRevenue,
        platformCommission,
        netPayout,
        totalOrders,
        totalProducts,
        pendingDeliveries
      }
    };
    // Cache result scoped to sellerId
    cacheSellerAnalytics(store.id, analyticsPayload).catch(() => {});
    return NextResponse.json(analyticsPayload, { headers: { 'X-Cache': 'MISS' } });

  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
