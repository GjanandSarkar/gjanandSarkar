import { Router } from 'express';
import { paymentController } from '../controllers/paymentController';
import { optionalAuthenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createRazorpayOrderSchema,
  verifyRazorpayPaymentSchema,
} from '../validators/paymentValidator';

export const paymentRoutes = Router();

paymentRoutes.post(
  '/razorpay/create',
  optionalAuthenticate,
  validate(createRazorpayOrderSchema),
  paymentController.createRazorpayOrder
);
paymentRoutes.post(
  '/razorpay/verify',
  optionalAuthenticate,
  validate(verifyRazorpayPaymentSchema),
  paymentController.verifyPayment
);
paymentRoutes.post('/webhook', paymentController.handleWebhook);
