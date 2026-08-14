import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/pool';
import { patientProfiles, users } from '../db/schema';
import { requireAuth } from '../middleware/auth';
import { isValidDate } from '../lib/slots';

export const authRouter = Router();

const userColumns = {
  id: users.id,
  email: users.email,
  name: users.name,
  role: users.role,
  phone: users.phone,
  status: users.status,
};

const profileColumns = {
  gender: patientProfiles.gender,
  dob: patientProfiles.dob,
  weight: patientProfiles.weight,
  height: patientProfiles.height,
  address: patientProfiles.address,
};

async function getUserWithProfile(id: number) {
  const [row] = await db
    .select({ ...userColumns, ...profileColumns })
    .from(users)
    .leftJoin(patientProfiles, eq(patientProfiles.userId, users.id))
    .where(eq(users.id, id));
  return row ?? null;
}

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await getUserWithProfile(req.user!.id);
    if (!user) {
      res.status(401).json({ error: { message: 'Unauthorized' } });
      return;
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

const profilePatchSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(20).nullable().optional(),
  gender: z.enum(['male', 'female', 'other']).nullable().optional(),
  dob: z.string().refine(isValidDate, 'dob must be YYYY-MM-DD').nullable().optional(),
  weight: z.coerce.number().positive().max(500).nullable().optional(),
  height: z.coerce.number().positive().max(250).nullable().optional(),
  address: z.record(z.string(), z.unknown()).nullable().optional(),
});

authRouter.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const body = profilePatchSchema.parse(req.body);
    const userPatch = { name: body.name, phone: body.phone };
    const profilePatch: Record<string, unknown> = {};
    for (const key of ['gender', 'dob', 'weight', 'height', 'address'] as const) {
      if (body[key] !== undefined) profilePatch[key] = body[key];
    }
    if (Object.keys(body).length === 0) {
      res.status(400).json({ error: { message: 'Nothing to update' } });
      return;
    }
    if (userPatch.name !== undefined || userPatch.phone !== undefined) {
      await db
        .update(users)
        .set({
          ...(userPatch.name !== undefined ? { name: userPatch.name } : {}),
          ...(userPatch.phone !== undefined ? { phone: userPatch.phone } : {}),
        })
        .where(eq(users.id, req.user!.id));
    }
    if (Object.keys(profilePatch).length > 0) {
      await db
        .insert(patientProfiles)
        .values({ userId: req.user!.id, ...profilePatch })
        .onConflictDoUpdate({ target: patientProfiles.userId, set: profilePatch });
    }
    const updated = await getUserWithProfile(req.user!.id);
    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
});
