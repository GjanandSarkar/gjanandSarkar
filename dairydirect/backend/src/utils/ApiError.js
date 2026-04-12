// src/utils/ApiError.js — Custom Error Class
// All operational errors thrown as ApiError instances
// Non-operational errors (unexpected) are caught by errorHandler → 500

export class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;         // Array of field-level errors (from Zod)
    this.isOperational = true;    // Flag: known error vs unexpected crash
    Error.captureStackTrace(this, this.constructor);
  }
}
