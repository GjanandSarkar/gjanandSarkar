import { Request, Response, NextFunction } from 'express';
import { wishlistService } from '../services/wishlistService';
import { sendSuccess } from '../utils/response';
import { UnauthorizedError } from '../errors/AppError';

export const wishlistController = {
  async getWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.query.userId as string) || req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('User ID required');
      }

      const wishlist = await wishlistService.getUserWishlist(userId);
      sendSuccess(res, { wishlist });
    } catch (error) {
      next(error);
    }
  },

  async toggleWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.body.userId || req.user?.userId;
      const productId = req.body.productId;
      if (!userId || !productId) {
        throw new UnauthorizedError('User ID and Product ID required');
      }

      const result = await wishlistService.toggleWishlist(userId, productId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async removeFromWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || (req.query.userId as string);
      const productId = req.params.productId || (req.query.productId as string);
      if (!userId || !productId) {
        throw new UnauthorizedError('User ID and Product ID required');
      }

      await wishlistService.removeFromWishlist(userId, productId);
      sendSuccess(res, { message: 'Removed from wishlist' });
    } catch (error) {
      next(error);
    }
  },
};
