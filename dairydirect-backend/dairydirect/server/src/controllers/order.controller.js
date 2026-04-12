// src/controllers/order.controller.js
import * as orderService from '../services/order.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response.util.js';

export const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.user.id, req.validatedBody);
    sendCreated(res, order, 'Order placed successfully');
  } catch (err) { next(err); }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await orderService.getMyOrders(req.user.id, { page, limit, status });
    sendPaginated(res, result.orders, result.total, result.page, result.limit);
  } catch (err) { next(err); }
};

export const getOrder = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.user.id, req.params.id);
    sendSuccess(res, order);
  } catch (err) { next(err); }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateOrderStatus(req.params.id, req.validatedBody.status);
    sendSuccess(res, order, `Order status updated to ${order.status}`);
  } catch (err) { next(err); }
};
