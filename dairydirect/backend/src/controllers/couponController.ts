import { Request, Response, NextFunction } from 'express';
import { couponService } from '../services/couponService';
import { sendCreated, sendSuccess } from '../utils/response';

export const couponController = {
  async validateCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, subtotal } = req.body;
      const result = await couponService.validateCoupon(code, subtotal);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async listCoupons(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const coupons = await couponService.listCoupons();
      sendSuccess(res, { coupons });
    } catch (error) {
      next(error);
    }
  },

  async createCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const coupon = await couponService.createCoupon(req.body);
      sendCreated(res, { coupon });
    } catch (error) {
      next(error);
    }
  },

  async updateCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const coupon = await couponService.updateCoupon(req.params.id, req.body);
      sendSuccess(res, { coupon });
    } catch (error) {
      next(error);
    }
  },

  async deleteCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await couponService.deleteCoupon(req.params.id);
      sendSuccess(res, { message: 'Coupon deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
