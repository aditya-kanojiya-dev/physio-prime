import { Router } from 'express';
import { desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/pool';
import { appointments, doctors, reviews, users } from '../db/schema';
import { requireAuth, requireRole } from '../middleware/auth';

export const reviewsRouter = Router();

const createSchema = z.object({
  appointmentId: z.union([z.number().int().positive(), z.string().min(1)]),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const e = err as { code?: unknown; cause?: { code?: unknown } };
  return e.code === '23505' || e.cause?.code === '23505';
}

reviewsRouter.post('/reviews', requireAuth, requireRole('patient'), async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const ref = body.appointmentId;
    const [apt] =
      typeof ref === 'number' || /^\d+$/.test(String(ref))
        ? await db.select().from(appointments).where(eq(appointments.id, Number(ref)))
        : await db.select().from(appointments).where(eq(appointments.bookingId, String(ref)));
    if (!apt) {
      res.status(404).json({ error: { message: 'Appointment not found' } });
      return;
    }
    if (apt.patientId !== req.user!.id) {
      res.status(403).json({ error: { message: 'Forbidden' } });
      return;
    }
    if (apt.status !== 'completed') {
      res.status(400).json({ error: { message: 'Only completed appointments can be reviewed' } });
      return;
    }
    try {
      const review = await db.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(reviews)
          .values({
            appointmentId: apt.id,
            doctorId: apt.doctorId,
            rating: body.rating,
            comment: body.comment ?? null,
          })
          .returning();
        const [agg] = await tx
          .select({
            avg: sql<string>`round(avg(${reviews.rating}), 1)`,
            count: sql<number>`count(*)`,
          })
          .from(reviews)
          .where(eq(reviews.doctorId, apt.doctorId));
        await tx
          .update(doctors)
          .set({ rating: agg.avg, reviewCount: Number(agg.count) })
          .where(eq(doctors.id, apt.doctorId));
        return inserted!;
      });
      res.status(201).json({ review });
    } catch (err) {
      if (isUniqueViolation(err)) {
        res.status(409).json({ error: { message: 'A review already exists for this appointment' } });
        return;
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

reviewsRouter.get('/doctors/:slug/reviews', async (req, res, next) => {
  try {
    const [doctor] = await db.select({ id: doctors.id }).from(doctors).where(eq(doctors.slug, req.params.slug));
    if (!doctor) {
      res.status(404).json({ error: { message: 'Doctor not found' } });
      return;
    }
    const rows = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        patientName: users.name,
        symptom: appointments.symptom,
      })
      .from(reviews)
      .innerJoin(appointments, eq(reviews.appointmentId, appointments.id))
      .innerJoin(users, eq(appointments.patientId, users.id))
      .where(eq(reviews.doctorId, doctor.id))
      .orderBy(desc(reviews.id));
    res.json({ reviews: rows });
  } catch (err) {
    next(err);
  }
});
