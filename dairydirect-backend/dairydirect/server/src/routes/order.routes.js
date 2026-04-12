// src/routes/order.routes.js
import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
} from '../controllers/order.controller.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createOrderSchema, updateOrderStatusSchema } from '../validators/order.validator.js';

const router = Router();
// All routes protected by authenticate (registered in app.js)

// POST /orders — CUSTOMER
router.post('/', requireRole('CUSTOMER'), validate(createOrderSchema), createOrder);

// GET /orders — CUSTOMER (scoped to their own orders)
router.get('/', requireRole('CUSTOMER'), getMyOrders);

// GET /orders/:id — CUSTOMER (ownership enforced in service)
router.get('/:id', requireRole('CUSTOMER'), getOrder);

// PATCH /orders/:id/status — ADMIN only (state machine enforced in service)
router.patch(
  '/:id/status',
  requireRole('ADMIN'),
  validate(updateOrderStatusSchema),
  updateOrderStatus
);

export default router;
