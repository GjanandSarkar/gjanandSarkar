import { reviewRepository } from '../repositories/reviewRepository';
import { orderRepository } from '../repositories/orderRepository';
import { Review } from '../models/review';
import { ValidationError } from '../errors/AppError';

export const reviewService = {
  async getProductReviews(productId: string): Promise<Review[]> {
    return reviewRepository.findByProductId(productId);
  },

  async addReview(data: {
    productId: string;
    userId?: string | null;
    userName: string;
    rating: number;
    title?: string | null;
    comment: string;
    stateOrigin?: string;
  }): Promise<Review> {
    if (data.rating < 1 || data.rating > 5) {
      throw new ValidationError('Rating must be between 1 and 5');
    }

    // Check verified buyer
    let isVerifiedBuyer = false;
    if (data.userId) {
      const orders = await orderRepository.findAll({ userId: data.userId, status: 'delivered' });
      isVerifiedBuyer = orders.orders.some((o) =>
        o.items?.some((i) => i.product_id === data.productId)
      );
    }

    return reviewRepository.create({
      ...data,
      isVerifiedBuyer,
    });
  },

  async markHelpful(id: string): Promise<void> {
    await reviewRepository.incrementHelpful(id);
  },
};
