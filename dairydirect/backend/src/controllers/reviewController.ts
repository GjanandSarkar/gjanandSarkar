import { Request, Response, NextFunction } from 'express';
import { reviewService } from '../services/reviewService';
import { sendCreated, sendSuccess } from '../utils/response';

export const reviewController = {
  async getReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = req.query.productId as string;
      const reviews = await reviewService.getProductReviews(productId);
      sendSuccess(res, { reviews });
    } catch (error) {
      next(error);
    }
  },

  async addReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || null;
      const userName = req.body.userName || req.user?.name || 'Customer';

      const review = await reviewService.addReview({
        ...req.body,
        userId,
        userName,
      });

      sendCreated(res, { review });
    } catch (error) {
      next(error);
    }
  },

  async markHelpful(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await reviewService.markHelpful(req.params.id);
      sendSuccess(res, { message: 'Marked as helpful' });
    } catch (error) {
      next(error);
    }
  },
};
