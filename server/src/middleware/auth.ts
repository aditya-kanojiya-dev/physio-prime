import type { NextFunction, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/pool';
import { users } from '../db/schema';
import type { TokenUser } from '../lib/tokens';
import { getSupabaseAdmin } from '../lib/supabase';

declare module 'express-serve-static-core' {
  interface Request {
    user?: TokenUser;
  }
}

// ponytail: resolves Supabase users by email and auto-creates the app users row on
// first login so appointments/reviews/etc. keep working unchanged. Could key users
// by supabase uid (sub) instead of email — switch when email-identity changes become a need.
async function resolveUser(email: string, name?: string | null): Promise<TokenUser | null> {
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    return { id: existing.id, role: existing.role as TokenUser['role'], email };
  }
  const [created] = await db
    .insert(users)
    .values({
      email,
      name: name || email.split('@')[0],
      role: 'patient',
      passwordHash: 'supabase-auth',
    })
    .returning({ id: users.id, role: users.role });
  return created ? { id: created.id, role: created.role as TokenUser['role'], email } : null;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: { message: 'Unauthorized' } });
    return;
  }
  try {
    const { data, error } = await getSupabaseAdmin().auth.getUser(header.slice('Bearer '.length));
    if (error || !data.user?.email) {
      console.error('requireAuth getUser failed:', error?.message);
      res.status(401).json({ error: { message: 'Unauthorized' } });
      return;
    }
    const tokenUser = await resolveUser(data.user.email, data.user.user_metadata?.name as string | undefined);
    if (!tokenUser) {
      res.status(401).json({ error: { message: 'Unauthorized' } });
      return;
    }
    req.user = tokenUser;
    next();
  } catch (err) {
    console.error('requireAuth threw:', err);
    res.status(401).json({ error: { message: 'Unauthorized' } });
  }
}

export function requireRole(...roles: TokenUser['role'][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: { message: 'Forbidden' } });
      return;
    }
    next();
  };
}
