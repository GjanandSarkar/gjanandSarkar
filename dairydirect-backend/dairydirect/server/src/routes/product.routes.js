// src/routes/product.routes.js
import { Router } from 'express';
import {
  listProducts,
  getProduct,
  createProduct,
  toggleProductStatus,
} from '../controllers/product.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createProductSchema, toggleProductStatusSchema } from '../validators/product.validator.js';

const router = Router();

// GET /products — public
router.get('/', listProducts);

// GET /products/:id — public
router.get('/:id', getProduct);

// POST /products — ADMIN only
router.post('/', authenticate, requireRole('ADMIN'), validate(createProductSchema), createProduct);

// PATCH /products/:id/status — ADMIN only
// validate() ensures isActive is a strict boolean before reaching the controller
router.patch(
  '/:id/status',
  authenticate,
  requireRole('ADMIN'),
  validate(toggleProductStatusSchema),
  toggleProductStatus
);

export default router;