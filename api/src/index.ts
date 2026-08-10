import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/error';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { doctorsRouter } from './routes/doctors';
import { categoriesRouter } from './routes/categories';
import { symptomsRouter } from './routes/symptoms';
import { cmsRouter } from './routes/cms';

export function createApp() {
  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/doctors', doctorsRouter);
  app.use('/api/v1/categories', categoriesRouter);
  app.use('/api/v1/symptoms', symptomsRouter);
  app.use('/api/v1/cms', cmsRouter);
  app.use(errorHandler);
  return app;
}
