import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  app: {
    name: process.env.APP_NAME || 'BookClub',
    env: process.env.APP_ENV || 'development',
    port: parseInt(process.env.PORT || '8000', 10),
  },
  database: {
    url: process.env.DATABASE_URL || 'sqlite:///./bookclub.db',
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || '',
  },
  senet: {
    baseUrl: process.env.SENET_MOCK_BASE_URL || 'http://localhost:9000',
    token: process.env.SENET_MOCK_TOKEN || 'mock-token-for-development',
    mock: true,
  },
  cache: {
    ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '30', 10),
  },
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'bookclub-dev-secret-key-change-in-production',
  },
};
