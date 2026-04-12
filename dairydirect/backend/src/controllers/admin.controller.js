// src/controllers/admin.controller.js
import * as adminService from '../services/admin.service.js';
import * as reportService from '../services/report.service.js';
import * as orderService from '../services/order.service.js';
import { generateSubscriptionOrders } from '../services/subscription.cron.js';
import { sendSuccess, sendPaginated } from '../utils/response.util.js';

export const getStats = async (req, res, next) => {
  try {
    const stats = await adminService.getAdminStats();
    sendSuccess(res, stats);
  } catch (err) { next(err); }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const result = await adminService.getAllOrders({ status, page, limit });
    sendPaginated(res, result.orders, result.total, result.page, result.limit);
  } catch (err) { next(err); }
};

// GET /admin/orders/:id — full order detail including customer info
export const getOrderDetail = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.user.id, req.params.id, true);
    sendSuccess(res, order);
  } catch (err) { next(err); }
};

export const getAllSubscriptions = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const result = await adminService.getAllSubscriptions({ status, page, limit });
    sendPaginated(res, result.subscriptions, result.total, result.page, result.limit);
  } catch (err) { next(err); }
};

export const getAllReports = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const result = await reportService.getAllReports({ status, page, limit });
    sendPaginated(res, result.reports, result.total, result.page, result.limit);
  } catch (err) { next(err); }
};

export const getRevenue = async (req, res, next) => {
  try {
    const revenue = await adminService.getRevenueStats();
    sendSuccess(res, revenue);
  } catch (err) { next(err); }
};

export const getDemandForecast = async (req, res, next) => {
  try {
    const forecast = await adminService.getDemandForecast();
    sendSuccess(res, forecast);
  } catch (err) { next(err); }
};

// Manual trigger for cron (demo / admin use only)
export const triggerSubscriptionOrders = async (req, res, next) => {
  try {
    const summary = await generateSubscriptionOrders();
    sendSuccess(res, summary, 'Subscription orders generated successfully');
  } catch (err) { next(err); }
};