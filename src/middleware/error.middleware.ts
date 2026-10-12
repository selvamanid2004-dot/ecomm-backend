import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';
import { logger } from '../logging/logger';
import { env } from '../config/environment.config';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const correlationId = req.correlationId || 'unknown';
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let errors: any = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    errors = err.errors;
  } else if (err.name === 'ZodError') {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    errors = err.errors;
  } else if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'A resource with these details already exists';
  } else if (err.name === 'EntityNotFoundError') {
    statusCode = 404;
    code = 'NOT_FOUND';
    message = 'Requested entity not found';
  }

  // Structured Logging
  if (statusCode >= 500) {
    logger.error('Unhandled server error', {
      correlationId,
      path: req.originalUrl,
      method: req.method,
      error: err.message,
      stack: env.NODE_ENV === 'production' ? undefined : err.stack,
    });
  } else {
    logger.warn('Client request failed', {
      correlationId,
      path: req.originalUrl,
      method: req.method,
      statusCode,
      code,
      message,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    code,
    errors,
    correlationId,
    ...(env.NODE_ENV !== 'production' && statusCode >= 500 ? { debug: err.stack } : {}),
  });
};
