import { query } from '../config/database';
import { settingsRepository } from '../repositories/settingsRepository';
import { deliverySlotRepository } from '../repositories/deliverySlotRepository';
import { profileRepository } from '../repositories/profileRepository';
import { auditLogRepository } from '../repositories/auditLogRepository';
import { BusinessSettings } from '../models/settings';

export const adminService = {
  /**
   * Executive BI Dashboard Statistics
   */
  async getDashboardStats(): Promise<{
    mrr: number;
    totalRevenue: number;
    activeSubscriptions: number;
    totalOrders: number;
    deliveredOrders: number;
    pendingOrders: number;
    totalCustomers: number;
    lowStockCount: number;
    aov: number;
  }> {
    // 1. Orders and Revenue
    const orderStatsRes = await query<{
      total_orders: string;
      delivered_orders: string;
      pending_orders: string;
      total_revenue: string;
    }>(`
      SELECT
        COUNT(*) AS total_orders,
        COUNT(*) FILTER (WHERE status = 'delivered') AS delivered_orders,
        COUNT(*) FILTER (WHERE status IN ('pending', 'processing', 'confirmed', 'out_for_delivery')) AS pending_orders,
        COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'paid' OR status = 'delivered'), 0) AS total_revenue
      FROM orders
    `);

    const totalOrders = parseInt(orderStatsRes.rows[0]?.total_orders || '0', 10);
    const deliveredOrders = parseInt(orderStatsRes.rows[0]?.delivered_orders || '0', 10);
    const pendingOrders = parseInt(orderStatsRes.rows[0]?.pending_orders || '0', 10);
    const totalRevenue = parseFloat(orderStatsRes.rows[0]?.total_revenue || '0');

    // 2. Active Subscriptions & MRR calculation
    const subStatsRes = await query<{
      active_subs: string;
      mrr: string;
    }>(`
      SELECT
        COUNT(*) AS active_subs,
        COALESCE(SUM(s.volume * pv.price * (
          CASE
            WHEN s.plan = 'daily' THEN 30
            WHEN s.plan = 'alternate' THEN 15
            WHEN s.plan = 'weekly' THEN 4
            ELSE 30
          END
        )), 0) AS mrr
      FROM subscriptions s
      JOIN product_variants pv ON pv.id = s.variant_id
      WHERE s.status = 'active'
    `);

    const activeSubscriptions = parseInt(subStatsRes.rows[0]?.active_subs || '0', 10);
    const mrr = parseFloat(subStatsRes.rows[0]?.mrr || '0');

    // 3. Total Customers
    const custRes = await query<{ count: string }>(
      `SELECT COUNT(*) FROM profiles WHERE role = 'customer'`
    );
    const totalCustomers = parseInt(custRes.rows[0]?.count || '0', 10);

    // 4. Low stock inventory count
    const stockRes = await query<{ count: string }>(
      `SELECT COUNT(*) FROM product_variants WHERE stock <= low_stock_threshold AND is_active = true`
    );
    const lowStockCount = parseInt(stockRes.rows[0]?.count || '0', 10);

    // 5. Average Order Value (AOV)
    const aov = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0;

    return {
      mrr,
      totalRevenue,
      activeSubscriptions,
      totalOrders,
      deliveredOrders,
      pendingOrders,
      totalCustomers,
      lowStockCount,
      aov,
    };
  },

  /**
   * Reports Data with period breakdown & CSV generation
   */
  async getReports(params: { period?: string; format?: string }): Promise<any> {
    const { period = 'daily', format = 'json' } = params;

    let interval = "DATE_TRUNC('day', created_at)";
    let timeFilter = "created_at >= now() - INTERVAL '30 days'";

    if (period === 'weekly') {
      interval = "DATE_TRUNC('week', created_at)";
      timeFilter = "created_at >= now() - INTERVAL '12 weeks'";
    } else if (period === 'monthly') {
      interval = "DATE_TRUNC('month', created_at)";
      timeFilter = "created_at >= now() - INTERVAL '12 months'";
    }

    const res = await query<{
      date: string;
      orders_count: string;
      revenue: string;
      avg_order_value: string;
    }>(`
      SELECT
        TO_CHAR(${interval}, 'YYYY-MM-DD') AS date,
        COUNT(*) AS orders_count,
        COALESCE(SUM(total_amount), 0) AS revenue,
        COALESCE(ROUND(AVG(total_amount), 2), 0) AS avg_order_value
      FROM orders
      WHERE ${timeFilter}
      GROUP BY ${interval}
      ORDER BY ${interval} ASC
    `);

    const reportRows = res.rows.map((r) => ({
      date: r.date,
      ordersCount: parseInt(r.orders_count, 10),
      revenue: parseFloat(r.revenue),
      avgOrderValue: parseFloat(r.avg_order_value),
    }));

    if (format === 'csv') {
      const header = 'Date,Orders Count,Revenue (INR),Average Order Value (INR)\n';
      const body = reportRows
        .map((r) => `${r.date},${r.ordersCount},${r.revenue},${r.avgOrderValue}`)
        .join('\n');
      return header + body;
    }

    return { period, reports: reportRows };
  },

  /**
   * Inventory Matrix
   */
  async getInventory(filter = 'all'): Promise<any[]> {
    let where = 'WHERE pv.is_active = true';
    if (filter === 'low_stock') {
      where += ' AND pv.stock <= pv.low_stock_threshold';
    } else if (filter === 'out_of_stock') {
      where += ' AND pv.stock = 0';
    }

    const res = await query(`
      SELECT
        pv.id AS variant_id,
        pv.product_id,
        p.name AS product_name,
        p.category,
        pv.weight,
        pv.price,
        pv.cost_price,
        pv.stock,
        pv.low_stock_threshold,
        pv.batch_number,
        pv.expiry_date,
        CASE
          WHEN pv.stock = 0 THEN 'out_of_stock'
          WHEN pv.stock <= pv.low_stock_threshold THEN 'low_stock'
          ELSE 'in_stock'
        END AS stock_status
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      ${where}
      ORDER BY p.name ASC, pv.price ASC
    `);

    return res.rows;
  },

  /**
   * Batch update stock
   */
  async updateInventory(updates: Array<{ variantId: string; stock: number; costPrice?: number; batchNumber?: string }>, adminId?: string): Promise<void> {
    for (const item of updates) {
      await query(
        `UPDATE product_variants
         SET stock = $1,
             cost_price = COALESCE($2, cost_price),
             batch_number = COALESCE($3, batch_number),
             updated_at = now()
         WHERE id = $4`,
        [item.stock, item.costPrice || null, item.batchNumber || null, item.variantId]
      );
    }

    await auditLogRepository.logAction({
      adminId,
      action: 'UPDATE_INVENTORY',
      entityType: 'product_variants',
      newData: updates,
    });
  },

  /**
   * Customers list
   */
  async listCustomers(params: { search?: string; limit?: number; offset?: number }) {
    return profileRepository.listCustomers(params);
  },

  /**
   * Settings
   */
  async getSettings(): Promise<BusinessSettings> {
    return settingsRepository.getSettings();
  },

  async updateSettings(updates: Partial<BusinessSettings>, adminId?: string): Promise<BusinessSettings> {
    const oldSettings = await settingsRepository.getSettings();
    const updated = await settingsRepository.updateSettings(updates);

    await auditLogRepository.logAction({
      adminId,
      action: 'UPDATE_SETTINGS',
      entityType: 'business_settings',
      oldData: oldSettings,
      newData: updated,
    });

    return updated;
  },

  /**
   * Delivery Slots
   */
  async getDeliverySlots() {
    return deliverySlotRepository.findAll();
  },

  async createDeliverySlot(data: { slotName: string; startTime: string; endTime: string; maxOrdersCapacity?: number }) {
    return deliverySlotRepository.create(data);
  },

  async updateDeliverySlot(id: string, updates: any) {
    return deliverySlotRepository.update(id, updates);
  },

  async deleteDeliverySlot(id: string) {
    return deliverySlotRepository.delete(id);
  },
};
