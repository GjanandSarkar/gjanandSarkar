import { query, withTransaction } from '../config/database';
import { UserAddress } from '../models/address';

export const addressRepository = {
  async findByUserId(userId: string): Promise<UserAddress[]> {
    const res = await query<UserAddress>(
      'SELECT * FROM user_addresses WHERE user_id = $1 AND is_deleted = false ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    return res.rows;
  },

  async findById(id: string): Promise<UserAddress | null> {
    const res = await query<UserAddress>(
      'SELECT * FROM user_addresses WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return res.rows[0] || null;
  },

  async create(data: {
    userId: string;
    label: string;
    address: string;
    apartment?: string;
    pincode?: string;
    city?: string;
    state?: string;
    lat?: number;
    lng?: number;
    isDefault?: boolean;
  }): Promise<UserAddress> {
    return withTransaction(async (client) => {
      const isDefault = Boolean(data.isDefault);

      if (isDefault) {
        await client.query(
          'UPDATE user_addresses SET is_default = false WHERE user_id = $1 AND is_default = true',
          [data.userId]
        );
      }

      const res = await client.query<UserAddress>(
        `INSERT INTO user_addresses (
          user_id, label, address, apartment, pincode, city, state, lat, lng, is_default
        ) VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'Palanpur'), COALESCE($7, 'Gujarat'), $8, $9, $10)
        RETURNING *`,
        [
          data.userId,
          data.label,
          data.address,
          data.apartment || null,
          data.pincode || null,
          data.city || 'Palanpur',
          data.state || 'Gujarat',
          data.lat || null,
          data.lng || null,
          isDefault,
        ]
      );

      return res.rows[0];
    });
  },

  async update(id: string, userId: string, data: Partial<UserAddress>): Promise<UserAddress | null> {
    return withTransaction(async (client) => {
      if (data.is_default) {
        await client.query(
          'UPDATE user_addresses SET is_default = false WHERE user_id = $1 AND id <> $2',
          [userId, id]
        );
      }

      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      for (const [key, val] of Object.entries(data)) {
        if (['label', 'address', 'apartment', 'pincode', 'city', 'state', 'lat', 'lng', 'is_default'].includes(key)) {
          fields.push(`${key} = $${idx++}`);
          values.push(val);
        }
      }

      if (fields.length === 0) return this.findById(id);

      values.push(id, userId);
      const res = await client.query<UserAddress>(
        `UPDATE user_addresses SET ${fields.join(', ')}, updated_at = now() WHERE id = $${idx++} AND user_id = $${idx++} AND is_deleted = false RETURNING *`,
        values
      );

      return res.rows[0] || null;
    });
  },

  async softDelete(id: string, userId: string): Promise<boolean> {
    const res = await query(
      'UPDATE user_addresses SET is_deleted = true, is_default = false, updated_at = now() WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return (res.rowCount ?? 0) > 0;
  },
};
