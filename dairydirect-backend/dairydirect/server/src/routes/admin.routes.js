// src/routes/admin.routes.js
import { Router } from 'express';
import {
  getStats,
  getAllOrders,
  getOrderDetail,
  getAllSubscriptions,
  getAllReports,
  getRevenue,
  getDemandForecast,
  triggerSubscriptionOrders,
} from '../controllers/admin.controller.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import { adminLimiter } from '../middlewares/rateLimiter.js';

const router = Router();
// All routes here already protected by authenticate (app.js)
// Additional ADMIN role guard on each route

router.use(requireRole('ADMIN'));
router.use(adminLimiter);

// GET /admin/stats — Full dashboard data
router.get('/stats', getStats);

// GET /admin/orders — All orders (filterable by ?status=)
router.get('/orders', getAllOrders);

// GET /admin/orders/:id — Single order detail (admin view includes user info)
router.get('/orders/:id', getOrderDetail);

// GET /admin/subscriptions — All subscriptions (filterable by ?status=)
router.get('/subscriptions', getAllSubscriptions);

// GET /admin/reports — All quality reports (filterable by ?status=)
router.get('/reports', getAllReports);

// GET /admin/revenue — Revenue breakdown
router.get('/revenue', getRevenue);

// GET /admin/demand — Demand forecast for tomorrow
router.get('/demand', getDemandForecast);

// POST /admin/cron/trigger — Manually trigger subscription order generation (demo/testing)
router.post('/cron/trigger', triggerSubscriptionOrders);

export default router;