import { Router } from 'express';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/pool';
import { appointments, doctors, doctorSchedules } from '../db/schema';
import { requireAuth, requireRole } from '../middleware/auth';
import { availableFromSchedules, dayOfWeek, isPast, isValidDate } from '../lib/slots';
import { createOrder, verifySignature } from '../lib/razorpay';
import { sendNotification, templates, type NotificationCtx } from '../lib/notifications';

export const appointmentsRouter = Router();

appointmentsRouter.use(requireAuth, requireRole('patient'));

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

class BookingError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const dateField = z.string().refine(isValidDate, 'date must be YYYY-MM-DD');

const bookSchema = z.object({
  doctorSlug: z.string().min(1),
  mode: z.enum(['home', 'online']),
  date: dateField,
  slot: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, 'slot must be HH:MM-HH:MM'),
  symptom: z.string().max(2000).optional(),
  patientName: z.string().min(1),
  patientPhone: z.string().min(7).max(20),
  patientEmail: z.string().email().optional(),
  patientGender: z.enum(['male', 'female', 'other']).optional(),
  patientAge: z.coerce.number().int().min(1).max(120).optional(),
  patientWeight: z.coerce.number().positive().max(500).optional(),
  patientHeight: z.coerce.number().positive().max(250).optional(),
  patientRelation: z.string().trim().max(50).optional(),
  address: z.record(z.string(), z.unknown()).optional(),
  paymentMode: z.enum(['prepay', 'postpay']).optional(),
});

const verifySchema = z.object({
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

const rescheduleSchema = z.object({
  date: dateField,
  slot: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, 'slot must be HH:MM-HH:MM'),
});

const cancelSchema = z.object({
  reason: z.string().max(1000).optional(),
});

function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const e = err as { code?: unknown; cause?: { code?: unknown } };
  return e.code === '23505' || e.cause?.code === '23505';
}

function randomBookingId(): string {
  return `APT-${String(Math.floor(100000 + Math.random() * 900000))}`;
}

interface AppointmentView {
  id: number;
  bookingId: string;
  patientId: number;
  doctorId: number;
  mode: string;
  date: string;
  timeSlot: string;
  status: string;
  symptom: string | null;
  feePaise: number;
  address: unknown;
  paymentMode: string;
  paymentStatus: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  patientName: string;
  patientPhone: string;
  patientEmail: string | null;
  patientGender: string | null;
  patientAge: number | null;
  patientWeight: string | null;
  patientHeight: string | null;
  patientRelation: string | null;
  videoCallLink: string | null;
  cancellationReason: string | null;
  createdAt: Date;
  doctor?: {
    slug: string;
    name: string;
    title: string | null;
    specialty: string | null;
    photo: string | null;
    location: unknown;
  } | null;
}

const appointmentColumns = {
  id: appointments.id,
  bookingId: appointments.bookingId,
  patientId: appointments.patientId,
  doctorId: appointments.doctorId,
  mode: appointments.mode,
  date: appointments.date,
  timeSlot: appointments.timeSlot,
  status: appointments.status,
  symptom: appointments.symptom,
  feePaise: appointments.feePaise,
  address: appointments.address,
  paymentMode: appointments.paymentMode,
  paymentStatus: appointments.paymentStatus,
  razorpayOrderId: appointments.razorpayOrderId,
  razorpayPaymentId: appointments.razorpayPaymentId,
  patientName: appointments.patientName,
  patientPhone: appointments.patientPhone,
  patientEmail: appointments.patientEmail,
  patientGender: appointments.patientGender,
  patientAge: appointments.patientAge,
  patientWeight: appointments.patientWeight,
  patientHeight: appointments.patientHeight,
  patientRelation: appointments.patientRelation,
  videoCallLink: appointments.videoCallLink,
  cancellationReason: appointments.cancellationReason,
  createdAt: appointments.createdAt,
};

const doctorSummary = {
  slug: doctors.slug,
  name: doctors.name,
  title: doctors.title,
  specialty: doctors.specialty,
  photo: doctors.photo,
  location: doctors.location,
};

function serializeAppointment(row: AppointmentView) {
  return {
    id: row.bookingId,
    doctorId: row.doctorId,
    doctor: row.doctor
      ? {
          id: row.doctor.slug,
          slug: row.doctor.slug,
          name: row.doctor.name,
          title: row.doctor.title,
          specialty: row.doctor.specialty,
          photo: row.doctor.photo,
          location: row.doctor.location,
        }
      : null,
    mode: row.mode,
    date: row.date,
    timeSlot: row.timeSlot,
    status: row.status,
    symptom: row.symptom,
    feePaise: row.feePaise,
    address: row.address,
    paymentMode: row.paymentMode,
    paymentStatus: row.paymentStatus,
    razorpayOrderId: row.razorpayOrderId,
    razorpayPaymentId: row.razorpayPaymentId,
    patientName: row.patientName,
    patientPhone: row.patientPhone,
    patientEmail: row.patientEmail,
    patientGender: row.patientGender,
    patientAge: row.patientAge,
    patientWeight: row.patientWeight,
    patientHeight: row.patientHeight,
    patientRelation: row.patientRelation,
    videoCallLink: row.videoCallLink,
    cancellationReason: row.cancellationReason,
    createdAt: row.createdAt,
  };
}

// Send booking notifications for an appointment after a state change. Never
// blocks or fails the caller: sendNotification never throws, and any DB read
// here is defensively swallowed so a hook can never turn a committed booking
// into a 500.
async function sendBookingNotifications(
  row: AppointmentView,
  kind: 'confirmed' | 'rescheduled' | 'cancelled',
  extra: { refunded?: boolean; amountPaise?: number } = {},
): Promise<void> {
  try {
    const [doctorRow] = row.doctor
      ? []
      : await db.select({ name: doctors.name }).from(doctors).where(eq(doctors.id, row.doctorId));
    const ctx: NotificationCtx = {
      patientName: row.patientName,
      doctorName: row.doctor?.name ?? doctorRow?.name ?? 'your physiotherapist',
      date: row.date,
      timeSlot: row.timeSlot,
      mode: row.mode,
      bookingId: row.bookingId,
    };
    const tpl =
      kind === 'confirmed'
        ? templates.bookingConfirmed({ ...ctx, amountPaise: extra.amountPaise })
        : kind === 'rescheduled'
          ? templates.bookingRescheduled(ctx)
          : templates.bookingCancelled({ ...ctx, refunded: extra.refunded });

    if (row.patientPhone) {
      await sendNotification({
        userId: row.patientId,
        appointmentId: row.id,
        channel: 'whatsapp',
        to: row.patientPhone,
        subject: tpl.subject,
        body: tpl.body,
        template: kind,
      });
    }
  } catch {
    // ponytail: notifications must never affect the booking response
  }
}

// Available slot starts (HH:mm) for a doctor+date, computed on the caller's
// connection so the booking/reschedule transaction sees its own snapshot after
// acquiring the doctor/appointment row lock.
async function availableStarts(tx: Tx, doctorId: number, date: string): Promise<Set<string>> {
  const schedules = await tx
    .select()
    .from(doctorSchedules)
    .where(
      and(
        eq(doctorSchedules.doctorId, doctorId),
        eq(doctorSchedules.dayOfWeek, dayOfWeek(date)),
        eq(doctorSchedules.active, true),
      ),
    );
  const booked = await tx
    .select({ timeSlot: appointments.timeSlot })
    .from(appointments)
    .where(
      and(
        eq(appointments.doctorId, doctorId),
        eq(appointments.date, date),
        inArray(appointments.status, ['upcoming', 'completed']),
      ),
    );
  return new Set(
    availableFromSchedules(schedules, booked.map((r) => r.timeSlot.split('-')[0]), date).map((s) => s.start),
  );
}

async function bookTransaction(
  doctor: typeof doctors.$inferSelect,
  feePaise: number,
  body: z.infer<typeof bookSchema>,
  userId: number,
  patientEmail: string,
): Promise<{ row: AppointmentView; order: { id: string; amountPaise: number } | null }> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const bookingId = randomBookingId();
    try {
      return await db.transaction(async (tx) => {
        // serialize concurrent bookings for the same doctor
        await tx.select().from(doctors).where(eq(doctors.id, doctor.id)).for('update');
        const starts = await availableStarts(tx, doctor.id, body.date);
        if (!starts.has(body.slot.split('-')[0])) {
          throw new BookingError(409, 'This slot is no longer available');
        }
        const [row] = await tx
          .insert(appointments)
          .values({
            bookingId,
            patientId: userId,
            doctorId: doctor.id,
            mode: body.mode,
            date: body.date,
            timeSlot: body.slot,
            status: 'upcoming',
            symptom: body.symptom ?? null,
            feePaise,
            address: body.address ?? {},
            paymentMode: body.paymentMode ?? 'prepay',
            paymentStatus: 'pending',
            patientName: body.patientName,
            patientPhone: body.patientPhone,
            patientEmail: body.patientEmail ?? patientEmail,
            patientGender: body.patientGender ?? null,
            patientAge: body.patientAge ?? null,
            patientWeight: body.patientWeight != null ? String(body.patientWeight) : null,
            patientHeight: body.patientHeight != null ? String(body.patientHeight) : null,
            patientRelation: body.patientRelation ?? null,
            videoCallLink: body.mode === 'online' ? `https://meet.physioprime.in/${bookingId}` : null,
          })
          .returning();
        let order: { id: string; amountPaise: number } | null = null;
        if ((body.paymentMode ?? 'prepay') === 'prepay') {
          try {
            order = await createOrder({ amountPaise: feePaise, receipt: bookingId });
          } catch (err) {
            if (!(err instanceof Error) || !err.message.includes('not configured')) throw err;
            // ponytail: razorpay not configured — trial booking proceeds unpaid
          }
        }
        if (order) {
          await tx.update(appointments).set({ razorpayOrderId: order.id }).where(eq(appointments.id, row!.id));
        }
        return { row: { ...row!, razorpayOrderId: order?.id ?? null }, order };
      });
    } catch (err) {
      if (attempt === 0 && isUniqueViolation(err)) continue;
      throw err;
    }
  }
  throw new Error('Could not allocate a unique booking id');
}

appointmentsRouter.get('/', async (req, res, next) => {
  try {
    const rows = await db
      .select({ ...appointmentColumns, doctor: doctorSummary })
      .from(appointments)
      .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
      .where(eq(appointments.patientId, req.user!.id))
      .orderBy(desc(appointments.id));
    res.json({ appointments: rows.map((row) => serializeAppointment(row)) });
  } catch (err) {
    next(err);
  }
});

appointmentsRouter.post('/', async (req, res, next) => {
  try {
    const body = bookSchema.parse(req.body);
    if (isPast(body.date)) {
      res.status(400).json({ error: { message: 'Date is in the past' } });
      return;
    }

    const [doctor] = await db.select().from(doctors).where(eq(doctors.slug, body.doctorSlug));
    if (!doctor) {
      res.status(404).json({ error: { message: 'Doctor not found' } });
      return;
    }
    const fees = (doctor.fees ?? {}) as Record<string, number>;
    const feeRupees = fees[body.mode];
    if (feeRupees == null) {
      res.status(400).json({ error: { message: `This doctor does not offer ${body.mode} appointments` } });
      return;
    }
    const feePaise = Math.round(feeRupees * 100);

    const booked = await bookTransaction(doctor, feePaise, body, req.user!.id, req.user!.email);
    res.status(201).json({
      appointment: serializeAppointment({
        ...booked.row,
        doctor: {
          slug: doctor.slug,
          name: doctor.name,
          title: doctor.title,
          specialty: doctor.specialty,
          photo: doctor.photo,
          location: doctor.location,
        },
      }),
      razorpayOrder: booked.order,
    });
  } catch (err) {
    if (err instanceof BookingError) {
      res.status(err.status).json({ error: { message: err.message } });
      return;
    }
    next(err);
  }
});

appointmentsRouter.get('/:id', async (req, res, next) => {
  try {
    const [row] = await db
      .select({ ...appointmentColumns, doctor: doctorSummary })
      .from(appointments)
      .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
      .where(eq(appointments.bookingId, req.params.id));
    if (!row) {
      res.status(404).json({ error: { message: 'Appointment not found' } });
      return;
    }
    if (row.patientId !== req.user!.id) {
      res.status(403).json({ error: { message: 'Forbidden' } });
      return;
    }
    res.json({ appointment: serializeAppointment(row) });
  } catch (err) {
    next(err);
  }
});

appointmentsRouter.post('/:id/verify', async (req, res, next) => {
  try {
    const body = verifySchema.parse(req.body);
    const [row] = await db.select(appointmentColumns).from(appointments).where(eq(appointments.bookingId, req.params.id));
    if (!row) {
      res.status(404).json({ error: { message: 'Appointment not found' } });
      return;
    }
    if (row.patientId !== req.user!.id) {
      res.status(403).json({ error: { message: 'Forbidden' } });
      return;
    }
    if (row.paymentStatus === 'paid' && row.status === 'upcoming') {
      res.json({ appointment: serializeAppointment(row) });
      return;
    }
    if (row.status !== 'upcoming') {
      res.status(400).json({ error: { message: 'Only upcoming appointments can be verified' } });
      return;
    }
    if (!row.razorpayOrderId) {
      res.status(400).json({ error: { message: 'Appointment has no payment order' } });
      return;
    }
    if (!verifySignature({ orderId: row.razorpayOrderId, paymentId: body.razorpayPaymentId, signature: body.razorpaySignature })) {
      res.status(400).json({ error: { message: 'Invalid payment signature' } });
      return;
    }
    const [updated] = await db
      .update(appointments)
      .set({ paymentStatus: 'paid', razorpayPaymentId: body.razorpayPaymentId })
      .where(eq(appointments.bookingId, req.params.id))
      .returning(appointmentColumns);
    await sendBookingNotifications(updated!, 'confirmed', { amountPaise: updated!.feePaise });
    res.json({ appointment: serializeAppointment(updated!) });
  } catch (err) {
    next(err);
  }
});

appointmentsRouter.post('/:id/reschedule', async (req, res, next) => {
  try {
    const body = rescheduleSchema.parse(req.body);
    if (isPast(body.date)) {
      res.status(400).json({ error: { message: 'Date is in the past' } });
      return;
    }
    const { row: updated, changed } = await db.transaction(async (tx) => {
      const [row] = await tx
        .select(appointmentColumns)
        .from(appointments)
        .where(eq(appointments.bookingId, req.params.id))
        .for('update');
      if (!row) throw new BookingError(404, 'Appointment not found');
      if (row.patientId !== req.user!.id) throw new BookingError(403, 'Forbidden');
      if (row.status !== 'upcoming') throw new BookingError(400, 'Only upcoming appointments can be rescheduled');
      if (row.date === body.date && row.timeSlot === body.slot) return { row, changed: false };
      // serialize concurrent bookings/reschedules for the same doctor, mirroring the booking path
      await tx.select().from(doctors).where(eq(doctors.id, row.doctorId)).for('update');
      const starts = await availableStarts(tx, row.doctorId, body.date);
      if (!starts.has(body.slot.split('-')[0])) throw new BookingError(409, 'This slot is no longer available');
      const [updated] = await tx
        .update(appointments)
        .set({ date: body.date, timeSlot: body.slot })
        .where(eq(appointments.bookingId, req.params.id))
        .returning(appointmentColumns);
      return { row: updated!, changed: true };
    });
    if (changed) await sendBookingNotifications(updated, 'rescheduled');
    res.json({ appointment: serializeAppointment(updated) });
  } catch (err) {
    if (err instanceof BookingError) {
      res.status(err.status).json({ error: { message: err.message } });
      return;
    }
    next(err);
  }
});

appointmentsRouter.post('/:id/cancel', async (req, res, next) => {
  try {
    const body = cancelSchema.parse(req.body);
    const updated = await db.transaction(async (tx) => {
      const [row] = await tx
        .select(appointmentColumns)
        .from(appointments)
        .where(eq(appointments.bookingId, req.params.id))
        .for('update');
      if (!row) throw new BookingError(404, 'Appointment not found');
      if (row.patientId !== req.user!.id) throw new BookingError(403, 'Forbidden');
      if (row.status !== 'upcoming') throw new BookingError(400, 'Only upcoming appointments can be cancelled');
      // Non-refundable per Terms: a patient-initiated cancellation keeps the payment.
      // Do not issue a refund here — it would contradict the agreed policy.
      const [updated] = await tx
        .update(appointments)
        .set({ status: 'cancelled', cancellationReason: body.reason ?? null, paymentStatus: row.paymentStatus })
        .where(eq(appointments.bookingId, req.params.id))
        .returning(appointmentColumns);
      return updated!;
    });
    await sendBookingNotifications(updated, 'cancelled', { refunded: false });
    res.json({ appointment: serializeAppointment(updated) });
  } catch (err) {
    if (err instanceof BookingError) {
      res.status(err.status).json({ error: { message: err.message } });
      return;
    }
    next(err);
  }
});
