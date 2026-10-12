import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().default('ecommerce_db'),
  DB_LOGGING: z.string().transform((v) => v === 'true').default('false'),
  DB_SYNCHRONIZE: z.string().transform((v) => v === 'true').default('false'),
  JWT_SECRET: z.string().min(16).default('super_secret_jwt_key_antigravity_ecommerce_2026_secure'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  REFRESH_TOKEN_SECRET: z.string().min(16).default('super_secret_refresh_key_antigravity_2026_refresh'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  FRONTEND_ORIGIN: z.string().default('http://localhost:4200'),
  ADMIN_ORIGIN: z.string().default('http://localhost:4200'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_DIR: z.string().default('logs'),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE: z.coerce.number().default(5242880),
}).refine(
  (data) => {
    if (data.NODE_ENV === 'production') {
      return (
        data.JWT_SECRET !== 'super_secret_jwt_key_antigravity_ecommerce_2026_secure' &&
        data.REFRESH_TOKEN_SECRET !== 'super_secret_refresh_key_antigravity_2026_refresh'
      );
    }
    return true;
  },
  {
    message: 'In production, custom non-default JWT_SECRET and REFRESH_TOKEN_SECRET must be supplied in .env',
    path: ['JWT_SECRET'],
  }
);

const parsed = environmentSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables detected:', JSON.stringify(parsed.error.format(), null, 2));
  throw new Error('Environment configuration validation failed');
}

export const env = parsed.data;
