// src/config/constants.js — Frontend Constants
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const PRODUCT_CATEGORIES = [
  'milk',
  'yogurt',
  'cheese',
  'butter',
  'ghee',
  'cream',
];

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};
