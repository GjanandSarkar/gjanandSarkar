import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const logStr = `[${new Date().toISOString()}] ${method} ${originalUrl} ${statusCode} - ${duration}ms`;

    if (statusCode >= 500) {
      console.error(logStr);
    } else if (statusCode >= 400) {
      console.warn(logStr);
    } else {
      console.log(logStr);
    }
  });

  next();
}
