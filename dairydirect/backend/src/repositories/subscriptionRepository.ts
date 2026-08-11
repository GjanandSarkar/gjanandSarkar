import { query, withTransaction } from '../config/database';
import { Subscription, ModificationReport, SubscriptionPlan, SubscriptionStatus } from '../models/subscription';

export const subscriptionRepository = {
  async findByUserId(userId: string): Promise<Subscription[]> {
    const res = await query<Subscription>(
      `SELECT
        s.*,
        p.name AS product_name,
        p.image_url AS product_image,
        pv.weight AS variant_weight,
        pv.price
      FROM subscriptions s
      JOIN products p ON p.id = s.product_id
      JOIN product_variants pv ON pv.id = s.variant_id
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC`,
      [userId]
    );
    return res.rows;
  },

  async findAll(params: { status?: SubscriptionStatus; limit?: number; offset?: number }): Promise<{ subscriptions: Subscription[]; total: number }> {
    const { status, limit = 50, offset = 0 } = params;
    let whereClause = '';
    const values: any[] = [];
    let idx = 1;

    if (status) {
      whereClause = `WHERE s.status = $${idx++}`;
      values.push(status);
    }

    const countRes = await query<{ count: string }>(`SELECT COUNT(*) FROM subscriptions s ${whereClause}`, values);
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    values.push(limit, offset);
    const dataRes = await query<Subscription>(
      `SELECT
        s.*,
        p.name AS product_name,
        p.image_url AS product_image,
        pv.weight AS variant_weight,
        pv.price,
        pr.name AS user_name,
        pr.phone AS user_phone
      FROM subscriptions s
      JOIN products p ON p.id = s.product_id
      JOIN product_variants pv ON pv.id = s.variant_id
      JOIN profiles pr ON pr.id = s.user_id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}`,
      values
    );

    return { subscriptions: dataRes.rows, total };
  },

  async findById(id: string): Promise<Subscription | null> {
    const res = await query<Subscription>(
      `SELECT
        s.*,
        p.name AS product_name,
        p.image_url AS product_image,
        pv.weight AS variant_weight,
        pv.price
      FROM subscriptions s
      JOIN products p ON p.id = s.product_id
      JOIN product_variants pv ON pv.id = s.variant_id
      WHERE s.id = $1`,
      [id]
    );
    return res.rows[0] || null;
  },

  async create(data: {
    userId: string;
    productId: string;
    variantId: string;
    volume: number;
    plan: SubscriptionPlan;
    deliverySlot?: string;
    startDate?: string;
    notes?: string;
  }): Promise<Subscription> {
    const res = await query<Subscription>(
      `INSERT INTO subscriptions (
        user_id, product_id, variant_id, volume, plan, delivery_slot, start_date, notes
      ) VALUES (
        $1, $2, $3, $4, $5, COALESCE($6, 'Early Morning (5:00 AM - 7:00 AM)'),
        COALESCE($7::date, CURRENT_DATE), $8
      ) RETURNING *`,
      [
        data.userId,
        data.productId,
        data.variantId,
        data.volume,
        data.plan,
        data.deliverySlot || null,
        data.startDate || null,
        data.notes || null,
      ]
    );
    return (await this.findById(res.rows[0].id))!;
  },

  async updateAction(
    subId: string,
    userId: string,
    action: 'pause' | 'resume' | 'change_volume' | 'change_plan' | 'cancel',
    payload: { newVolume?: number; newPlan?: SubscriptionPlan; pauseUntil?: string }
  ): Promise<Subscription | null> {
    return withTransaction(async (client) => {
      // 1. Record modification report
      await client.query(
        `INSERT INTO modification_reports (
          subscription_id, user_id, action, new_volume, new_plan, status
        ) VALUES ($1, $2, $3, $4, $5, 'accepted')`,
        [subId, userId, action, payload.newVolume || null, payload.newPlan || null]
      );

      // 2. Apply change directly
      let updateSql = 'UPDATE subscriptions SET updated_at = now()';
      const values: any[] = [];
      let idx = 1;

      if (action === 'pause') {
        updateSql += `, status = 'paused', pause_until = $${idx++}`;
        values.push(payload.pauseUntil || null);
      } else if (action === 'resume') {
        updateSql += `, status = 'active', pause_until = null`;
      } else if (action === 'cancel') {
        updateSql += `, status = 'cancelled'`;
      } else if (action === 'change_volume' && payload.newVolume) {
        updateSql += `, volume = $${idx++}`;
        values.push(payload.newVolume);
      } else if (action === 'change_plan' && payload.newPlan) {
        updateSql += `, plan = $${idx++}`;
        values.push(payload.newPlan);
      }

      values.push(subId, userId);
      updateSql += ` WHERE id = $${idx++} AND user_id = $${idx++} RETURNING *`;

      const res = await client.query<Subscription>(updateSql, values);
      return res.rows[0] ? this.findById(subId) : null;
    });
  },

  async getModificationReports(subId?: string): Promise<ModificationReport[]> {
    const sql = subId
      ? 'SELECT * FROM modification_reports WHERE subscription_id = $1 ORDER BY created_at DESC'
      : 'SELECT * FROM modification_reports ORDER BY created_at DESC';
    const params = subId ? [subId] : [];
    const res = await query<ModificationReport>(sql, params);
    return res.rows;
  },
};
