// src/controllers/subscription.controller.js
import * as subService from '../services/subscription.service.js';
import { sendSuccess, sendCreated } from '../utils/response.util.js';

export const createSubscription = async (req, res, next) => {
  try {
    const sub = await subService.createSubscription(req.user.id, req.validatedBody);
    sendCreated(res, sub, 'Subscription created. Orders will be generated automatically.');
  } catch (err) { next(err); }
};

export const getMySubscriptions = async (req, res, next) => {
  try {
    const subs = await subService.getMySubscriptions(req.user.id, req.query.status);
    sendSuccess(res, subs);
  } catch (err) { next(err); }
};

export const cancelSubscription = async (req, res, next) => {
  try {
    const result = await subService.cancelSubscription(req.user.id, req.params.id);
    sendSuccess(res, result, 'Subscription cancelled successfully');
  } catch (err) { next(err); }
};

export const pauseSubscription = async (req, res, next) => {
  try {
    const result = await subService.pauseSubscription(req.user.id, req.params.id);
    sendSuccess(res, result, 'Subscription paused');
  } catch (err) { next(err); }
};

export const resumeSubscription = async (req, res, next) => {
  try {
    const result = await subService.resumeSubscription(req.user.id, req.params.id);
    sendSuccess(res, result, 'Subscription resumed');
  } catch (err) { next(err); }
};
