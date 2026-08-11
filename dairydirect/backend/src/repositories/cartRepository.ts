import { query } from '../config/database';
import { CartItem } from '../models/cart';

export const cartRepository = {
  async findByUserId(userId: string): Promise<CartItem[]> {
    const res = await query<CartItem>(
      `SELECT
        ci.id,
        ci.user_id,
        ci.product_id,
        ci.variant_id,
        ci.quantity,
        ci.created_at,
        ci.updated_at,
        p.name AS product_name,
        p.category,
        p.image_url,
        pv.weight AS variant_weight,
        pv.price,
        pv.stock
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      JOIN product_variants pv ON pv.id = ci.variant_id
      WHERE ci.user_id = $1
      ORDER BY ci.created_at DESC`,
      [userId]
    );
    return res.rows;
  },

  async upsert(userId: string, productId: string, variantId: string, quantity: number): Promise<void> {
    await query(
      `INSERT INTO cart_items (user_id, product_id, variant_id, quantity, updated_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (user_id, product_id, variant_id)
       DO UPDATE SET quantity = $4, updated_at = now()`,
      [userId, productId, variantId, quantity]
    );
  },

  async addQuantity(userId: string, productId: string, variantId: string, delta: number): Promise<void> {
    await query(
      `INSERT INTO cart_items (user_id, product_id, variant_id, quantity, updated_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (user_id, product_id, variant_id)
       DO UPDATE SET quantity = cart_items.quantity + $4, updated_at = now()`,
      [userId, productId, variantId, delta]
    );
  },

  async removeItem(userId: string, productId: string, variantId: string): Promise<boolean> {
    const res = await query(
      'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2 AND variant_id = $3',
      [userId, productId, variantId]
    );
    return (res.rowCount ?? 0) > 0;
  },

  async clearUserCart(userId: string): Promise<void> {
    await query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
  },
};
