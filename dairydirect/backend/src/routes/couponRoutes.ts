import { Router } from 'express';
import { couponController } from '../controllers/couponController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { validateCouponSchema, createCouponSchema } from '../validators/couponValidator';

export const couponRoutes = Router();

couponRoutes.post('/validate', validate(validateCouponSchema), couponController.validateCoupon);

couponRoutes.get('/', authenticate, requireAdmin, couponController.listCoupons);
couponRoutes.post('/', authenticate, requireAdmin, validate(createCouponSchema), couponController.createCoupon);
couponRoutes.put('/:id', authenticate, requireAdmin, couponController.updateCoupon);
couponRoutes.delete('/:id', authenticate, requireAdmin, couponController.deleteCoupon);
