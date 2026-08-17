import { Router } from 'express';
import { and, asc, count, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/pool';
import { appointments, doctors, doctorSchedules, patientProfiles, prescriptions, users } from '../db/schema';
import { requireAuth, requireRole } from '../middleware/auth';
import { isValidDate, getNextFreeSlot } from '../lib/slots';

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
  patientRelation: appointments.patientRelation,
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

const windowSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  windowStart: z.string(),
  windowEnd: z.string(),
  maxPatients: z.number().int().min(1).max(3),
  active: z.boolean(),
});

const schedulePutSchema = z.object({
  windows: z.array(windowSchema),
});

const rescheduleSchema = z.object({
  date: z.string(),
  windowStart: z.string(),
  windowEnd: z.string(),
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

const prescriptionSchema = z.object({
  diagnosis: z.string().max(2000).optional(),
  medicines: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        dosage: z.string().max(100).optional().default(''),
        frequency: z.string().max(200).optional().default(''),
        duration: z.string().max(100).optional().default(''),
      }),
    )
    .optional()
    .default([]),
  advice: z.string().max(2000).optional(),
  followUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'followUpDate must be YYYY-MM-DD').optional(),
});

doctorRouter.post('/appointments/:id/prescription', async (req, res, next) => {
  try {
    const body = prescriptionSchema.parse(req.body);
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }
    const [row] = await db
      .select({
        id: appointments.id,
        doctorId: appointments.doctorId,
        patientId: appointments.patientId,
        status: appointments.status,
      })
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
    if (row.status !== 'completed') {
      res.status(400).json({ error: { message: 'Prescriptions can only be written for completed appointments' } });
      return;
    }
    const [saved] = await db
      .insert(prescriptions)
      .values({
        appointmentId: row.id,
        doctorId: doctor.id,
        patientId: row.patientId,
        diagnosis: body.diagnosis ?? null,
        medicines: body.medicines,
        advice: body.advice ?? null,
        followUpDate: body.followUpDate ?? null,
      })
      .onConflictDoNothing()
      .returning();
    if (!saved) {
      res.status(409).json({ error: { message: 'This appointment already has a prescription' } });
      return;
    }
    res.status(201).json({ prescription: saved });
  } catch (err) {
    next(err);
  }
});

// --- patients ----------------------------------------------------------

// Patients are users rows with role='patient' (same model as admin).
const PATIENT_WHERE = eq(users.role, 'patient');

// Age comes from the appointment snapshot when written; fall back to dob.
function ageFrom(dob: string | null, patientAge: number | null): number | null {
  if (patientAge != null) return patientAge;
  if (!dob) return null;
  const years = (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000);
  return Math.max(0, Math.floor(years));
}

doctorRouter.get('/patients', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }
    const rows = await db
      .select({
        id: appointments.patientId,
        name: appointments.patientName,
        email: users.email,
        phone: appointments.patientPhone,
        gender: appointments.patientGender,
        age: appointments.patientAge,
        visitCount: count(appointments.id),
        lastVisit: sql<string>`max(${appointments.date})`,
      })
      .from(appointments)
      .innerJoin(users, eq(users.id, appointments.patientId))
      .where(and(eq(appointments.doctorId, doctor.id), eq(appointments.status, 'completed'), PATIENT_WHERE))
      .groupBy(
        appointments.patientId,
        appointments.patientName,
        users.email,
        appointments.patientPhone,
        appointments.patientGender,
        appointments.patientAge,
      )
      .orderBy(desc(sql`max(${appointments.date})`));
    res.json({
      patients: rows.map((r) => ({ ...r, visitCount: Number(r.visitCount), age: ageFrom(null, r.age) })),
    });
  } catch (err) {
    next(err);
  }
});

doctorRouter.get('/patients/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: { message: 'id must be an integer' } });
      return;
    }
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }
    const [seen] = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctor.id),
          eq(appointments.patientId, id),
          eq(appointments.status, 'completed'),
        ),
      )
      .limit(1);
    if (!seen) {
      res.status(404).json({ error: { message: 'Patient not found' } });
      return;
    }
    const [patient] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        status: users.status,
        createdAt: users.createdAt,
        gender: patientProfiles.gender,
        dob: patientProfiles.dob,
        weight: patientProfiles.weight,
        height: patientProfiles.height,
        address: patientProfiles.address,
      })
      .from(users)
      .leftJoin(patientProfiles, eq(patientProfiles.userId, users.id))
      .where(and(eq(users.id, id), PATIENT_WHERE));
    if (!patient) {
      res.status(404).json({ error: { message: 'Patient not found' } });
      return;
    }
    const appointmentRows = await db
      .select({ ...appointmentColumns })
      .from(appointments)
      .where(and(eq(appointments.doctorId, doctor.id), eq(appointments.patientId, id)))
      .orderBy(desc(appointments.date), asc(appointments.timeSlot));
    const prescriptionRows = await db
      .select({
        id: prescriptions.id,
        appointmentId: prescriptions.appointmentId,
        diagnosis: prescriptions.diagnosis,
        medicines: prescriptions.medicines,
        advice: prescriptions.advice,
        followUpDate: prescriptions.followUpDate,
        createdAt: prescriptions.createdAt,
        date: appointments.date,
      })
      .from(prescriptions)
      .innerJoin(appointments, eq(appointments.id, prescriptions.appointmentId))
      .where(and(eq(prescriptions.patientId, id), eq(prescriptions.doctorId, doctor.id)))
      .orderBy(desc(prescriptions.createdAt));
    res.json({
      patient: { ...patient, age: ageFrom(patient.dob, null) },
      appointments: appointmentRows.map((row) => ({ ...row, id: row.bookingId })),
      prescriptions: prescriptionRows,
    });
  } catch (err) {
    next(err);
  }
});

// --- appointment detail ------------------------------------------------

doctorRouter.get('/appointments/:id', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }
    const [row] = await db
      .select({ ...appointmentColumns, doctorId: appointments.doctorId })
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
    const [prescription] = await db
      .select({
        id: prescriptions.id,
        appointmentId: prescriptions.appointmentId,
        diagnosis: prescriptions.diagnosis,
        medicines: prescriptions.medicines,
        advice: prescriptions.advice,
        followUpDate: prescriptions.followUpDate,
        createdAt: prescriptions.createdAt,
      })
      .from(prescriptions)
      .where(eq(prescriptions.appointmentId, row.id));
    res.json({ appointment: { ...row, id: row.bookingId }, prescription: prescription ?? null });
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
      .orderBy(asc(doctorSchedules.dayOfWeek), asc(doctorSchedules.windowStart));
    res.json({ schedules: rows });
  } catch (err) {
    next(err);
  }
});

doctorRouter.put('/schedules', async (req, res, next) => {
  try {
    const { windows } = schedulePutSchema.parse(req.body);
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }
    await db.transaction(async (tx) => {
      await tx.delete(doctorSchedules).where(eq(doctorSchedules.doctorId, doctor.id));
      const activeWindows = windows.filter(w => w.active);
      if (activeWindows.length > 0) {
        await tx.insert(doctorSchedules).values(
          activeWindows.map(w => ({
            doctorId: doctor.id,
            dayOfWeek: w.dayOfWeek,
            windowStart: w.windowStart,
            windowEnd: w.windowEnd,
            maxPatients: w.maxPatients,
            active: true,
          }))
        );
      }
    });
    const rows = await db
      .select()
      .from(doctorSchedules)
      .where(eq(doctorSchedules.doctorId, doctor.id))
      .orderBy(asc(doctorSchedules.dayOfWeek), asc(doctorSchedules.windowStart));
    res.json({ schedules: rows });
  } catch (err) {
    next(err);
  }
});

// --- PATCH /doctor/appointments/:id/reschedule ---

doctorRouter.patch('/appointments/:id/reschedule', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }
    const { date, windowStart, windowEnd } = rescheduleSchema.parse(req.body);

    const [row] = await db
      .select({ id: appointments.id, doctorId: appointments.doctorId, status: appointments.status })
      .from(appointments)
      .where(eq(appointments.bookingId, req.params.id));
    if (!row || row.doctorId !== doctor.id) {
      res.status(404).json({ error: { message: 'Appointment not found' } });
      return;
    }
    if (row.status !== 'upcoming') {
      res.status(400).json({ error: { message: 'Only upcoming appointments can be rescheduled' } });
      return;
    }

    const newSlot = await getNextFreeSlot(doctor.id, date, windowStart, windowEnd);
    if (!newSlot) {
      res.status(400).json({ error: { message: 'No available slots in this window' } });
      return;
    }

    await db
      .update(appointments)
      .set({ date, timeSlot: newSlot })
      .where(eq(appointments.id, row.id));

    res.json({ success: true, newDate: date, newTimeSlot: newSlot });
  } catch (err) {
    next(err);
  }
});
