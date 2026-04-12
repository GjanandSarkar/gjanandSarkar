// src/middlewares/errorHandler.js — Global Error Handler
export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[ERROR] ${status}: ${message}`);

  res.status(status).json({
    error: message,
    status,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
