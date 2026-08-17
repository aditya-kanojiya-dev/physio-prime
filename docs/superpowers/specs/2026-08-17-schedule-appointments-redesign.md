# Doctor Schedule & Appointments Redesign

**Date:** 2026-08-17
**Status:** Approved
**Goal:** Replace raw time-slot scheduling with 3-hour windows with per-window capacity. Simplify appointment actions to three clear buttons. Make schedule management a quick weekly grid.

---

## 1. Schedule — 3-Hour Windows with Capacity

### Fixed Windows

Five fixed 3-hour windows per day:

| Window | Start | End |
|--------|-------|-----|
| Morning Early | 07:00 | 09:00 |
| Morning | 09:00 | 12:00 |
| Afternoon | 12:00 | 15:00 |
| Evening | 15:00 | 18:00 |
| Night | 18:00 | 21:00 |

### Schema Change

Replace the current `doctor_schedules` table. Drop `start_time`, `end_time`, `break_start`, `break_end`. Add `window_start`, `window_end`, `max_patients`.

```sql
-- Migration: 0006_schedule_windows.sql
ALTER TABLE doctor_schedules DROP COLUMN start_time;
ALTER TABLE doctor_schedules DROP COLUMN end_time;
ALTER TABLE doctor_schedules DROP COLUMN break_start;
ALTER TABLE doctor_schedules DROP COLUMN break_end;
ALTER TABLE doctor_schedules ADD COLUMN window_start time NOT NULL;
ALTER TABLE doctor_schedules ADD COLUMN window_end time NOT NULL;
ALTER TABLE doctor_schedules ADD COLUMN max_patients integer NOT NULL DEFAULT 3;
```

Keep the unique constraint on `(doctor_id, day_of_week)` — but now each doctor gets 5 rows per active day (one per window) instead of 1. The unique constraint must change to `(doctor_id, day_of_week, window_start)`.

Final schema:

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

### API Changes

**PUT /doctor/schedules** — Accept array of window objects:
```json
{
  "windows": [
    { "dayOfWeek": 1, "windowStart": "07:00", "windowEnd": "09:00", "maxPatients": 3, "active": true },
    { "dayOfWeek": 1, "windowStart": "09:00", "windowEnd": "12:00", "maxPatients": 2, "active": true }
  ]
}
```

Replace all rows for the doctor (delete + re-insert in a transaction).

**GET /doctor/schedules** — Return array of active windows per day.

**GET /doctors/:slug/slots?date=YYYY-MM-DD** — Return windows with capacity info:
```json
{
  "windows": [
    { "start": "09:00", "end": "12:00", "maxPatients": 2, "bookedCount": 1, "available": true },
    { "start": "12:00", "end": "15:00", "maxPatients": 3, "bookedCount": 3, "available": false }
  ]
}
```

A window is "available" if `bookedCount < maxPatients`. The patient booking flow shows these windows instead of individual 45-min slots.

**Booking logic:** When a patient books a window, the system picks the next free sub-slot within that window (first 45-min chunk that's not taken). The `appointments.timeSlot` still stores the specific 45-min slot (e.g. "09:00-09:45") for internal tracking, but the patient sees and picks the 3-hour window.

### Schedule Page — Week Grid

Desktop layout:

```
         Mon    Tue    Wed    Thu    Fri    Sat    Sun
07-09    [3]    [3]    off    [3]    [3]    off    off
09-12    [2]    [2]    [2]    [2]    [2]    [1]    off
12-15    [3]    [3]    off    [3]    [3]    off    off
15-18    off    off    off    off    off    off    off
18-21    off    off    off    off    off    off    off
```

Each cell: toggle (on/off) + capacity dropdown (1/2/3) when on.

- **Copy Monday to all weekdays** button — sets Mon pattern to Tue–Fri
- **All off** / **All on (3)** quick buttons
- Save button at top

Mobile: same grid, horizontally scrollable.

### Capacity in Patient-Facing UI

On the booking page, instead of showing individual 45-min time slots, show the 3-hour windows:

```
Morning (09:00 – 12:00)    2 of 3 slots available
Afternoon (12:00 – 15:00)  Full
Evening (15:00 – 18:00)    3 of 3 slots available
```

When the patient selects a window, the system internally assigns the next free 45-min sub-slot.

---

## 2. Appointments — Card List with 3 Actions

### Layout

Replace the table with a card list. Each upcoming appointment is a card:

```
┌──────────────────────────────────────────────┐
│  Ravi Kumar                                  │
│  for Self          📞 +91 98765 43210        │
│  ─────────────────────────────────────────   │
│  📅 17 Aug 2026 · 09:00 – 12:00 window      │
│  🏥 Clinic Visit · ₹500                      │
│  ─────────────────────────────────────────   │
│  [✓ Done]  [✗ Didn't come]  [↻ Change time] │
└──────────────────────────────────────────────┘
```

### Three Actions for Upcoming Appointments

**1. Done (Completed)**
- Button: green, `✓ Done`
- Click → marks appointment as `completed`
- Opens prescription form (existing, unchanged)

**2. Didn't come (No Show)**
- Button: amber, `✗ Didn't come`
- Click → opens a small modal/dropdown:
  - Dropdown with options:
    - "Patient didn't show up"
    - "Patient cancelled at the last minute"
    - "Could not reach the patient"
    - "Other"
  - If "Other" selected: optional text field appears
  - Confirm button: `Mark as missed`
- Marks appointment as `no_show` with `cancellationReason` set

**3. Change time (Reschedule)**
- Button: slate/blue, `↻ Change time`
- Click → opens a mini-calendar modal:
  - Date picker (only future dates, only days the doctor is active)
  - Window picker (shows available windows with capacity for the selected date)
  - Doctor picks new date + window
  - Confirms → appointment date/timeSlot updated, patient notified
- Backend: PATCH `/doctor/appointments/:id/reschedule` with `{ date, timeSlot }`

### Filters

Top bar with pills: `All` | `Upcoming` | `Done` | `Missed`

### Completed & Missed Cards

Completed appointments show a simplified card with:
- Patient name, date, mode, fee
- Prescription status badge (written / not written)
- `Write Prescription` button if no prescription yet

Missed appointments show:
- Patient name, date
- Reason badge (from the dropdown selection)
- Dimmed styling

### Detail Modal

Keep the existing appointment detail modal when clicking patient name. Shows full info, prescription, cancellation reason.

---

## 3. Files to Modify

### Backend
- `server/src/db/schema.ts` — Update `doctorSchedules` table definition
- `server/src/lib/slots.ts` — Rewrite `buildSlotList`, `availableFromSchedules`, `getAvailableSlots` for window-based logic
- `server/src/routes/doctor.ts` — Update `PUT /schedules` handler, add `PATCH /appointments/:id/reschedule`
- `server/src/routes/doctors.ts` — Update `/slots` endpoint to return windows with capacity

### Frontend (Admin/Doctor Portal)
- `admin/src/pages/SchedulePage.tsx` — Complete rewrite: week grid with 5 rows × 7 columns
- `admin/src/pages/AppointmentsPage.tsx` — Replace table with card list, add 3 action buttons, reschedule modal, no-show reason modal

### Patient App
- `src/pages/` (booking page) — Update slot selection to show 3-hour windows with capacity instead of individual 45-min slots

### Migration
- `server/src/db/migrations/0006_schedule_windows.sql` — Schema migration

### Seed
- `server/src/lib/seed.ts` — Update seed data for new schedule format

---

## 4. What Stays the Same

- Prescription form (diagnosis, medicines, advice, follow-up)
- Appointment detail modal
- Payment flow
- All other pages (earnings, payouts, locations, community, messages, notifications)
- Patient app except the booking slot picker

---

## 5. Out of Scope

- SMS/email notifications on reschedule (future)
- Waitlist for full windows (future)
- Recurring appointments (future)
- Batch reschedule (future)
