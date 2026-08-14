import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../db/pool';
import { appointments, doctorSchedules } from '../db/schema';

// ponytail: naive local dates, single-clinic assumption
export interface Slot {
  start: string;
  end: string;
}

export interface ScheduleWindow {
  startTime: string;
  endTime: string;
  breakStart: string | null;
  breakEnd: string | null;
}

// ponytail: one session per bracket slot; doctor controls daily capacity via the
// window length + break. 3h window -> 4 sessions; shorten the window or add a
// break if 3 is the target.
const SLOT_MIN = 45;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function toHHmm(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function nowHHmm(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function isValidDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function dayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

export function isPast(dateStr: string): boolean {
  return dateStr < todayStr();
}

export function buildSlotList(schedule: ScheduleWindow): Slot[] {
  const start = toMinutes(schedule.startTime);
  const end = toMinutes(schedule.endTime);
  const bStart = schedule.breakStart != null ? toMinutes(schedule.breakStart) : null;
  const bEnd = schedule.breakEnd != null ? toMinutes(schedule.breakEnd) : null;
  const slots: Slot[] = [];
  for (let t = start; t + SLOT_MIN <= end; t += SLOT_MIN) {
    const s = t;
    const e = t + SLOT_MIN;
    if (bStart != null && bEnd != null && s < bEnd && e > bStart) continue;
    slots.push({ start: toHHmm(s), end: toHHmm(e) });
  }
  return slots;
}

export function availableFromSchedules(
  schedules: Array<{
    startTime: string;
    endTime: string;
    breakStart: string | null;
    breakEnd: string | null;
  }>,
  bookedStarts: string[],
  dateStr: string,
): Slot[] {
  const booked = new Set(bookedStarts);
  const now = nowHHmm();
  return schedules
    .flatMap((s) => buildSlotList(s))
    .filter((slot) => !booked.has(slot.start) && !(dateStr === todayStr() && slot.start <= now));
}

export async function getAvailableSlots(doctorId: number, dateStr: string): Promise<Slot[]> {
  const day = dayOfWeek(dateStr);
  const schedules = await db
    .select()
    .from(doctorSchedules)
    .where(
      and(
        eq(doctorSchedules.doctorId, doctorId),
        eq(doctorSchedules.dayOfWeek, day),
        eq(doctorSchedules.active, true),
      ),
    );
  if (schedules.length === 0) return [];

  const booked = await db
    .select({ timeSlot: appointments.timeSlot })
    .from(appointments)
    .where(
      and(
        eq(appointments.doctorId, doctorId),
        eq(appointments.date, dateStr),
        inArray(appointments.status, ['upcoming', 'completed']),
      ),
    );
  return availableFromSchedules(schedules, booked.map((r) => r.timeSlot.split('-')[0]), dateStr);
}

export async function getDaySlotCount(doctorId: number, dateStr: string): Promise<number> {
  const day = dayOfWeek(dateStr);
  const schedules = await db
    .select()
    .from(doctorSchedules)
    .where(
      and(
        eq(doctorSchedules.doctorId, doctorId),
        eq(doctorSchedules.dayOfWeek, day),
        eq(doctorSchedules.active, true),
      ),
    );
  return schedules.reduce((n, s) => n + buildSlotList(s).length, 0);
}
