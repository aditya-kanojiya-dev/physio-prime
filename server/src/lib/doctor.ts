import { eq } from 'drizzle-orm';
import { db } from '../db/pool';
import { doctors } from '../db/schema';

export const noProfile = { status: 403, message: 'Doctor profile not approved yet' } as const;

export async function requireDoctor(userId: number) {
  const [doctor] = await db.select().from(doctors).where(eq(doctors.userId, userId));
  return doctor;
}
