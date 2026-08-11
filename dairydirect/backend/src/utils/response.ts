import { Response } from 'express';

export function sendSuccess<T = any>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string
): void {
  const payload: any = {
    success: true,
    ...(typeof data === 'object' && data !== null && !Array.isArray(data) ? data : { data }),
  };

  if (message) {
    payload.message = message;
  }

  res.status(statusCode).json(payload);
}

export function sendCreated<T = any>(res: Response, data: T, message?: string): void {
  sendSuccess(res, data, 201, message);
}
