import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '../db/pool';
import { users, patientProfiles, doctorApplications } from '../db/schema';
import { signToken, type TokenUser } from '../lib/tokens';
import { requireAuth } from '../middleware/auth';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  phone: z.string().optional(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const applyDoctorSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  specialty: z.string().min(1),
  experienceYears: z.number().int().nonnegative().optional(),
  bio: z.string().optional(),
  licenseNumber: z.string().optional(),
});

function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const code = 'code' in err ? (err as { code?: unknown }).code : (err as { cause?: { code?: unknown } }).cause?.code;
  return code === '23505';
}

const publicUser = {
  id: users.id,
  role: users.role,
  name: users.name,
};

authRouter.post('/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await db
      .transaction(async (tx) => {
        const [u] = await tx
          .insert(users)
          .values({
            email: body.email,
            passwordHash,
            role: 'patient',
            name: body.name,
            phone: body.phone ?? null,
          })
          .returning(publicUser);
        await tx.insert(patientProfiles).values({ userId: u!.id });
        return u;
      });
    res.status(201).json({ token: signToken(user! as TokenUser), user });
  } catch (err) {
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: { message: 'Email already registered' } });
      return;
    }
    next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const [user] = await db.select().from(users).where(eq(users.email, body.email));
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      res.status(401).json({ error: { message: 'Invalid email or password' } });
      return;
    }
    if (user.status !== 'active') {
      res.status(403).json({ error: { message: 'Account pending approval' } });
      return;
    }
    res.json({
      token: signToken({ id: user.id, role: user.role as 'patient' | 'doctor' | 'admin' }),
      user: { id: user.id, role: user.role, name: user.name },
    });
  } catch (err) {
    next(err);
  }
});

// ponytail: doctor_applications has no specialty/experience columns yet; stash the
// extra application data in notes (JSON) so Phase 9 can consume it. Upgrade: add
// real columns via migration once the approval flow is built.
const EXTRA_APPLICATION_KEYS = ['specialty', 'experienceYears', 'bio', 'licenseNumber'] as const;

authRouter.post('/apply-doctor', async (req, res, next) => {
  try {
    const body = applyDoctorSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(body.password, 10);
    const notes = JSON.stringify(
      Object.fromEntries(EXTRA_APPLICATION_KEYS.filter((k) => body[k] != null).map((k) => [k, body[k]])),
    );
    const user = await db
      .transaction(async (tx) => {
        const [u] = await tx
          .insert(users)
          .values({
            email: body.email,
            passwordHash,
            role: 'doctor',
            status: 'inactive',
            name: body.name,
            phone: body.phone ?? null,
          })
          .returning(publicUser);
        await tx.insert(doctorApplications).values({ userId: u!.id, status: 'pending', notes });
        return u;
      });
    res.status(201).json({ user, application: { status: 'pending' } });
  } catch (err) {
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: { message: 'Email already registered' } });
      return;
    }
    next(err);
  }
});

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const [user] = await db
      .select({ id: users.id, email: users.email, name: users.name, role: users.role, phone: users.phone, status: users.status })
      .from(users)
      .where(eq(users.id, req.user!.id));
    if (!user) {
      res.status(401).json({ error: { message: 'Unauthorized' } });
      return;
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
});
