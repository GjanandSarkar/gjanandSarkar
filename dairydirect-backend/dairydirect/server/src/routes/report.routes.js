// src/routes/report.routes.js
import { Router } from 'express';
import {
  createReport,
  getMyReports,
  getAllReports,
  updateReport,
} from '../controllers/report.controller.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createReportSchema, updateReportSchema } from '../validators/report.validator.js';

const router = Router();
// All routes protected by authenticate (registered in app.js)

// POST /reports — CUSTOMER files a report
router.post('/', requireRole('CUSTOMER'), validate(createReportSchema), createReport);

// GET /reports/me — CUSTOMER sees their own reports
router.get('/me', requireRole('CUSTOMER'), getMyReports);

// GET /reports — ADMIN sees all reports
router.get('/', requireRole('ADMIN'), getAllReports);

// PATCH /reports/:id — ADMIN updates report status/resolution
router.patch('/:id', requireRole('ADMIN'), validate(updateReportSchema), updateReport);

export default router;
