import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/pool';
import { users } from '../db/schema';
import { requireAuth } from '../middleware/auth';

export const authRouter = Router();

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
