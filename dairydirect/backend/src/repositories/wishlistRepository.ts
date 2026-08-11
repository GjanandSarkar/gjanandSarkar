import { query } from '../config/database';
import { WishlistItem } from '../models/wishlist';

export const wishlistRepository = {
  async findByUserId(userId: string): Promise<WishlistItem[]> {
    const res = await query<WishlistItem>(
      `SELECT w.*, row_to_json(p.*) AS product
       FROM wishlists w
       JOIN products p ON p.id = w.product_id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [userId]
    );
    return res.rows;
  },

  async add(userId: string, productId: string): Promise<void> {
    await query(
      'INSERT INTO wishlists (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, productId]
    );
  },

  async remove(userId: string, productId: string): Promise<boolean> {
    const res = await query('DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2', [userId, productId]);
    return (res.rowCount ?? 0) > 0;
  },

  async toggle(userId: string, productId: string): Promise<boolean> {
    const exists = await query('SELECT 1 FROM wishlists WHERE user_id = $1 AND product_id = $2', [userId, productId]);
    if (exists.rows.length > 0) {
      await this.remove(userId, productId);
      return false; // Removed
    } else {
      await this.add(userId, productId);
      return true; // Added
    }
  },
};
