import { Router } from 'express';
import { and, asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/pool';
import { appointments, doctors, doctorSchedules } from '../db/schema';
import { requireAuth, requireRole } from '../middleware/auth';
import { isValidDate } from '../lib/slots';

export const doctorRouter = Router();

doctorRouter.use(requireAuth, requireRole('doctor'));

async function requireDoctor(userId: number) {
  const [doctor] = await db.select().from(doctors).where(eq(doctors.userId, userId));
  return doctor;
}

const noProfile = { status: 403, message: 'Doctor profile not approved yet' } as const;

const doctorColumns = {
  id: doctors.id,
  name: doctors.name,
  title: doctors.title,
  specialty: doctors.specialty,
  slug: doctors.slug,
  photo: doctors.photo,
  rating: doctors.rating,
  reviewCount: doctors.reviewCount,
  experienceYears: doctors.experienceYears,
  patientsTreated: doctors.patientsTreated,
  languages: doctors.languages,
  location: doctors.location,
  fees: doctors.fees,
  nextAvailable: doctors.nextAvailable,
  verified: doctors.verified,
  featured: doctors.featured,
  gender: doctors.gender,
  bio: doctors.bio,
  education: doctors.education,
  experience: doctors.experience,
  registration: doctors.registration,
  expertise: doctors.expertise,
  treatments: doctors.treatments,
};

const appointmentColumns = {
  id: appointments.id,
  bookingId: appointments.bookingId,
  patientId: appointments.patientId,
  mode: appointments.mode,
  date: appointments.date,
  timeSlot: appointments.timeSlot,
  status: appointments.status,
  symptom: appointments.symptom,
  feePaise: appointments.feePaise,
  address: appointments.address,
  paymentStatus: appointments.paymentStatus,
  patientName: appointments.patientName,
  patientPhone: appointments.patientPhone,
  videoCallLink: appointments.videoCallLink,
  cancellationReason: appointments.cancellationReason,
  createdAt: appointments.createdAt,
};

const profilePatchSchema = z.object({
  fees: z.record(z.string(), z.number().nonnegative()).optional(),
  bio: z.string().max(5000).optional(),
  expertise: z.array(z.string().max(100)).optional(),
  treatments: z.array(z.string().max(100)).optional(),
  photo: z.string().url().optional(),
  languages: z.array(z.string().max(50)).optional(),
  experienceYears: z.number().int().nonnegative().optional(),
});

const scheduleSchema = z.object({
  schedules: z
    .array(
      z
        .object({
          dayOfWeek: z.number().int().min(0).max(6),
          startTime: z.string().regex(/^\d{2}:\d{2}$/, 'startTime must be HH:mm'),
          endTime: z.string().regex(/^\d{2}:\d{2}$/, 'endTime must be HH:mm'),
          breakStart: z.string().regex(/^\d{2}:\d{2}$/, 'breakStart must be HH:mm').nullable().optional(),
          breakEnd: z.string().regex(/^\d{2}:\d{2}$/, 'breakEnd must be HH:mm').nullable().optional(),
          active: z.boolean().optional(),
        })
        .refine((s) => !s.active || s.endTime > s.startTime, 'endTime must be after startTime')
        .refine((s) => !(s.active && (s.breakStart != null) !== (s.breakEnd != null)), 'break start and end must be set together')
        .refine((s) => !(s.active && s.breakStart != null && s.breakEnd != null && s.breakEnd > s.endTime), 'break must fit inside working hours'),
    )
    .max(7),
});

doctorRouter.get('/profile', async (req, res, next) => {
  try {
    const [doctor] = await db.select(doctorColumns).from(doctors).where(eq(doctors.userId, req.user!.id));
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }
    res.json({ doctor });
  } catch (err) {
    next(err);
  }
});

doctorRouter.patch('/profile', async (req, res, next) => {
  try {
    const body = profilePatchSchema.parse(req.body);
    const [doctor] = await db.select({ id: doctors.id }).from(doctors).where(eq(doctors.userId, req.user!.id));
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }
    const [updated] = await db.update(doctors).set(body).where(eq(doctors.id, doctor.id)).returning(doctorColumns);
    res.json({ doctor: updated });
  } catch (err) {
    next(err);
  }
});

doctorRouter.get('/appointments', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }
    const { date, status } = req.query;
    const filters = [eq(appointments.doctorId, doctor.id)];
    if (typeof date === 'string' && date) {
      if (!isValidDate(date)) {
        res.status(400).json({ error: { message: 'date must be YYYY-MM-DD' } });
        return;
      }
      filters.push(eq(appointments.date, date));
    }
    if (typeof status === 'string' && status) {
      const allowed = ['upcoming', 'completed', 'cancelled', 'no_show'];
      if (!allowed.includes(status)) {
        res.status(400).json({ error: { message: `status must be one of ${allowed.join(', ')}` } });
        return;
      }
      filters.push(eq(appointments.status, status));
    }
    const rows = await db
      .select(appointmentColumns)
      .from(appointments)
      .where(and(...filters))
      .orderBy(asc(appointments.date), asc(appointments.timeSlot));
    res.json({ appointments: rows.map((row) => ({ ...row, id: row.bookingId })) });
  } catch (err) {
    next(err);
  }
});

doctorRouter.patch('/appointments/:id', async (req, res, next) => {
  try {
    const body = z.object({ status: z.enum(['completed', 'no_show']) }).parse(req.body);
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }
    const [row] = await db
      .select({ id: appointments.id, doctorId: appointments.doctorId, status: appointments.status })
      .from(appointments)
      .where(eq(appointments.bookingId, req.params.id));
    if (!row) {
      res.status(404).json({ error: { message: 'Appointment not found' } });
      return;
    }
    if (row.doctorId !== doctor.id) {
      res.status(403).json({ error: { message: 'Forbidden' } });
      return;
    }
    if (row.status !== 'upcoming') {
      res.status(400).json({ error: { message: 'Only upcoming appointments can be updated' } });
      return;
    }
    const [updated] = await db
      .update(appointments)
      .set({ status: body.status })
      .where(eq(appointments.id, row.id))
      .returning(appointmentColumns);
    res.json({ appointment: { ...updated!, id: updated!.bookingId } });
  } catch (err) {
    next(err);
  }
});

doctorRouter.get('/schedules', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }
    const rows = await db
      .select()
      .from(doctorSchedules)
      .where(eq(doctorSchedules.doctorId, doctor.id))
      .orderBy(asc(doctorSchedules.dayOfWeek));
    res.json({ schedules: rows });
  } catch (err) {
    next(err);
  }
});

doctorRouter.put('/schedules', async (req, res, next) => {
  try {
    const body = scheduleSchema.parse(req.body);
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }
    // a week needs exactly one entry per day; reject duplicates/missing days
    const days = body.schedules.map((s) => s.dayOfWeek);
    if (new Set(days).size !== days.length) {
      res.status(400).json({ error: { message: 'Each day can appear only once' } });
      return;
    }
    await db.transaction(async (tx) => {
      await tx.delete(doctorSchedules).where(eq(doctorSchedules.doctorId, doctor.id));
      if (body.schedules.length > 0) {
        await tx.insert(doctorSchedules).values(
          body.schedules.map((s) => ({
            doctorId: doctor.id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            breakStart: s.breakStart ?? null,
            breakEnd: s.breakEnd ?? null,
            active: s.active ?? true,
          })),
        );
      }
    });
    const rows = await db
      .select()
      .from(doctorSchedules)
      .where(eq(doctorSchedules.doctorId, doctor.id))
      .orderBy(asc(doctorSchedules.dayOfWeek));
    res.json({ schedules: rows });
  } catch (err) {
    next(err);
  }
});
