import { query } from '../config/database';
import { ReturnRequest, ReturnStatus } from '../models/returnRequest';

export const returnRepository = {
  async findAll(params: { userId?: string; status?: ReturnStatus }): Promise<ReturnRequest[]> {
    const { userId, status } = params;
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (userId) {
      conditions.push(`r.user_id = $${idx++}`);
      values.push(userId);
    }
    if (status) {
      conditions.push(`r.status = $${idx++}`);
      values.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const res = await query<ReturnRequest>(
      `SELECT
        r.*,
        o.order_number,
        p.name AS user_name,
        p.phone AS user_phone
      FROM return_requests r
      JOIN orders o ON o.id = r.order_id
      JOIN profiles p ON p.id = r.user_id
      ${whereClause}
      ORDER BY r.created_at DESC`,
      values
    );
    return res.rows;
  },

  async findById(id: string): Promise<ReturnRequest | null> {
    const res = await query<ReturnRequest>(
      `SELECT
        r.*,
        o.order_number,
        p.name AS user_name,
        p.phone AS user_phone
      FROM return_requests r
      JOIN orders o ON o.id = r.order_id
      JOIN profiles p ON p.id = r.user_id
      WHERE r.id = $1`,
      [id]
    );
    return res.rows[0] || null;
  },

  async create(data: {
    orderId: string;
    userId: string;
    reason: string;
    description?: string;
    images?: string[];
  }): Promise<ReturnRequest> {
    const res = await query<ReturnRequest>(
      `INSERT INTO return_requests (
        order_id, user_id, reason, description, images
      ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        data.orderId,
        data.userId,
        data.reason,
        data.description || null,
        data.images || [],
      ]
    );
    return (await this.findById(res.rows[0].id))!;
  },

  async updateStatus(
    id: string,
    status: ReturnStatus,
    refundAmount?: number,
    adminNotes?: string
  ): Promise<ReturnRequest | null> {
    const res = await query<ReturnRequest>(
      `UPDATE return_requests
       SET status = $1,
           refund_amount = COALESCE($2, refund_amount),
           admin_notes = COALESCE($3, admin_notes),
           resolved_at = CASE WHEN $1 IN ('approved', 'refunded', 'rejected') THEN now() ELSE resolved_at END
       WHERE id = $4
       RETURNING *`,
      [status, refundAmount !== undefined ? refundAmount : null, adminNotes || null, id]
    );
    return res.rows[0] ? this.findById(id) : null;
  },
};
