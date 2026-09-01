import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '../src/db/pool';
import { appointments, doctors, doctorSchedules, users } from '../src/db/schema';
import { availableFromSchedules, dayOfWeek } from '../src/lib/slots';

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

export function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function futureWeekday(dayOfWeek: number): string {
  const d = new Date();
  let cur = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  while (cur.getDay() !== dayOfWeek) {
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
  }
  return `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
}

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function nowHHmm(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Free 45-min slots for a doctor+date, mirroring the booking route's availability logic.
// Booking tests pass dynamic slots instead of literal ones because `availableFromSchedules`
// aligns slots to window starts (09:00, 09:45, ...), not the hour.
export async function freeSlots(date: string, slug: string): Promise<string[]> {
  const [doc] = await db.select().from(doctors).where(eq(doctors.slug, slug));
  if (!doc) return [];
  const scheds = await db
    .select()
    .from(doctorSchedules)
    .where(
      and(
        eq(doctorSchedules.doctorId, doc.id),
        eq(doctorSchedules.dayOfWeek, dayOfWeek(date)),
        eq(doctorSchedules.active, true),
      ),
    )
    .orderBy(asc(doctorSchedules.windowStart));
  if (scheds.length === 0) return [];
  const booked = await db
    .select({ timeSlot: appointments.timeSlot })
    .from(appointments)
    .where(
      and(
        eq(appointments.doctorId, doc.id),
        eq(appointments.date, date),
        inArray(appointments.status, ['upcoming', 'completed']),
      ),
    );
  return availableFromSchedules(
    scheds,
    booked.map((a) => a.timeSlot.split('-')[0]),
    date,
  ).map((s) => `${s.start}-${s.end}`);
}

export async function pickSlot(date: string, slug: string): Promise<string> {
  const slots = await freeSlots(date, slug);
  if (slots.length === 0) throw new Error(`no free slots on ${date} for ${slug}`);
  return slots[0];
}