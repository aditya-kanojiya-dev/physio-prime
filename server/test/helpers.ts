import { eq } from 'drizzle-orm';
import { db } from '../src/db/pool';
import { users } from '../src/db/schema';

// The middleware auto-creates users rows from a Supabase email, so many tests can
// just pass `Bearer email@example.com` with no DB setup. This helper is for tests
// that need the user's id up front (reviews, notifications, role switches).
export async function registerPatient(email: string): Promise<{ token: string; id: number }> {
  const [user] = await db
    .insert(users)
    .values({ email, name: 'Test Patient', passwordHash: 'supabase-auth', role: 'patient' })
    .returning({ id: users.id });
  return { token: email, id: user.id };
}

export async function registerAdmin(email: string): Promise<{ token: string }> {
  const { id } = await registerPatient(email);
  await db.update(users).set({ role: 'admin' }).where(eq(users.id, id));
  return { token: email };
}
