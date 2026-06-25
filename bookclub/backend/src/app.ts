import express, { RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { errorHandler } from './middleware/error.handler';
import { clubRoutes } from './routes/clubs';
import { workstationRoutes } from './routes/workstations';
import { bookingRoutes } from './routes/bookings';
import { telegramRoutes } from './routes/telegram';
import { authRoutes } from './routes/auth';
import { gameRoutes } from './routes/games';

const FRONTEND_DIST = path.resolve(__dirname, '../../frontend/dist');

export function createApp() {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(cors({ origin: config.cors.allowedOrigins }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/v1/clubs', clubRoutes);
  app.use('/api/v1/clubs', workstationRoutes);
  app.use('/api/v1/bookings', bookingRoutes);
  app.use('/api/v1/telegram', telegramRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/games', gameRoutes);

  if (fs.existsSync(FRONTEND_DIST)) {
    app.use(express.static(FRONTEND_DIST, { maxAge: '1h' }));
    const spaFallback: RequestHandler = (_req, res) => {
      res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
    };
    app.get('*', spaFallback);
  }

  app.use(errorHandler);

  return app;
}
