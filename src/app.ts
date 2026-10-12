import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { env } from './config/environment.config';
import { requestLogger } from './middleware/request-logger.middleware';
import { apiRateLimiter } from './middleware/rate-limit.middleware';
import { errorHandler } from './middleware/error.middleware';
import { NotFoundError } from './errors/app-error';
import apiRoutes from './routes';

export const createApp = (): Application => {
  const app = express();

  // HTTP Response Compression (gzip / deflate - up to 80% bandwidth reduction)
  app.use(compression({
    level: 6,
    threshold: 1024,
  }));

  // Security Headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // CORS Configuration with strict origin whitelist
  const allowedOrigins = [
    env.FRONTEND_ORIGIN,
    env.ADMIN_ORIGIN,
    'http://localhost:4200',
    'http://127.0.0.1:4200',
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, server-to-server, curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || env.NODE_ENV !== 'production') {
          return callback(null, true);
        }
        return callback(new Error(`CORS policy does not allow access from ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Correlation-ID',
        'X-Session-ID',
        'Accept',
        'Origin',
      ],
    })
  );

  // Body Parsing with size limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request correlation & logging
  app.use(requestLogger);

  // Global Rate Limiting
  app.use('/api', apiRateLimiter);

  // Serve uploads with anti-sniff security headers and 30-day client cache
  const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
  app.use(
    '/uploads',
    express.static(uploadDir, {
      maxAge: '30d',
      setHeaders: (res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
      },
    })
  );

  // Mount API v1
  app.use('/api/v1', apiRoutes);

  // 404 handler for undefined routes
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
};
