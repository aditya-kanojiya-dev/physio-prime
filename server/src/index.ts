import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/error';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { doctorsRouter } from './routes/doctors';
import { categoriesRouter } from './routes/categories';
import { symptomsRouter } from './routes/symptoms';
import { cmsRouter } from './routes/cms';
import { appointmentsRouter } from './routes/appointments';
import { razorpayRouter } from './routes/razorpay';
import { notificationsRouter } from './routes/notifications';
import { reviewsRouter } from './routes/reviews';
import { doctorRouter } from './routes/doctor';
import { doctorEarningsRouter } from './routes/earnings';
import { doctorPayoutsRouter } from './routes/payouts';
import { doctorLocationsRouter } from './routes/locations';
import { adminRouter } from './routes/admin';
import { communityRouter } from './routes/community';

export function createApp() {
  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  // raw-body for the razorpay webhook must run before express.json() so the
  // signature can be verified against the exact bytes received
  app.post('/api/v1/razorpay/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json());
  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/doctors', doctorsRouter);
  app.use('/api/v1/categories', categoriesRouter);
  app.use('/api/v1/symptoms', symptomsRouter);
  app.use('/api/v1/cms', cmsRouter);
  app.use('/api/v1/appointments', appointmentsRouter);
  app.use('/api/v1/razorpay', razorpayRouter);
  app.use('/api/v1/notifications', notificationsRouter);
  app.use('/api/v1', reviewsRouter);
  app.use('/api/v1/doctor', doctorRouter);
  app.use('/api/v1/doctor', doctorEarningsRouter);
  app.use('/api/v1/doctor', doctorPayoutsRouter);
  app.use('/api/v1/doctor', doctorLocationsRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/community', communityRouter);
  app.use(errorHandler);
  return app;
}
