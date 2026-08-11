import { query } from '../config/database';
import { Review } from '../models/review';

export const reviewRepository = {
  async findByProductId(productId: string): Promise<Review[]> {
    const res = await query<Review>(
      'SELECT * FROM reviews WHERE product_id = $1 ORDER BY rating DESC, created_at DESC',
      [productId]
    );
    return res.rows;
  },

  async create(data: {
    productId: string;
    userId?: string | null;
    userName: string;
    rating: number;
    title?: string | null;
    comment: string;
    stateOrigin?: string;
    isVerifiedBuyer?: boolean;
  }): Promise<Review> {
    const res = await query<Review>(
      `INSERT INTO reviews (
        product_id, user_id, user_name, rating, title, comment, state_origin, is_verified_buyer
      ) VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'Gujarat'), COALESCE($8, false))
      RETURNING *`,
      [
        data.productId,
        data.userId || null,
        data.userName,
        data.rating,
        data.title || null,
        data.comment,
        data.stateOrigin || 'Gujarat',
        Boolean(data.isVerifiedBuyer),
      ]
    );

    // Update product rating and reviews_count
    await query(
      `UPDATE products
       SET rating = (SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE product_id = $1),
           reviews_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1)
       WHERE id = $1`,
      [data.productId]
    );

    return res.rows[0];
  },

  async incrementHelpful(id: string): Promise<void> {
    await query('UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = $1', [id]);
  },
};
