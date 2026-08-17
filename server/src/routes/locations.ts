import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/pool';
import { doctors, doctorLocations } from '../db/schema';
import { requireAuth, requireRole } from '../middleware/auth';

export const doctorLocationsRouter = Router();

doctorLocationsRouter.use(requireAuth, requireRole('doctor'));

async function requireDoctor(userId: number) {
  const [doctor] = await db.select().from(doctors).where(eq(doctors.userId, userId));
  return doctor;
}

const createLocationSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  area: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  radiusKm: z.string().optional(),
});

const updateLocationSchema = createLocationSchema.partial();

const settingsSchema = z.object({
  homeVisitsEnabled: z.boolean().optional(),
  maxRadiusKm: z.string().optional(),
});

// --- GET /locations ---
doctorLocationsRouter.get('/locations', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(403).json({ error: { message: 'Doctor profile not found' } });
      return;
    }

    const locations = await db
      .select()
      .from(doctorLocations)
      .where(eq(doctorLocations.doctorId, doctor.id));

    res.json({
      locations,
      homeVisitsEnabled: doctor.homeVisitsEnabled,
      maxRadiusKm: doctor.maxRadiusKm,
    });
  } catch (err) {
    next(err);
  }
});

// --- POST /locations ---
doctorLocationsRouter.post('/locations', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(403).json({ error: { message: 'Doctor profile not found' } });
      return;
    }

    const body = createLocationSchema.parse(req.body);
    const [location] = await db
      .insert(doctorLocations)
      .values({ doctorId: doctor.id, ...body })
      .returning();

    res.status(201).json(location);
  } catch (err) {
    next(err);
  }
});

// --- PATCH /locations/settings ---
doctorLocationsRouter.patch('/locations/settings', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(403).json({ error: { message: 'Doctor profile not found' } });
      return;
    }

    const body = settingsSchema.parse(req.body);
    const [updated] = await db
      .update(doctors)
      .set(body)
      .where(eq(doctors.id, doctor.id))
      .returning();

    res.json({ homeVisitsEnabled: updated.homeVisitsEnabled, maxRadiusKm: updated.maxRadiusKm });
  } catch (err) {
    next(err);
  }
});

// --- PATCH /locations/:id ---
doctorLocationsRouter.patch('/locations/:id', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(403).json({ error: { message: 'Doctor profile not found' } });
      return;
    }

    const id = Number(req.params.id);
    const body = updateLocationSchema.parse(req.body);

    const [existing] = await db
      .select()
      .from(doctorLocations)
      .where(and(eq(doctorLocations.id, id), eq(doctorLocations.doctorId, doctor.id)));

    if (!existing) {
      res.status(404).json({ error: { message: 'Location not found' } });
      return;
    }

    const [updated] = await db
      .update(doctorLocations)
      .set(body)
      .where(eq(doctorLocations.id, id))
      .returning();

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// --- DELETE /locations/:id ---
doctorLocationsRouter.delete('/locations/:id', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(403).json({ error: { message: 'Doctor profile not found' } });
      return;
    }

    const id = Number(req.params.id);
    const [existing] = await db
      .select()
      .from(doctorLocations)
      .where(and(eq(doctorLocations.id, id), eq(doctorLocations.doctorId, doctor.id)));

    if (!existing) {
      res.status(404).json({ error: { message: 'Location not found' } });
      return;
    }

    await db.delete(doctorLocations).where(eq(doctorLocations.id, id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// --- PATCH /locations/:id/primary ---
doctorLocationsRouter.patch('/locations/:id/primary', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(403).json({ error: { message: 'Doctor profile not found' } });
      return;
    }

    const id = Number(req.params.id);
    const [existing] = await db
      .select()
      .from(doctorLocations)
      .where(and(eq(doctorLocations.id, id), eq(doctorLocations.doctorId, doctor.id)));

    if (!existing) {
      res.status(404).json({ error: { message: 'Location not found' } });
      return;
    }

    // Unset all other primary locations for this doctor
    await db
      .update(doctorLocations)
      .set({ isPrimary: false })
      .where(and(eq(doctorLocations.doctorId, doctor.id), eq(doctorLocations.isPrimary, true)));

    // Set this one as primary
    const [updated] = await db
      .update(doctorLocations)
      .set({ isPrimary: true })
      .where(eq(doctorLocations.id, id))
      .returning();

    res.json(updated);
  } catch (err) {
    next(err);
  }
});
