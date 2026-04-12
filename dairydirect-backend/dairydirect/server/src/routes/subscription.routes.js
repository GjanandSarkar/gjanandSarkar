// src/routes/subscription.routes.js
import { Router } from 'express';
import {
  createSubscription,
  getMySubscriptions,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
} from '../controllers/subscription.controller.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createSubscriptionSchema } from '../validators/subscription.validator.js';

const router = Router();
// All routes protected by authenticate (registered in app.js)

// POST /subscriptions
router.post('/', requireRole('CUSTOMER'), validate(createSubscriptionSchema), createSubscription);

// GET /subscriptions/me
router.get('/me', requireRole('CUSTOMER'), getMySubscriptions);

// PATCH /subscriptions/:id/cancel
router.patch('/:id/cancel', requireRole('CUSTOMER'), cancelSubscription);

// PATCH /subscriptions/:id/pause
router.patch('/:id/pause', requireRole('CUSTOMER'), pauseSubscription);

// PATCH /subscriptions/:id/resume
router.patch('/:id/resume', requireRole('CUSTOMER'), resumeSubscription);

export default router;
