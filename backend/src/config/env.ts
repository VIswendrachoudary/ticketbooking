import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: process.env.PORT || '3000',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET || 'super-secret-jwt-key-ticket-booking-platform-2026',
  HOLD_TTL_SECONDS: parseInt(process.env.HOLD_TTL_SECONDS || '600', 10),
  OFFER_TTL_SECONDS: parseInt(process.env.OFFER_TTL_SECONDS || '900', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'Tickets <noreply@example.com>',
};
