import { Router } from 'express';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { db } from '../db/pool';
import { caretakerInquiries } from '../db/schema';
import { notifyAdmin } from '../lib/notifications';

export const caretakerRouter = Router();

// ponytail: tight per-route limiter — matches the careers contact form
caretakerRouter.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: { message: 'Too many inquiries. Please try again later.' } });
    },
  }),
);

const SERVICE_TYPES = ['Caretaker', 'Occupational Therapist', 'Speech Therapist', 'Nursing Care'] as const;

const inquirySchema = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().refine((v) => /^\d{10}$/.test(v.replace(/\D/g, '')), 'phone must be a valid 10-digit number'),
  serviceType: z.enum(SERVICE_TYPES).default('Caretaker'),
  message: z.string().trim().max(2000).optional(),
});

caretakerRouter.post('/', async (req, res, next) => {
  try {
    const body = inquirySchema.parse(req.body);
    const phone = body.phone.replace(/\D/g, '');

    const [inquiry] = await db
      .insert(caretakerInquiries)
      .values({ name: body.name, phone, serviceType: body.serviceType, message: body.message ?? null })
      .returning();

    // admin alert — best-effort, awaited so the serverless function doesn't
    // freeze mid-dispatch (same lesson as the careers confirmation email)
    try {
      await notifyAdmin({
        type: 'caretaker_inquiry',
        title: `New ${body.serviceType} inquiry`,
        body: `${body.name} (${phone})${
          body.serviceType !== 'Caretaker' ? ` — seeking ${body.serviceType}` : ''
        }${body.message ? ` — ${body.message}` : ''}`,
      });
    } catch {
      // ponytail: best-effort
    }

    res.status(201).json({ inquiry: { id: inquiry.id, status: inquiry.status } });
  } catch (err) {
    next(err);
  }
});