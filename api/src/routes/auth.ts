import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/pool';
import { users } from '../db/schema';
import { requireAuth } from '../middleware/auth';

export const authRouter = Router();

const userColumns = {
  id: users.id,
  email: users.email,
  name: users.name,
  role: users.role,
  phone: users.phone,
  status: users.status,
};

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const [user] = await db
      .select(userColumns)
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

const profilePatchSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(20).nullable().optional(),
});

authRouter.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const body = profilePatchSchema.parse(req.body);
    if (Object.keys(body).length === 0) {
      res.status(400).json({ error: { message: 'Nothing to update' } });
      return;
    }
    const [updated] = await db
      .update(users)
      .set(body)
      .where(eq(users.id, req.user!.id))
      .returning(userColumns);
    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
});
