import { Router } from 'express';
import { healthRoutes } from './healthRoutes';
import { authRoutes } from './authRoutes';
import { addressRoutes } from './addressRoutes';
import { productRoutes } from './productRoutes';
import { cartRoutes } from './cartRoutes';
import { orderRoutes } from './orderRoutes';
import { paymentRoutes } from './paymentRoutes';
import { subscriptionRoutes } from './subscriptionRoutes';
import { sellerRoutes } from './sellerRoutes';
import { couponRoutes } from './couponRoutes';
import { returnRoutes } from './returnRoutes';
import { adminRoutes } from './adminRoutes';
import { notificationRoutes } from './notificationRoutes';
import { reviewRoutes } from './reviewRoutes';
import { wishlistRoutes } from './wishlistRoutes';
import { translationRoutes } from './translationRoutes';

// Direct controller shortcuts for frontend compatibility
import { paymentController } from '../controllers/paymentController';
import { authController } from '../controllers/authController';
import { adminController } from '../controllers/adminController';
import { addressController } from '../controllers/addressController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createRazorpayOrderSchema,
  verifyRazorpayPaymentSchema,
} from '../validators/paymentValidator';
import { saveAddressSchema } from '../validators/addressValidator';
import { updateProfileSchema } from '../validators/authValidator';

export const apiRouter = Router();

// Standard Subroute Mounts
apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/addresses', addressRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/cart', cartRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/subscriptions', subscriptionRoutes);
apiRouter.use('/sellers', sellerRoutes);
apiRouter.use('/coupons', couponRoutes);
apiRouter.use('/returns', returnRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/reviews', reviewRoutes);
apiRouter.use('/wishlist', wishlistRoutes);
apiRouter.use('/translations', translationRoutes);

// ─── Frontend & Postman Contract Compatibility Shortcuts ─────
// 1. Direct Razorpay Shortcuts
apiRouter.post(
  '/create-order',
  optionalAuthenticate,
  validate(createRazorpayOrderSchema),
  paymentController.createRazorpayOrder
);
apiRouter.post(
  '/verify-payment',
  optionalAuthenticate,
  validate(verifyRazorpayPaymentSchema),
  paymentController.verifyPayment
);

// 2. User & Profile Shortcuts (/api/users/me, /api/users/address)
apiRouter.get('/users/me', authenticate, authController.getProfile);
apiRouter.patch('/users/me', authenticate, validate(updateProfileSchema), authController.updateProfile);
apiRouter.post(
  '/users/address',
  authenticate,
  validate(saveAddressSchema),
  addressController.saveAddress
);

// 3. Public Business Settings Read
apiRouter.get('/settings', adminController.getSettings);
apiRouter.get('/delivery-slots', adminController.getDeliverySlots);
