import { Router } from 'express';
import { and, asc, count, desc, eq, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/pool';
import {
  appointments,
  categories,
  contentSections,
  doctorApplications,
  doctors,
  patientProfiles,
  prescriptions,
  reviews,
  symptoms,
  users,
} from '../db/schema';
import { requireAuth, requireRole } from '../middleware/auth';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('admin'));

const isDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');

function parseRange(query: Record<string, unknown>): { from: string | null; to: string | null; error?: { status: number; message: string } } {
  const from = typeof query.from === 'string' && query.from ? query.from : null;
  const to = typeof query.to === 'string' && query.to ? query.to : null;
  for (const [key, value] of [['from', from], ['to', to]] as const) {
    if (value !== null && !isDate.safeParse(value).success) {
      return { from, to, error: { status: 400, message: `${key} must be YYYY-MM-DD` } };
    }
  }
  return { from, to };
}

const doctorColumns = {
  id: doctors.id,
  userId: doctors.userId,
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
  doctorId: appointments.doctorId,
  mode: appointments.mode,
  date: appointments.date,
  timeSlot: appointments.timeSlot,
  status: appointments.status,
  symptom: appointments.symptom,
  feePaise: appointments.feePaise,
  address: appointments.address,
  paymentStatus: appointments.paymentStatus,
  razorpayOrderId: appointments.razorpayOrderId,
  patientName: appointments.patientName,
  patientPhone: appointments.patientPhone,
  patientRelation: appointments.patientRelation,
  videoCallLink: appointments.videoCallLink,
  cancellationReason: appointments.cancellationReason,
  createdAt: appointments.createdAt,
};

const patientColumns = {
  id: users.id,
  email: users.email,
  name: users.name,
  role: users.role,
  phone: users.phone,
  status: users.status,
  createdAt: users.createdAt,
};

// ponytail: patients are `users` rows with role='patient'; no separate table.
const PATIENT_WHERE = eq(users.role, 'patient');

// --- insights ----------------------------------------------------------

adminRouter.get('/insights', async (req, res, next) => {
  try {
    const { from, to, error } = parseRange(req.query as Record<string, unknown>);
    if (error) {
      res.status(error.status).json({ error: { message: error.message } });
      return;
    }
    const range = and(from ? sql`${appointments.date} >= ${from}` : undefined, to ? sql`${appointments.date} <= ${to}` : undefined);

    const [summary] = await db
      .select({
        totalBookings: count(appointments.id),
        revenuePaise: sql<number>`coalesce(sum(${appointments.feePaise} * case when ${appointments.paymentStatus} = 'paid' then 1 else 0 end), 0)`,
        newPatients: sql<number>`(select count(*) from users where users.role = 'patient')`,
      })
      .from(appointments)
      .where(range);

    const bookingsByMode = await db
      .select({ mode: appointments.mode, bookings: count(appointments.id) })
      .from(appointments)
      .where(range)
      .groupBy(appointments.mode)
      .orderBy(desc(count(appointments.id)));

    const bookingsByDay = await db
      .select({
        date: appointments.date,
        bookings: count(appointments.id),
        revenuePaise: sql<number>`coalesce(sum(case when ${appointments.paymentStatus} = 'paid' then ${appointments.feePaise} else 0 end), 0)`,
      })
      .from(appointments)
      .where(range)
      .groupBy(appointments.date)
      .orderBy(asc(appointments.date));

    const newPatientsByDay = await db
      .select({ date: sql<string>`${users.createdAt}::date`, count: count(users.id) })
      .from(users)
      .where(and(eq(users.role, 'patient'), from ? sql`${users.createdAt}::date >= ${from}` : undefined, to ? sql`${users.createdAt}::date <= ${to}` : undefined))
      .groupBy(sql`${users.createdAt}::date`)
      .orderBy(asc(sql`${users.createdAt}::date`));

    const topDoctors = await db
      .select({
        doctorId: appointments.doctorId,
        doctorName: doctors.name,
        bookings: count(appointments.id),
        revenuePaise: sql<number>`coalesce(sum(case when ${appointments.paymentStatus} = 'paid' then ${appointments.feePaise} else 0 end), 0)`,
      })
      .from(appointments)
      .innerJoin(doctors, eq(doctors.id, appointments.doctorId))
      .where(range)
      .groupBy(appointments.doctorId, doctors.name)
      .orderBy(desc(count(appointments.id)))
      .limit(5);

    // per-doctor client counts (distinct patients) — scope respects date range
    const doctorClients = await db
      .select({
        doctorId: appointments.doctorId,
        doctorName: doctors.name,
        clientCount: sql<number>`count(distinct ${appointments.patientId})`,
        bookings: count(appointments.id),
        revenuePaise: sql<number>`coalesce(sum(case when ${appointments.paymentStatus} = 'paid' then ${appointments.feePaise} else 0 end), 0)`,
      })
      .from(appointments)
      .innerJoin(doctors, eq(doctors.id, appointments.doctorId))
      .where(range)
      .groupBy(appointments.doctorId, doctors.name)
      .orderBy(desc(sql`count(distinct ${appointments.patientId})`));

    res.json({
      summary: { ...summary, revenuePaise: Number(summary.revenuePaise) },
      bookingsByMode,
      bookingsByDay: bookingsByDay.map((r) => ({ ...r, revenuePaise: Number(r.revenuePaise) })),
      newPatientsByDay,
      topDoctors: topDoctors.map((r) => ({ ...r, revenuePaise: Number(r.revenuePaise) })),
      doctorClients: doctorClients.map((r) => ({ ...r, clientCount: Number(r.clientCount), revenuePaise: Number(r.revenuePaise) })),
    });
  } catch (err) {
    next(err);
  }
});

// --- doctors -----------------------------------------------------------

adminRouter.get('/doctors', async (_req, res, next) => {
  try {
    const rows = await db
      .select({ ...doctorColumns, email: users.email })
      .from(doctors)
      .innerJoin(users, eq(users.id, doctors.userId))
      .orderBy(asc(doctors.name));
    res.json({ doctors: rows });
  } catch (err) {
    next(err);
  }
});

const doctorPatchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  title: z.string().max(200).optional(),
  specialty: z.string().max(200).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  photo: z.string().url().nullable().optional(),
  experienceYears: z.number().int().nonnegative().optional(),
  patientsTreated: z.number().int().nonnegative().optional(),
  languages: z.array(z.string()).optional(),
  location: z.record(z.string(), z.unknown()).optional(),
  fees: z.record(z.string(), z.number().nonnegative()).optional(),
  nextAvailable: isDate.nullable().optional(),
  verified: z.boolean().optional(),
  featured: z.boolean().optional(),
  gender: z.string().max(20).optional(),
  bio: z.string().max(5000).nullable().optional(),
  expertise: z.array(z.string()).optional(),
  treatments: z.array(z.string()).optional(),
});

adminRouter.patch('/doctors/:id', async (req, res, next) => {
  try {
    const body = doctorPatchSchema.parse(req.body);
    if (Object.keys(body).length === 0) {
      res.status(400).json({ error: { message: 'Nothing to update' } });
      return;
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: { message: 'id must be an integer' } });
      return;
    }
    const [updated] = await db.update(doctors).set(body).where(eq(doctors.id, id)).returning(doctorColumns);
    if (!updated) {
      res.status(404).json({ error: { message: 'Doctor not found' } });
      return;
    }
    res.json({ doctor: updated });
  } catch (err) {
    next(err);
  }
});

// --- doctor applications -----------------------------------------------

adminRouter.get('/doctor-applications', async (_req, res, next) => {
  try {
    const rows = await db
      .select({
        id: doctorApplications.id,
        userId: doctorApplications.userId,
        status: doctorApplications.status,
        appliedAt: doctorApplications.appliedAt,
        reviewedAt: doctorApplications.reviewedAt,
        notes: doctorApplications.notes,
        email: users.email,
        name: users.name,
      })
      .from(doctorApplications)
      .innerJoin(users, eq(users.id, doctorApplications.userId))
      .orderBy(asc(doctorApplications.appliedAt));
    res.json({ applications: rows });
  } catch (err) {
    next(err);
  }
});

const decideSchema = z.object({
  approve: z.boolean(),
  notes: z.string().max(2000).optional(),
});

adminRouter.post('/doctor-applications/:id/decide', async (req, res, next) => {
  try {
    const body = decideSchema.parse(req.body);
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: { message: 'id must be an integer' } });
      return;
    }
    const [application] = await db
      .select()
      .from(doctorApplications)
      .where(eq(doctorApplications.id, id));
    if (!application) {
      res.status(404).json({ error: { message: 'Application not found' } });
      return;
    }
    if (application.status !== 'pending') {
      res.status(400).json({ error: { message: 'Only pending applications can be decided' } });
      return;
    }
    const status = body.approve ? 'approved' : 'rejected';
    await db.transaction(async (tx) => {
      await tx
        .update(doctorApplications)
        .set({ status, reviewedAt: new Date(), notes: body.notes ?? null })
        .where(eq(doctorApplications.id, id));
      if (body.approve) {
        const [user] = await tx.select().from(users).where(eq(users.id, application.userId));
        const [doctor] = await tx.select({ id: doctors.id }).from(doctors).where(eq(doctors.userId, application.userId));
        if (!doctor && user) {
          await tx.insert(doctors).values({
            userId: user.id,
            name: user.name,
            slug: slugify(user.name, user.id),
            verified: true,
          });
        }
      }
    });
    res.json({ application: { id, status, reviewedAt: new Date(), notes: body.notes ?? null } });
  } catch (err) {
    next(err);
  }
});

function slugify(name: string, seed: number): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base || 'doctor'}-${seed}`;
}

// --- patients ----------------------------------------------------------

adminRouter.get('/patients', async (req, res, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    const rows = await db
      .select({
        ...patientColumns,
        appointmentCount: sql<number>`(select count(*) from appointments where appointments.patient_id = ${users.id})`,
      })
      .from(users)
      .where(and(PATIENT_WHERE, q ? sql`(lower(${users.name}) like ${`%${q}%`} or lower(${users.email}) like ${`%${q}%`})` : undefined))
      .orderBy(asc(users.name));
    res.json({ patients: rows });
  } catch (err) {
    next(err);
  }
});

// --- per-doctor client roster ------------------------------------------

adminRouter.get('/doctors/:id/clients', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: { message: 'id must be an integer' } });
      return;
    }
    const [doctor] = await db.select({ id: doctors.id, name: doctors.name }).from(doctors).where(eq(doctors.id, id));
    if (!doctor) {
      res.status(404).json({ error: { message: 'Doctor not found' } });
      return;
    }
    const clients = await db
      .select({
        patientId: appointments.patientId,
        name: users.name,
        email: users.email,
        phone: users.phone,
        appointmentCount: sql<number>`count(${appointments.id})`,
        lastVisit: sql<string>`max(${appointments.date})`,
        totalSpentPaise: sql<number>`coalesce(sum(case when ${appointments.paymentStatus} = 'paid' then ${appointments.feePaise} else 0 end), 0)`,
      })
      .from(appointments)
      .innerJoin(users, eq(users.id, appointments.patientId))
      .where(eq(appointments.doctorId, id))
      .groupBy(appointments.patientId, users.name, users.email, users.phone)
      .orderBy(desc(sql`count(${appointments.id})`));
    res.json({
      doctor,
      clients: clients.map((c) => ({ ...c, appointmentCount: Number(c.appointmentCount), totalSpentPaise: Number(c.totalSpentPaise) })),
    });
  } catch (err) {
    next(err);
  }
});

// --- patient detail -----------------------------------------------------

const patientDetailColumns = {
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
};

adminRouter.get('/patients/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: { message: 'id must be an integer' } });
      return;
    }
    const [patient] = await db
      .select(patientDetailColumns)
      .from(users)
      .leftJoin(patientProfiles, eq(patientProfiles.userId, users.id))
      .where(and(eq(users.id, id), PATIENT_WHERE));
    if (!patient) {
      res.status(404).json({ error: { message: 'Patient not found' } });
      return;
    }
    const appointmentRows = await db
      .select({ ...appointmentColumns, doctorName: doctors.name, doctorSpecialty: doctors.specialty })
      .from(appointments)
      .innerJoin(doctors, eq(doctors.id, appointments.doctorId))
      .where(eq(appointments.patientId, id))
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
        doctorName: doctors.name,
        date: appointments.date,
      })
      .from(prescriptions)
      .innerJoin(doctors, eq(doctors.id, prescriptions.doctorId))
      .innerJoin(appointments, eq(appointments.id, prescriptions.appointmentId))
      .where(eq(prescriptions.patientId, id))
      .orderBy(desc(prescriptions.createdAt));
    const [summary] = await db
      .select({
        appointmentCount: count(appointments.id),
        totalSpentPaise: sql<number>`coalesce(sum(case when ${appointments.paymentStatus} = 'paid' then ${appointments.feePaise} else 0 end), 0)`,
        paidCount: sql<number>`count(*) filter (where ${appointments.paymentStatus} = 'paid')`,
      })
      .from(appointments)
      .where(eq(appointments.patientId, id));
    res.json({
      patient,
      summary: {
        ...summary,
        appointmentCount: Number(summary.appointmentCount),
        totalSpentPaise: Number(summary.totalSpentPaise),
        paidCount: Number(summary.paidCount),
      },
      appointments: appointmentRows.map((row) => ({ ...row, id: row.bookingId })),
      prescriptions: prescriptionRows,
    });
  } catch (err) {
    next(err);
  }
});

// --- prescriptions ------------------------------------------------------

adminRouter.get('/prescriptions', async (_req, res, next) => {
  try {
    const rows = await db
      .select({
        id: prescriptions.id,
        appointmentId: prescriptions.appointmentId,
        bookingId: appointments.bookingId,
        patientId: prescriptions.patientId,
        patientName: appointments.patientName,
        doctorName: doctors.name,
        diagnosis: prescriptions.diagnosis,
        medicines: prescriptions.medicines,
        advice: prescriptions.advice,
        followUpDate: prescriptions.followUpDate,
        createdAt: prescriptions.createdAt,
      })
      .from(prescriptions)
      .innerJoin(doctors, eq(doctors.id, prescriptions.doctorId))
      .innerJoin(appointments, eq(appointments.id, prescriptions.appointmentId))
      .orderBy(desc(prescriptions.createdAt));
    res.json({ prescriptions: rows });
  } catch (err) {
    next(err);
  }
});

// --- appointments ------------------------------------------------------

const ALLOWED_STATUS = ['upcoming', 'completed', 'cancelled', 'no_show'];
const ALLOWED_PAYMENT_STATUS = ['pending', 'paid', 'failed', 'refunded'];

adminRouter.get('/appointments', async (req, res, next) => {
  try {
    const query = req.query as Record<string, unknown>;
    const filters: SQL[] = [];
    if (typeof query.status === 'string' && query.status) {
      if (!ALLOWED_STATUS.includes(query.status)) {
        res.status(400).json({ error: { message: `status must be one of ${ALLOWED_STATUS.join(', ')}` } });
        return;
      }
      filters.push(eq(appointments.status, query.status));
    }
    if (typeof query.paymentStatus === 'string' && query.paymentStatus) {
      if (!ALLOWED_PAYMENT_STATUS.includes(query.paymentStatus)) {
        res.status(400).json({ error: { message: `paymentStatus must be one of ${ALLOWED_PAYMENT_STATUS.join(', ')}` } });
        return;
      }
      filters.push(eq(appointments.paymentStatus, query.paymentStatus));
    }
    if (typeof query.q === 'string' && query.q.trim()) {
      const q = `%${query.q.trim().toLowerCase()}%`;
      filters.push(
        sql`(lower(${appointments.patientName}) like ${q} or lower(${doctors.name}) like ${q} or lower(${appointments.bookingId}) like ${q})`,
      );
    }
    if (typeof query.mode === 'string' && query.mode) {
      if (!['home', 'online', 'clinic'].includes(query.mode)) {
        res.status(400).json({ error: { message: 'mode must be home, online or clinic' } });
        return;
      }
      filters.push(eq(appointments.mode, query.mode));
    }
    if (query.date) {
      const parsed = isDate.safeParse(query.date);
      if (!parsed.success) {
        res.status(400).json({ error: { message: 'date must be YYYY-MM-DD' } });
        return;
      }
      filters.push(eq(appointments.date, parsed.data));
    }
    if (query.doctorId) {
      const doctorId = Number(query.doctorId);
      if (!Number.isInteger(doctorId)) {
        res.status(400).json({ error: { message: 'doctorId must be an integer' } });
        return;
      }
      filters.push(eq(appointments.doctorId, doctorId));
    }
    const { from, to, error } = parseRange(query);
    if (error) {
      res.status(error.status).json({ error: { message: error.message } });
      return;
    }
    if (from) filters.push(sql`${appointments.date} >= ${from}`);
    if (to) filters.push(sql`${appointments.date} <= ${to}`);

    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));

    const [{ total }] = await db
      .select({ total: count(appointments.id) })
      .from(appointments)
      .where(and(...filters));
    const rows = await db
      .select({ ...appointmentColumns, doctorName: doctors.name })
      .from(appointments)
      .innerJoin(doctors, eq(doctors.id, appointments.doctorId))
      .where(and(...filters))
      .orderBy(desc(appointments.date), asc(appointments.timeSlot))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    res.json({
      appointments: rows.map((row) => ({ ...row, id: row.bookingId })),
      pagination: { page, pageSize, total: Number(total), pages: Math.ceil(Number(total) / pageSize) },
    });
  } catch (err) {
    next(err);
  }
});

// --- users -------------------------------------------------------------

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['patient', 'doctor', 'admin']),
  phone: z.string().max(20).nullable().optional(),
});

adminRouter.post('/users', async (req, res, next) => {
  try {
    const body = createUserSchema.parse(req.body);
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email));
    if (existing) {
      res.status(409).json({ error: { message: 'A user with this email already exists' } });
      return;
    }
    // ponytail: passwords live in Supabase Auth; the app users row is the
    // role/identity mirror keyed by email (see middleware/resolveUser).
    const [created] = await db
      .insert(users)
      .values({
        email: body.email,
        passwordHash: 'supabase-auth',
        role: body.role,
        name: body.name,
        phone: body.phone ?? null,
      })
      .returning({ ...patientColumns });
    res.status(201).json({ user: created });
  } catch (err) {
    next(err);
  }
});

const patchUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['patient', 'doctor', 'admin']).optional(),
  phone: z.string().max(20).nullable().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

adminRouter.patch('/users/:id', async (req, res, next) => {
  try {
    const body = patchUserSchema.parse(req.body);
    if (Object.keys(body).length === 0) {
      res.status(400).json({ error: { message: 'Nothing to update' } });
      return;
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: { message: 'id must be an integer' } });
      return;
    }
    const [updated] = await db.update(users).set(body).where(eq(users.id, id)).returning(patientColumns);
    if (!updated) {
      res.status(404).json({ error: { message: 'User not found' } });
      return;
    }
    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
});

// --- categories --------------------------------------------------------

const categorySchema = z.object({
  title: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().max(1000).nullable().optional(),
  image: z.string().url().nullable().optional(),
  color: z.string().max(50).nullable().optional(),
  conditions: z.array(z.string()).optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

adminRouter.get('/categories', async (_req, res, next) => {
  try {
    const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));
    res.json({ categories: rows });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/categories', async (req, res, next) => {
  try {
    const body = categorySchema.parse(req.body);
    const [created] = await db
      .insert(categories)
      .values({ ...body, conditions: body.conditions ?? [], active: body.active ?? true })
      .returning();
    res.status(201).json({ category: created });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/categories/:id', async (req, res, next) => {
  try {
    const body = categorySchema.partial().parse(req.body);
    if (Object.keys(body).length === 0) {
      res.status(400).json({ error: { message: 'Nothing to update' } });
      return;
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: { message: 'id must be an integer' } });
      return;
    }
    const [updated] = await db.update(categories).set(body).where(eq(categories.id, id)).returning();
    if (!updated) {
      res.status(404).json({ error: { message: 'Category not found' } });
      return;
    }
    res.json({ category: updated });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/categories/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: { message: 'id must be an integer' } });
      return;
    }
    const deleted = await db.delete(categories).where(eq(categories.id, id)).returning({ id: categories.id });
    if (deleted.length === 0) {
      res.status(404).json({ error: { message: 'Category not found' } });
      return;
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// --- symptoms ----------------------------------------------------------

const symptomSchema = z.object({
  title: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  iconName: z.string().max(100).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  popularFor: z.record(z.string(), z.unknown()).optional(),
  recoveryEstimate: z.string().max(200).nullable().optional(),
  image: z.string().url().nullable().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

adminRouter.get('/symptoms', async (_req, res, next) => {
  try {
    const rows = await db.select().from(symptoms).orderBy(asc(symptoms.sortOrder), asc(symptoms.id));
    res.json({ symptoms: rows });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/symptoms', async (req, res, next) => {
  try {
    const body = symptomSchema.parse(req.body);
    const [created] = await db
      .insert(symptoms)
      .values({ ...body, popularFor: body.popularFor ?? {}, active: body.active ?? true })
      .returning();
    res.status(201).json({ symptom: created });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/symptoms/:id', async (req, res, next) => {
  try {
    const body = symptomSchema.partial().parse(req.body);
    if (Object.keys(body).length === 0) {
      res.status(400).json({ error: { message: 'Nothing to update' } });
      return;
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: { message: 'id must be an integer' } });
      return;
    }
    const [updated] = await db.update(symptoms).set(body).where(eq(symptoms.id, id)).returning();
    if (!updated) {
      res.status(404).json({ error: { message: 'Symptom not found' } });
      return;
    }
    res.json({ symptom: updated });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/symptoms/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: { message: 'id must be an integer' } });
      return;
    }
    const deleted = await db.delete(symptoms).where(eq(symptoms.id, id)).returning({ id: symptoms.id });
    if (deleted.length === 0) {
      res.status(404).json({ error: { message: 'Symptom not found' } });
      return;
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// --- CMS ---------------------------------------------------------------

const cmsPutSchema = z.object({
  data: z.record(z.string(), z.unknown()),
  sortOrder: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

adminRouter.get('/cms', async (_req, res, next) => {
  try {
    const rows = await db.select().from(contentSections).orderBy(asc(contentSections.page), asc(contentSections.sortOrder));
    res.json({ sections: rows });
  } catch (err) {
    next(err);
  }
});

adminRouter.put('/cms/:page/:key', async (req, res, next) => {
  try {
    const page = req.params.page;
    const key = req.params.key;
    if (!['home', 'about', 'footer'].includes(page)) {
      res.status(400).json({ error: { message: 'page must be home, about or footer' } });
      return;
    }
    const body = cmsPutSchema.parse(req.body);
    const [existing] = await db
      .select({ id: contentSections.id, sortOrder: contentSections.sortOrder })
      .from(contentSections)
      .where(and(eq(contentSections.page, page), eq(contentSections.key, key)));
    const [saved] = existing
      ? await db
          .update(contentSections)
          .set({ data: body.data, sortOrder: body.sortOrder ?? existing.sortOrder, active: body.active ?? true })
          .where(eq(contentSections.id, existing.id))
          .returning()
      : await db
          .insert(contentSections)
          .values({ page, key, data: body.data, sortOrder: body.sortOrder ?? 0, active: body.active ?? true })
          .returning();
    res.json({ section: saved });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/cms/:page/:key', async (req, res, next) => {
  try {
    const deleted = await db
      .delete(contentSections)
      .where(and(eq(contentSections.page, req.params.page), eq(contentSections.key, req.params.key)))
      .returning({ id: contentSections.id });
    if (deleted.length === 0) {
      res.status(404).json({ error: { message: 'Section not found' } });
      return;
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
