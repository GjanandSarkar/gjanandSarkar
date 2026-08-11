import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { sendSuccess } from '../utils/response';
import { UnauthorizedError } from '../errors/AppError';

export const authController = {
  async sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone } = req.body;
      const result = await authService.sendOtp(phone);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone, otp } = req.body;
      const result = await authService.verifyOtp(phone, otp);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async syncOAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.syncOAuthUser(req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }
      const profile = await authService.getProfile(req.user.userId);
      sendSuccess(res, { user: profile });
    } catch (error) {
      next(error);
    }
  },

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }
      const profile = await authService.getProfile(req.user.userId);
      sendSuccess(res, { profile });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }
      const profile = await authService.updateProfile(req.user.userId, req.body);
      sendSuccess(res, { profile });
    } catch (error) {
      next(error);
    }
  },

  async logout(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, { message: 'Logged out successfully' });
  },
};
