// src/services/admin.service.js — Admin Business Logic
// Aggregations (SUM, COUNT, GROUP BY) handled in JS since Supabase JS client
// does not expose PostgreSQL aggregate functions directly.

import { supabase, cc, dbError } from '../utils/supabase.js';

const labelToLitres = (label) => {
  const normalised = label.trim().toLowerCase();
  const mlMatch = normalised.match(/^([\d.]+)\s*ml$/);
  if (mlMatch) return parseFloat(mlMatch[1]) / 1000;
  const litreMatch = normalised.match(/^([\d.]+)\s*l$/);
  if (litreMatch) return parseFloat(litreMatch[1]);
  return 0;
};

/**
 * Revenue tracking — aggregates from DELIVERED orders only
 */
export const getRevenueStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const { data: allDelivered } = await supabase
    .from('orders')
    .select('total_amount, created_at')
    .eq('status', 'DELIVERED');

  const rows = allDelivered || [];

  const sum = (arr) =>
    arr.reduce((acc, r) => acc + parseFloat(r.total_amount || 0), 0).toFixed(2);

  return {
    revenueTotal: sum(rows),
    revenueToday: sum(rows.filter((r) => new Date(r.created_at) >= today)),
    revenueMonth: sum(rows.filter((r) => new Date(r.created_at) >= startOfMonth)),
  };
};

/**
 * Demand forecast — aggregates active subscriptions by variant for tomorrow
 */
export const getDemandForecast = async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('variant_id, quantity')
    .eq('status', 'ACTIVE')
    .lte('start_date', tomorrow.toISOString())
    .or(`end_date.is.null,end_date.gte.${tomorrow.toISOString()}`);

  // Group by variant_id in JS
  const byVariant = {};
  for (const s of subs || []) {
    byVariant[s.variant_id] = (byVariant[s.variant_id] || 0) + s.quantity;
  }

  // Enrich with variant details
  const variantIds = Object.keys(byVariant);
  let breakdown = [];

  if (variantIds.length > 0) {
    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, label, price')
      .in('id', variantIds);

    breakdown = (variants || []).map((v) => {
      const totalUnits = byVariant[v.id] || 0;
      const litresPerUnit = labelToLitres(v.label);
      return {
        variantId: v.id,
        label: v.label,
        totalUnits,
        totalLitres: parseFloat((litresPerUnit * totalUnits).toFixed(2)),
      };
    });
  }

  const totalLitres = parseFloat(
    breakdown.reduce((sum, b) => sum + b.totalLitres, 0).toFixed(2)
  );

  return {
    forecastDate: tomorrow.toISOString().split('T')[0],
    tomorrowLitres: totalLitres,
    breakdownByVariant: breakdown,
  };
};

/**
 * Full admin stats dashboard
 */
export const getAdminStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parallel counts
  const [
    { count: totalOrders },
    { count: ordersToday },
    { count: activeSubscriptions },
    { count: openComplaints },
    { count: inReviewComplaints },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString()),
    supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ACTIVE'),
    supabase
      .from('quality_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'OPEN'),
    supabase
      .from('quality_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'IN_REVIEW'),
  ]);

  // Orders by status — fetch statuses and group in JS
  const { data: orderRows } = await supabase.from('orders').select('status');
  const ordersByStatus = (orderRows || []).reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const [revenue, forecast] = await Promise.all([getRevenueStats(), getDemandForecast()]);

  return {
    totalOrders: totalOrders || 0,
    ordersToday: ordersToday || 0,
    activeSubscriptions: activeSubscriptions || 0,
    openComplaints: openComplaints || 0,
    inReviewComplaints: inReviewComplaints || 0,
    ...revenue,
    demandForecast: forecast,
    ordersByStatus,
  };
};

/**
 * Admin: List all orders with filters and pagination
 */
export const getAllOrders = async ({ status, page = 1, limit = 20 } = {}) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);

  let query = supabase
    .from('orders')
    .select(
      `id, type, status, total_amount, payment_mode, payment_status, created_at,
       users!user_id(id, name, phone),
       addresses!address_id(area, city, pincode),
       order_items(quantity, products!product_id(name), product_variants!variant_id(label))`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(skip, skip + parseInt(limit) - 1);

  if (status) query = query.eq('status', status);

  const { data: orders, error, count } = await query;
  dbError(error, 'Failed to fetch orders');

  return {
    orders: cc(orders || []),
    total: count || 0,
    page: parseInt(page),
    limit: parseInt(limit),
  };
};

/**
 * Admin: List all subscriptions
 */
export const getAllSubscriptions = async ({ status, page = 1, limit = 20 } = {}) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);

  let query = supabase
    .from('subscriptions')
    .select(
      `id, quantity, frequency, start_date, end_date, status, created_at,
       users!user_id(id, name, phone),
       product_variants!variant_id(label, price, products!product_id(name))`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(skip, skip + parseInt(limit) - 1);

  if (status) query = query.eq('status', status);

  const { data: subscriptions, error, count } = await query;
  dbError(error, 'Failed to fetch subscriptions');

  return {
    subscriptions: cc(subscriptions || []),
    total: count || 0,
    page: parseInt(page),
    limit: parseInt(limit),
  };
};
