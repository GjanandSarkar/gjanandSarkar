import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config/env';
import { apiRouter } from './routes';
import { errorHandler } from './errors/errorHandler';
import { NotFoundError } from './errors/AppError';
import { apiRateLimiter } from './middleware/rateLimiter';
import { healthController } from './controllers/healthController';

export function createApp(): Express {
  const app = express();

  // ── Security Headers ──────────────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // ── CORS Configuration ────────────────────────────────────────
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin) return callback(null, true);
        if (config.allowedOrigins.includes(origin) || !config.isProduction) {
          return callback(null, true);
        }
        return callback(null, true); // Dev-friendly fallback
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Razorpay-Signature'],
    })
  );

  // ── Body Parsers & Compression ────────────────────────────────
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── Logging ───────────────────────────────────────────────────
  if (config.nodeEnv !== 'test') {
    app.use(morgan(config.isProduction ? 'combined' : 'dev'));
  }

  // ── Root & Health Check Endpoints ─────────────────────────────
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      name: 'DairyDirect Backend API',
      version: '1.0.0',
      status: 'active',
      docs: '/api/health',
    });
  });

  app.get('/health', healthController.getHealth);

  // ── API Routes (with general rate limiting) ───────────────────
  app.use('/api', apiRateLimiter, apiRouter);

  // ── 404 Not Found Handler ─────────────────────────────────────
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`));
  });

  // ── Global Error Handling Middleware ──────────────────────────
  app.use(errorHandler);

  return app;
}
