// src/config/constants.js — Application Constants
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
  MODERATOR: "moderator",
};

export const PRODUCT_CATEGORIES = {
  MILK: "milk",
  YOGURT: "yogurt",
  CHEESE: "cheese",
  BUTTER: "butter",
  GHEE: "ghee",
  CREAM: "cream",
};
