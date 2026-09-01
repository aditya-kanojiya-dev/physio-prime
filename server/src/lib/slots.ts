import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../db/pool';
import { appointments, doctorSchedules } from '../db/schema';

const WINDOWS = [
  { start: '07:00', end: '09:00', label: 'Early Morning' },
  { start: '09:00', end: '12:00', label: 'Morning' },
  { start: '12:00', end: '15:00', label: 'Afternoon' },
  { start: '15:00', end: '18:00', label: 'Evening' },
  { start: '18:00', end: '21:00', label: 'Night' },
] as const;

interface WindowWithCapacity {
  start: string;
  end: string;
  label: string;
  maxPatients: number;
  bookedCount: number;
  available: boolean;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nowHHmm(): string {
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

export async function getAvailableWindows(doctorId: number, dateStr: string): Promise<WindowWithCapacity[]> {
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

  const now = dateStr === todayStr() ? nowHHmm() : null;
  return schedules
    .map((s) => {
      const start = s.windowStart.slice(0, 5);
      const end = s.windowEnd.slice(0, 5);
      const bookedCount = booked.filter((b) => {
        const slotTime = b.timeSlot.split('-')[0];
        return slotTime >= start && slotTime < end;
      }).length;

      const windowDef = WINDOWS.find((w) => w.start === start);
      return {
        start,
        end,
        label: windowDef?.label ?? `${start}–${end}`,
        maxPatients: s.maxPatients,
        bookedCount,
        available: bookedCount < s.maxPatients,
      };
    })
    .filter((w) => (now ? w.end > now : true));
}

export async function getNextFreeSlot(doctorId: number, dateStr: string, windowStart: string, windowEnd: string): Promise<string | null> {
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

  const bookedStarts = new Set(booked.map((r) => r.timeSlot.split('-')[0]));
  const startMin = toMinutes(windowStart);
  const endMin = toMinutes(windowEnd);

  for (let t = startMin; t + 45 <= endMin; t += 45) {
    const slotStart = toHHmm(t);
    if (!bookedStarts.has(slotStart)) {
      return `${slotStart}-${toHHmm(t + 45)}`;
    }
  }
  return null;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function toHHmm(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ponytail: backward-compat helper for booking flow — returns available 45-min slots
export function availableFromSchedules(
  schedules: Array<{ windowStart: string; windowEnd: string; maxPatients: number }>,
  bookedStarts: string[],
  _dateStr: string,
): Array<{ start: string; end: string }> {
  const bookedSet = new Set(bookedStarts);
  const result: Array<{ start: string; end: string }> = [];

  for (const s of schedules) {
    const start = s.windowStart.slice(0, 5);
    const end = s.windowEnd.slice(0, 5);
    const startMin = toMinutes(start);
    const endMin = toMinutes(end);
    // count booked in this window
    const bookedInWindow = bookedStarts.filter((b) => b >= start && b < end).length;
    if (bookedInWindow >= s.maxPatients) continue;

    for (let t = startMin; t + 45 <= endMin; t += 45) {
      const slotStart = toHHmm(t);
      if (!bookedSet.has(slotStart)) {
        result.push({ start: slotStart, end: toHHmm(t + 45) });
      }
    }
  }
  return result;
}
