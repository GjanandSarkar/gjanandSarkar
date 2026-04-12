// src/utils/response.util.js — Standardised API Response Helpers
// ALL responses through this file to ensure consistent shape

/**
 * Success response
 * { success: true, data: {...}, message?: "..." }
 */
export const sendSuccess = (res, data, message = null, statusCode = 200) => {
  const body = { success: true, data };
  if (message) body.message = message;
  return res.status(statusCode).json(body);
};

/**
 * Created response (201)
 * { success: true, data: {...}, message?: "..." }
 */
export const sendCreated = (res, data, message = null) => {
  return sendSuccess(res, data, message, 201);
};

/**
 * Paginated response
 * { success: true, data: [...], meta: { total, page, limit, totalPages } }
 *
 * Guards against divide-by-zero: if limit parses to 0 or NaN, totalPages
 * would produce Infinity. Math.max(1, …) clamps it safely.
 */
export const sendPaginated = (res, data, total, page, limit) => {
  const parsedLimit = Math.max(1, parseInt(limit) || 1);
  return res.status(200).json({
    success: true,
    data,
    meta: {
      total,
      page: parseInt(page),
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
  });
};

/**
 * Error response (use ApiError for this mostly)
 */
export const sendError = (res, message, statusCode = 400, errors = []) => {
  const body = { success: false, error: message, code: statusCode };
  if (errors.length) body.errors = errors;
  return res.status(statusCode).json(body);
};