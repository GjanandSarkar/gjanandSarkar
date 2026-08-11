import { Request, Response, NextFunction } from 'express';
import { cartService } from '../services/cartService';
import { sendSuccess } from '../utils/response';
import { UnauthorizedError } from '../errors/AppError';

export const cartController = {
  async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.query.userId as string) || req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('User ID required');
      }

      const result = await cartService.getUserCart(userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async addToCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.body.userId || req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('User ID required');
      }

      const { productId, variantId, quantity } = req.body;
      await cartService.addToCart(userId, productId, variantId, quantity);
      sendSuccess(res, { message: 'Item added to cart' });
    } catch (error) {
      next(error);
    }
  },

  async updateCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.body.userId || req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('User ID required');
      }

      const { productId, variantId, quantity } = req.body;
      await cartService.updateQuantity(userId, productId, variantId, quantity);
      sendSuccess(res, { message: 'Cart updated' });
    } catch (error) {
      next(error);
    }
  },

  async removeFromCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.query.userId as string) || (req.body.userId as string) || req.user?.userId;
      const productId = (req.query.productId as string) || (req.body.productId as string);
      const variantId = (req.query.variantId as string) || (req.body.variantId as string);

      if (!userId || !productId || !variantId) {
        throw new UnauthorizedError('User ID, product ID, and variant ID required');
      }

      await cartService.removeItem(userId, productId, variantId);
      sendSuccess(res, { message: 'Item removed from cart' });
    } catch (error) {
      next(error);
    }
  },

  async clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.body.userId || (req.query.userId as string) || req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('User ID required');
      }

      await cartService.clearCart(userId);
      sendSuccess(res, { message: 'Cart cleared' });
    } catch (error) {
      next(error);
    }
  },
};
