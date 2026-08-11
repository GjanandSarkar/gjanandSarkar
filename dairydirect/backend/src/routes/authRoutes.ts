import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authRateLimiter } from '../middleware/rateLimiter';
import {
  sendOtpSchema,
  verifyOtpSchema,
  syncOAuthSchema,
  updateProfileSchema,
} from '../validators/authValidator';

export const authRoutes = Router();

authRoutes.post('/send-otp', authRateLimiter, validate(sendOtpSchema), authController.sendOtp);
authRoutes.post('/otp/send', authRateLimiter, validate(sendOtpSchema), authController.sendOtp);

authRoutes.post('/verify-otp', authRateLimiter, validate(verifyOtpSchema), authController.verifyOtp);
authRoutes.post('/otp/verify', authRateLimiter, validate(verifyOtpSchema), authController.verifyOtp);

authRoutes.post('/sync', validate(syncOAuthSchema), authController.syncOAuth);

authRoutes.get('/session', authenticate, authController.getSession);
authRoutes.post('/session', authenticate, authController.getSession);
authRoutes.delete('/session', authController.logout);

authRoutes.get('/profile', authenticate, authController.getProfile);
authRoutes.put('/profile', authenticate, validate(updateProfileSchema), authController.updateProfile);
authRoutes.post('/logout', authController.logout);
