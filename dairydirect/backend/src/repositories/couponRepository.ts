import { query } from '../config/database';
import { Coupon } from '../models/coupon';

export const couponRepository = {
  async findByCode(code: string): Promise<Coupon | null> {
    const res = await query<Coupon>(
      `SELECT * FROM coupons
       WHERE UPPER(code) = UPPER($1)
         AND is_active = true
         AND (expiry_date IS NULL OR expiry_date > now())
         AND (max_uses IS NULL OR used_count < max_uses)`,
      [code.trim()]
    );
    return res.rows[0] || null;
  },

  async findById(id: string): Promise<Coupon | null> {
    const res = await query<Coupon>('SELECT * FROM coupons WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  async findAll(): Promise<Coupon[]> {
    const res = await query<Coupon>('SELECT * FROM coupons ORDER BY created_at DESC');
    return res.rows;
  },

  async create(data: {
    code: string;
    type: 'percentage' | 'flat';
    value: number;
    min_order_value?: number;
    max_discount?: number;
    max_uses?: number;
    expiry_date?: string;
  }): Promise<Coupon> {
    const res = await query<Coupon>(
      `INSERT INTO coupons (
        code, type, value, min_order_value, max_discount, max_uses, expiry_date
      ) VALUES (
        UPPER($1), $2, $3, COALESCE($4, 0), $5, $6, $7
      ) RETURNING *`,
      [
        data.code.trim(),
        data.type,
        data.value,
        data.min_order_value || 0,
        data.max_discount || null,
        data.max_uses || null,
        data.expiry_date || null,
      ]
    );
    return res.rows[0];
  },

  async update(id: string, updates: Partial<Coupon>): Promise<Coupon | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (['type', 'value', 'min_order_value', 'max_discount', 'max_uses', 'is_active', 'expiry_date'].includes(key)) {
        fields.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const res = await query<Coupon>(
      `UPDATE coupons SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return res.rows[0] || null;
  },

  async incrementUsage(id: string): Promise<void> {
    await query('UPDATE coupons SET used_count = used_count + 1 WHERE id = $1', [id]);
  },

  async delete(id: string): Promise<boolean> {
    const res = await query('DELETE FROM coupons WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  },
};
