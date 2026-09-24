import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { query, isPgConfigured } from '@/lib/aws/rds';
import { getCachedSellerAnalytics, cacheSellerAnalytics } from '@/lib/aws/redis';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth || auth.role !== 'seller') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getAdminSupabase();
    
    // Enforce seller ownership server-side
    const { data: store, error } = await admin
      .from('sellers')
      .select('id, commission_rate')
      .eq('user_id', auth.userId)
      .single();

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
      const prodRes = await query('SELECT count(*) as count FROM products WHERE seller_id = $1', [store.id]);
      totalProducts = parseInt(prodRes.rows[0]?.count || '0');

      const metricsRes = await query(`
        SELECT 
          COUNT(DISTINCT o.id) as total_orders,
          SUM(oi.price * oi.quantity) as gross_revenue,
          COUNT(DISTINCT CASE WHEN o.status NOT IN ('delivered') THEN o.id END) as pending_deliveries
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE p.seller_id = $1
          AND o.payment_status = 'paid'
          AND o.status NOT IN ('cancelled', 'refunded', 'returned')
      `, [store.id]);

      if (metricsRes.rows.length > 0) {
        totalOrders = parseInt(metricsRes.rows[0].total_orders || '0');
        grossRevenue = parseFloat(metricsRes.rows[0].gross_revenue || '0');
        pendingDeliveries = parseInt(metricsRes.rows[0].pending_deliveries || '0');
      }
    } else {
      // Supabase fallback
      const { count: prodCount } = await admin.from('products').select('*', { count: 'exact', head: true }).eq('seller_id', store.id);
      totalProducts = prodCount || 0;
      
      const { data: myProducts } = await admin.from('products').select('id').eq('seller_id', store.id);
      const productIds = myProducts?.map((p: { id: string }) => p.id) || [];
      
      if (productIds.length > 0) {
        const { data: oiData } = await admin.from('order_items').select('order_id, price, quantity, orders(status, payment_status)').in('product_id', productIds);
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
