import { Request, Response, NextFunction } from 'express';
import { addressService } from '../services/addressService';
import { sendCreated, sendSuccess } from '../utils/response';
import { UnauthorizedError } from '../errors/AppError';

export const addressController = {
  async getAddresses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.query.userId as string) || req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('User ID required');
      }

      const addresses = await addressService.getUserAddresses(userId);
      sendSuccess(res, { addresses });
    } catch (error) {
      next(error);
    }
  },

  async saveAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.body.userId || req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('User ID required');
      }

      const address = await addressService.saveAddress({
        ...req.body,
        userId,
      });

      sendCreated(res, { address });
    } catch (error) {
      next(error);
    }
  },

  async updateAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || (req.body.userId as string);
      if (!userId) {
        throw new UnauthorizedError('User ID required');
      }

      const address = await addressService.updateAddress(req.params.id, userId, req.body);
      sendSuccess(res, { address });
    } catch (error) {
      next(error);
    }
  },

  async deleteAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = (req.params.id as string) || (req.query.id as string);
      const userId = req.user?.userId || (req.query.userId as string);
      if (!userId) {
        throw new UnauthorizedError('User ID required');
      }

      await addressService.deleteAddress(id, userId);
      sendSuccess(res, { message: 'Address deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
