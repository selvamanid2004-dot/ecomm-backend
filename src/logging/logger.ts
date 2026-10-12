import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logDirectory = process.env.LOG_DIR || 'logs';
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// Redact sensitive keys
const SENSITIVE_KEYS = ['password', 'passwordHash', 'token', 'jwt', 'secret', 'creditCard', 'cvv', 'authorization'];

const redactSensitiveData = winston.format((info) => {
  const redact = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(redact);
    const copy: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      if (SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive.toLowerCase()))) {
        copy[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        copy[key] = redact(obj[key]);
      } else {
        copy[key] = obj[key];
      }
    }
    return copy;
  };

  return redact(info);
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    redactSensitiveData(),
    winston.format.json()
  ),
  defaultMeta: { service: 'luxe-ecommerce-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `[${timestamp}] ${level}: ${message}${metaString}`;
        })
      ),
    }),
    new winston.transports.File({
      filename: path.join(logDirectory, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDirectory, 'combined.log'),
      maxsize: 20971520, // 20MB
      maxFiles: 5,
    }),
  ],
});
