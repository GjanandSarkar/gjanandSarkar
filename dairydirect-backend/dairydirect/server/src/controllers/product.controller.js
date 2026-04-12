// src/controllers/product.controller.js
import * as productService from '../services/product.service.js';
import { sendSuccess, sendCreated } from '../utils/response.util.js';

export const listProducts = async (req, res, next) => {
  try {
    const products = await productService.listProducts({ category: req.query.category });
    sendSuccess(res, products);
  } catch (err) { next(err); }
};

export const getProduct = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    sendSuccess(res, product);
  } catch (err) { next(err); }
};

export const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.validatedBody);
    sendCreated(res, product, 'Product created successfully');
  } catch (err) { next(err); }
};

export const toggleProductStatus = async (req, res, next) => {
  try {
    // Read from req.validatedBody — guaranteed to be a strict boolean by Zod
    const { isActive } = req.validatedBody;
    const product = await productService.toggleProductStatus(req.params.id, isActive);
    sendSuccess(res, product, `Product ${isActive ? 'activated' : 'deactivated'}`);
  } catch (err) { next(err); }
};