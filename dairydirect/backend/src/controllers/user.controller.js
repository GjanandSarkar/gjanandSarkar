// src/controllers/user.controller.js
import * as userService from '../services/user.service.js';
import { sendSuccess, sendCreated } from '../utils/response.util.js';

export const getMe = async (req, res, next) => {
  try {
    const user = await userService.getMyProfile(req.user.id);
    sendSuccess(res, user);
  } catch (err) { next(err); }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user.id, req.validatedBody);
    sendSuccess(res, user, 'Profile updated successfully');
  } catch (err) { next(err); }
};

export const addAddress = async (req, res, next) => {
  try {
    const address = await userService.addAddress(req.user.id, req.validatedBody);
    sendCreated(res, address, 'Address added successfully');
  } catch (err) { next(err); }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const result = await userService.deleteAddress(req.user.id, req.params.addressId);
    sendSuccess(res, result, 'Address deleted');
  } catch (err) { next(err); }
};
