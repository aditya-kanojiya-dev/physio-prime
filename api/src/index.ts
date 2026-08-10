import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/error';
import { healthRouter } from './routes/health';

export function createApp() {
  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use('/api/v1/health', healthRouter);
  app.use(errorHandler);
  return app;
}
