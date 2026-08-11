import { Router } from 'express';
import { subscriptionController } from '../controllers/subscriptionController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createSubscriptionSchema,
  updateSubscriptionSchema,
} from '../validators/subscriptionValidator';

export const subscriptionRoutes = Router();

subscriptionRoutes.get('/', optionalAuthenticate, subscriptionController.getSubscriptions);
subscriptionRoutes.post('/', optionalAuthenticate, validate(createSubscriptionSchema), subscriptionController.createSubscription);
subscriptionRoutes.put('/', optionalAuthenticate, validate(updateSubscriptionSchema), subscriptionController.updateSubscription);
