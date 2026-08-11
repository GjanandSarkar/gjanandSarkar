import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from './AppError';
import { config } from '../config/env';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
      },
    });
    return;
  }

  // 2. Custom App Errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // 3. PostgreSQL specific errors
  const pgErr = err as any;
  if (pgErr.code === '23505') {
    // Unique violation
    res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'A record with these details already exists.',
        details: pgErr.detail,
      },
    });
    return;
  }

  if (pgErr.code === '23503') {
    // Foreign key violation
    res.status(400).json({
      success: false,
      error: {
        code: 'FOREIGN_KEY_VIOLATION',
        message: 'Referenced resource was not found.',
        details: pgErr.detail,
      },
    });
    return;
  }

  // 4. Fallback Unexpected Internal Errors
  console.error('[Unhandled Server Error]:', err);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: config.isProduction ? 'An unexpected server error occurred' : err.message,
      ...(config.isProduction ? {} : { stack: err.stack }),
    },
  });
}
