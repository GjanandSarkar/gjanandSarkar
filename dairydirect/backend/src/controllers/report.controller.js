// src/controllers/report.controller.js
import * as reportService from '../services/report.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response.util.js';

export const createReport = async (req, res, next) => {
  try {
    const report = await reportService.createReport(req.user.id, req.validatedBody);
    sendCreated(res, report, 'Quality report filed. Our team will review within 24 hours.');
  } catch (err) { next(err); }
};

export const getMyReports = async (req, res, next) => {
  try {
    const reports = await reportService.getMyReports(req.user.id);
    sendSuccess(res, reports);
  } catch (err) { next(err); }
};

export const getAllReports = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const result = await reportService.getAllReports({ status, page, limit });
    sendPaginated(res, result.reports, result.total, result.page, result.limit);
  } catch (err) { next(err); }
};

export const updateReport = async (req, res, next) => {
  try {
    // Use req.validatedBody — the validate(updateReportSchema) middleware already
    // ran and coerced the payload; using req.body here would bypass that entirely
    const report = await reportService.updateReport(req.params.id, req.validatedBody);
    sendSuccess(res, report, 'Report updated');
  } catch (err) { next(err); }
};