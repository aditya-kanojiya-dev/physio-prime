# Schedule & Appointments Redesign — Implementation Plan

> **For agentic workers:** Use subagent-driven-development or executing-plans to implement task-by-task.

**Goal:** Replace raw time-slot scheduling with 3-hour windows with per-window capacity. Simplify appointment actions to three clear buttons. Make schedule management a quick weekly grid.

**Architecture:** Alter `doctor_schedules` table to use fixed windows with `maxPatients`. Rewrite slot logic for window-based capacity. Rewrite schedule page as week grid. Rewrite appointments page as card list with Done / Didn't come / Change time actions.

**Tech Stack:** Drizzle ORM (PostgreSQL), Express 5, React 19, TanStack Query, Tailwind CSS, recharts (if needed), lucide-react icons

## Global Constraints
- Brand: teal-600/blue-600 gradients, rounded-3xl cards, Plus Jakarta Sans
- Card style: `rounded-3xl bg-white border border-slate-200 shadow-xl`
- Button gradient: `bg-gradient-to-r from-teal-600 to-blue-600`
- Money: `formatFee()` from types
- Auth: Supabase JWT, `requireAuth` + `requireRole('doctor')` + `requireDoctor(userId)`
- Money stored as integer paise

---

## Task 1: DB Migration — Alter doctor_schedules

**Files:**
- Create: `server/src/db/migrations/0006_schedule_windows.sql`

**Steps:**

- [ ] **Step 1:** Create migration file:

```sql
-- 0006_schedule_windows.sql
-- Drop old columns
ALTER TABLE doctor_schedules DROP COLUMN IF EXISTS start_time;
ALTER TABLE doctor_schedules DROP COLUMN IF EXISTS end_time;
ALTER TABLE doctor_schedules DROP COLUMN IF EXISTS break_start;
ALTER TABLE doctor_schedules DROP COLUMN IF EXISTS break_end;

-- Add new columns
ALTER TABLE doctor_schedules ADD COLUMN IF NOT EXISTS window_start time NOT NULL DEFAULT '07:00';
ALTER TABLE doctor_schedules ADD COLUMN IF NOT EXISTS window_end time NOT NULL DEFAULT '09:00';
ALTER TABLE doctor_schedules ADD COLUMN IF NOT EXISTS max_patients integer NOT NULL DEFAULT 3;

-- Update unique constraint: drop old, add new
ALTER TABLE doctor_schedules DROP CONSTRAINT IF EXISTS doctor_schedules_doctor_id_day_of_week_key;
ALTER TABLE doctor_schedules ADD CONSTRAINT doctor_schedules_doctor_day_window_unique UNIQUE (doctor_id, day_of_week, window_start);
```

- [ ] **Step 2:** Commit

---

## Task 2: Schema Update — Drizzle Schema

**Files:**
- Modify: `server/src/db/schema.ts` (doctorSchedules table)

**Steps:**

- [ ] **Step 1:** Update `doctorSchedules` in schema.ts:

Replace the current definition with:

```typescript
export const doctorSchedules = pgTable(
  'doctor_schedules',
  {
    id: serial('id').primaryKey(),
    doctorId: integer('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
    dayOfWeek: integer('day_of_week').notNull(),
    windowStart: time('window_start').notNull(),
    windowEnd: time('window_end').notNull(),
    maxPatients: integer('max_patients').notNull().default(3),
    active: boolean('active').notNull().default(true),
  },
  (t) => [unique().on(t.doctorId, t.dayOfWeek, t.windowStart)],
);
```

- [ ] **Step 2:** Run typecheck: `cd server && npx tsc --noEmit`
- [ ] **Step 3:** Commit

---

## Task 3: Slots Logic — Window-Based

**Files:**
- Modify: `server/src/lib/slots.ts`

**Steps:**

- [ ] **Step 1:** Rewrite `slots.ts`:

Key changes:
- `WINDOWS` constant: 5 fixed windows
- `buildSlotList` → `getWindowCapacity`: returns windows with booked count
- `getAvailableSlots` → `getAvailableWindows`: returns windows with capacity info
- Keep `todayStr()`, `nowHHmm()`, `isValidDate()`, `dayOfWeek()`, `isPast()`

```typescript
import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../db/pool';
import { appointments, doctorSchedules } from '../db/schema';

export const WINDOWS = [
  { start: '07:00', end: '09:00', label: 'Early Morning' },
  { start: '09:00', end: '12:00', label: 'Morning' },
  { start: '12:00', end: '15:00', label: 'Afternoon' },
  { start: '15:00', end: '18:00', label: 'Evening' },
  { start: '18:00', end: '21:00', label: 'Night' },
] as const;

export interface WindowWithCapacity {
  start: string;
  end: string;
  label: string;
  maxPatients: number;
  bookedCount: number;
  available: boolean;
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

// Get available windows for a doctor on a date
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

  // Count booked appointments per window
  const booked = await db
    .select({
      timeSlot: appointments.timeSlot,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.doctorId, doctorId),
        eq(appointments.date, dateStr),
        inArray(appointments.status, ['upcoming', 'completed']),
      ),
    );

  // Map each scheduled window to its capacity info
  return schedules.map((s) => {
    const bookedCount = booked.filter((b) => {
      const slotTime = b.timeSlot.split('-')[0]; // "09:00" from "09:00-09:45"
      return slotTime >= s.windowStart && slotTime < s.windowEnd;
    }).length;

    const windowDef = WINDOWS.find((w) => w.start === s.windowStart);
    return {
      start: s.windowStart,
      end: s.windowEnd,
      label: windowDef?.label ?? `${s.windowStart}–${s.windowEnd}`,
      maxPatients: s.maxPatients,
      bookedCount,
      available: bookedCount < s.maxPatients && !(dateStr === todayStr() && s.windowEnd <= nowHHmm()),
    };
  });
}

// Get the next free 45-min slot within a window for booking
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
    const slot = `${toHHmm(t)}-${toHHmm(t + 45)}`;
    const slotStart = toHHmm(t);
    if (!bookedStarts.has(slotStart)) {
      return slot;
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
```

- [ ] **Step 2:** Run typecheck: `cd server && npx tsc --noEmit`
- [ ] **Step 3:** Commit

---

## Task 4: Schedule API — Update Routes

**Files:**
- Modify: `server/src/routes/doctor.ts` (PUT /schedules, GET /schedules)

**Steps:**

- [ ] **Step 1:** Update the PUT /doctor/schedules handler:

Replace the current `scheduleSchema` and PUT handler with:

```typescript
const windowSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  windowStart: z.string(),
  windowEnd: z.string(),
  maxPatients: z.number().int().min(1).max(3),
  active: z.boolean(),
});

const schedulePutSchema = z.object({
  windows: z.array(windowSchema),
});

// PUT /doctor/schedules — replace all windows for this doctor
doctorRouter.put('/schedules', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }
    const { windows } = schedulePutSchema.parse(req.body);

    // Delete existing schedules for this doctor
    await db.delete(doctorSchedules).where(eq(doctorSchedules.doctorId, doctor.id));

    // Insert new windows (only active ones)
    if (windows.length > 0) {
      await db.insert(doctorSchedules).values(
        windows.filter(w => w.active).map(w => ({
          doctorId: doctor.id,
          dayOfWeek: w.dayOfWeek,
          windowStart: w.windowStart,
          windowEnd: w.windowEnd,
          maxPatients: w.maxPatients,
          active: true,
        }))
      );
    }

    // Return updated schedules
    const rows = await db
      .select()
      .from(doctorSchedules)
      .where(eq(doctorSchedules.doctorId, doctor.id))
      .orderBy(doctorSchedules.dayOfWeek, doctorSchedules.windowStart);

    res.json({ schedules: rows });
  } catch (err) {
    next(err);
  }
});
```

- [ ] **Step 2:** Update GET /doctor/schedules to return windows:

```typescript
// GET /doctor/schedules — return all windows for this doctor
doctorRouter.get('/schedules', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }
    const rows = await db
      .select()
      .from(doctorSchedules)
      .where(eq(doctorSchedules.doctorId, doctor.id))
      .orderBy(doctorSchedules.dayOfWeek, doctorSchedules.windowStart);

    res.json({ schedules: rows });
  } catch (err) {
    next(err);
  }
});
```

- [ ] **Step 3:** Run typecheck
- [ ] **Step 4:** Commit

---

## Task 5: Slots API — Windows with Capacity

**Files:**
- Modify: `server/src/routes/doctors.ts` (GET /:slug/slots)

**Steps:**

- [ ] **Step 1:** Update the GET /:slug/slots handler to use `getAvailableWindows`:

```typescript
import { getAvailableWindows } from '../lib/slots';

// In the /:slug/slots handler:
doctorRouter.get('/:slug/slots', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const date = req.query.date as string;
    if (!date || !isValidDate(date)) {
      res.status(400).json({ error: { message: 'date query param required (YYYY-MM-DD)' } });
      return;
    }
    const [doc] = await db.select({ id: doctors.id }).from(doctors).where(eq(doctors.slug, slug));
    if (!doc) {
      res.status(404).json({ error: { message: 'Doctor not found' } });
      return;
    }
    const windows = await getAvailableWindows(doc.id, date);
    res.json({ windows, date });
  } catch (err) {
    next(err);
  }
});
```

- [ ] **Step 2:** Run typecheck
- [ ] **Step 3:** Commit

---

## Task 6: Reschedule API

**Files:**
- Modify: `server/src/routes/doctor.ts`

**Steps:**

- [ ] **Step 1:** Add PATCH /doctor/appointments/:id/reschedule:

```typescript
import { getNextFreeSlot } from '../lib/slots';

const rescheduleSchema = z.object({
  date: z.string(),
  windowStart: z.string(),
  windowEnd: z.string(),
});

doctorRouter.patch('/appointments/:id/reschedule', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }
    const { date, windowStart, windowEnd } = rescheduleSchema.parse(req.body);

    // Verify the appointment belongs to this doctor
    const [row] = await db
      .select({ id: appointments.id, doctorId: appointments.doctorId, status: appointments.status })
      .from(appointments)
      .where(eq(appointments.bookingId, req.params.id));
    if (!row || row.doctorId !== doctor.id) {
      res.status(404).json({ error: { message: 'Appointment not found' } });
      return;
    }
    if (row.status !== 'upcoming') {
      res.status(400).json({ error: { message: 'Only upcoming appointments can be rescheduled' } });
      return;
    }

    // Find next free slot in the new window
    const newSlot = await getNextFreeSlot(doctor.id, date, windowStart, windowEnd);
    if (!newSlot) {
      res.status(400).json({ error: { message: 'No available slots in this window' } });
      return;
    }

    // Update the appointment
    await db
      .update(appointments)
      .set({ date, timeSlot: newSlot })
      .where(eq(appointments.id, row.id));

    res.json({ success: true, newDate: date, newTimeSlot: newSlot });
  } catch (err) {
    next(err);
  }
});
```

- [ ] **Step 2:** Run typecheck
- [ ] **Step 3:** Commit

---

## Task 7: Schedule Page — Week Grid

**Files:**
- Rewrite: `admin/src/pages/SchedulePage.tsx`

**Steps:**

- [ ] **Step 1:** Rewrite SchedulePage.tsx with week grid layout:

The page shows a 5×7 grid (5 windows × 7 days). Each cell has a toggle and capacity dropdown. Includes "Copy Monday to all weekdays" and "All off" / "All on (3)" quick buttons.

- [ ] **Step 2:** Run typecheck: `cd admin && npx tsc --noEmit`
- [ ] **Step 3:** Commit

---

## Task 8: Appointments Page — Card List

**Files:**
- Rewrite: `admin/src/pages/AppointmentsPage.tsx`

**Steps:**

- [ ] **Step 1:** Rewrite AppointmentsPage.tsx with card list layout and 3 actions:
  - Done button → marks completed, opens prescription
  - Didn't come button → opens no-show reason modal (dropdown + optional text)
  - Change time button → opens reschedule modal (date picker + window picker)

- [ ] **Step 2:** Run typecheck
- [ ] **Step 3:** Commit

---

## Task 9: Patient Booking — Window Picker

**Files:**
- Modify: Patient app booking page (find the slot picker component)

**Steps:**

- [ ] **Step 1:** Update the booking page to fetch and display 3-hour windows with capacity instead of individual 45-min slots
- [ ] **Step 2:** Run typecheck
- [ ] **Step 3:** Commit

---

## Task 10: Seed Data & Migration

**Files:**
- Modify: `server/src/lib/seed.ts`

**Steps:**

- [ ] **Step 1:** Update seed to use new window format (5 windows per active day, with varying maxPatients)
- [ ] **Step 2:** Run migration: `cd server && npm run db:migrate`
- [ ] **Step 3:** Run seed: `cd server && npm run db:seed`
- [ ] **Step 4:** Verify server starts
- [ ] **Step 5:** Commit
