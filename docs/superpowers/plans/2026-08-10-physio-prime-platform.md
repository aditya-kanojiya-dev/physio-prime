# Physio-Prime Three-Role Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the mock-only physio-prime front-end into a full-stack, admin-controllable platform with three roles — patient, doctor, admin — backed by Express + Postgres, deployed on Vercel + Neon.

**Architecture:** Same-repo monorepo. `src/` (existing Vite React app) becomes the API-backed patient client. `api/` is an Express + Postgres server (one Vercel serverless function). `admin/` is a second Vite React app hosting both the admin dashboard and the doctor portal, role-gated. All content that is currently hardcoded in `src/data/` moves to the DB and becomes admin-editable via CMS.

**Tech Stack:**
- API: Node 20+, Express 5, `pg` + Drizzle ORM, `drizzle-kit` migrations, Zod for validation, `bcryptjs`, `jsonwebtoken`
- Tests: Vitest + Supertest (API), oxlint + `tsc -b` (static)
- Payments: Razorpay (orders + webhooks)
- Notifications: WhatsApp/SMS via Twilio
- Fronts: Vite 8 + React 19 + Tailwind v4 + Framer Motion (existing patient app), same stack for `admin/`
- Charts (admin insights): recharts
- Deploy: Vercel (monorepo, API as single serverless function) + Neon Postgres

## Global Constraints

- Node >= 20; TypeScript strict mode on in all three packages
- No new state library (no Redux/Zustand) — React Query (`@tanstack/react-query`) for server state in both front-ends
- All money in paise (integer) at the API boundary; format to INR only in UI
- Every API route zod-validates its input; every mutation is wrapped in a DB transaction
- Passwords hashed with bcryptjs (cost 10); JWT bearer tokens, `role` claim; role middleware guards admin/doctor routes
- Doctor/patient/admin never share a component tree — `admin/` app ships its own router with route guards
- No hardcoded doctors/categories/symptoms anywhere after Phase 7 — all reads go through the API
- Keep the existing `src/` visual design; do not redesign the patient UI in this plan

> **Ponytail note (honesty):** This is a master plan. Each phase below is a self-contained slice with its own tests, but Phase 4+ task bodies specify interfaces, endpoints and behaviors rather than every line of every component. At the start of each phase, a per-phase TDD plan with complete code is written (same format) so an executing agent never has to guess. The foundation phases (0–2) contain complete code.

---

## Repo Layout

```
physio-prime/
  docs/superpowers/plans/          ← this plan + per-phase plans
  api/
    src/
      index.ts                     ← Express app (exported for Vercel + supertest)
      config.ts                    ← env parsing (zod)
      db/
        schema.ts                  ← Drizzle schema (single source of truth)
        migrate.ts                 ← runs drizzle migrations
      middleware/
        auth.ts                    ← requireAuth, requireRole
        error.ts                   ← error handler + ZodError mapping
      routes/
        auth.ts  doctors.ts  appointments.ts  reviews.ts
        categories.ts  symptoms.ts  cms.ts  admin.ts  health.ts
      lib/
        slots.ts                   ← slot generation from schedules
        razorpay.ts                ← order creation + webhook signature verify
        notifications.ts           ← email + WhatsApp dispatch
        seed.ts                    ← dev seed script
    drizzle/                       ← generated migrations
    package.json  tsconfig.json  vitest.config.ts
  admin/                           ← admin + doctor portal app (Vite)
    src/
      main.tsx  App.tsx
      lib/api.ts                   ← typed fetch client + auth token storage
      context/AuthContext.tsx
      pages/                       ← admin: Dashboard, Doctors, Patients, Bookings, CMS, Insights
                                    doctor: Schedule, MyAppointments, MyProfile
      components/
    package.json  vite.config.ts  tsconfig.json  index.html
  src/                             ← existing patient app (modified in Phases 2, 7)
  vercel.json                      ← rewrites /api/* to the API function
  package.json                     ← root: workspaces + scripts
```

---

## Database Schema (Drizzle tables)

```sql
users(id pk, email text unique not null, password_hash text not null,
      role text check in ('patient','doctor','admin') not null,
      name text not null, phone text, status text not null default 'active',
      created_at timestamptz default now())

patient_profiles(user_id pk fk, gender text, dob date, weight numeric, height numeric,
                 address jsonb default '{}')

doctor_applications(id pk, user_id fk unique, status text default 'pending'
                    check in ('pending','approved','rejected'), applied_at, reviewed_at, notes)

doctors(id pk, user_id fk unique not null, name, title, specialty, slug unique, photo,
        rating numeric default 0, review_count int default 0,
        experience_years int, patients_treated int, languages text[],
        location jsonb,                       -- {area, city, address}
        fees jsonb,                           -- {home, online, clinic} in paise
        next_available date, verified bool default false, featured bool default false,
        gender text, bio text,
        education jsonb, experience jsonb, registration jsonb,
        expertise text[], treatments text[])

doctor_schedules(id pk, doctor_id fk, day_of_week int check 0-6,   -- 0=Sun
                 start_time time, end_time time, break_start time, break_end time,
                 active bool default true, unique(doctor_id, day_of_week))

appointments(id pk, booking_id text unique,          -- human ref like APT-XXXXXX
             patient_id fk users, doctor_id fk doctors,
             mode text check in ('home','online','clinic'),
             date date, time_slot text,              -- "09:00-09:30"
             status text default 'upcoming'
               check in ('upcoming','completed','cancelled','no_show'),
             symptom text, fee_paise int, address jsonb,
             payment_status text default 'pending'
               check in ('pending','paid','failed','refunded'),
             razorpay_order_id text, razorpay_payment_id text,
             patient_name text, patient_phone text,  -- snapshot, so history survives profile edits
             video_call_link text, cancellation_reason text,
             created_at timestamptz default now())

reviews(id pk, appointment_id fk unique,            -- one review per appointment
        doctor_id fk, rating int check 1-5, comment text,
        created_at timestamptz default now())

categories(id pk, title, slug unique, description text, image text,
           color text, conditions jsonb, sort_order int default 0, active bool default true)

symptoms(id pk, title, slug unique, icon_name text, description text,
         popular_for jsonb, recovery_estimate text, image text,
         sort_order int default 0, active bool default true)

content_sections(id pk, page text,             -- 'home', 'about', 'footer'
                 key text,                     -- 'hero', 'why-choose-us', ...
                 data jsonb,                   -- full section payload: heading, copy, images, links
                 sort_order int default 0, active bool default true, unique(page, key))

notifications(id pk, user_id fk, channel text check in ('email','whatsapp','sms'),
              to_address text, subject text, body text, status text default 'queued',
              provider_id text, error text, created_at, sent_at)
```

Booking-flow decisions encoded in schema:
- Slots are **derived**, not stored: generated on demand from `doctor_schedules` minus already-booked `appointments` for that doctor/date. `lib/slots.ts` owns this.
- Appointments snapshot `patient_name`/`patient_phone`/`fee` so history is immutable.
- `doctor_applications` sits between a pending doctor user and an approved `doctors` row.

---

## API Surface

Public (`/api/v1/...`):
- `GET /health`
- `POST /auth/register` (patient) · `POST /auth/login` · `POST /auth/apply-doctor` · `GET /auth/me`
- `GET /doctors` (filters: q, category, symptom, mode, gender, maxFee, sort) · `GET /doctors/:slug`
- `GET /doctors/:slug/slots?date=YYYY-MM-DD` → derived available slots
- `GET /categories` · `GET /symptoms` · `GET /cms/:page`
- `POST /appointments` (creates Razorpay order) · `POST /razorpay/webhook` · `POST /appointments/:id/verify` (confirm payment, called after client-side success)
- `POST /appointments/:id/reschedule` · `POST /appointments/:id/cancel`
- `GET /appointments` (mine) · `GET /appointments/:id`
- `POST /reviews` (only for completed, owned appointment) · `GET /doctors/:slug/reviews`

Protected — patient (`requireRole('patient')`): all `appointments`/`reviews` personal routes above.

Protected — doctor (`requireRole('doctor')`):
- `GET /doctor/appointments` (mine, filters by date/status)
- `PATCH /doctor/appointments/:id` (mark completed / no_show / add notes)
- `GET /doctor/schedules` · `PUT /doctor/schedules` (replace week)
- `GET /doctor/profile` · `PATCH /doctor/profile` (fees, bio, expertise, treatments, photo)

Protected — admin (`requireRole('admin')`):
- `GET /admin/insights` (bookings/mode/day, revenue, top doctors, new patients)
- `GET /admin/doctors` · `PATCH /admin/doctors/:id` (verify, feature, edit) · `POST /admin/doctors/:id/approve`
- `GET /admin/patients` · `GET /admin/appointments` (all, filters + pagination)
- `POST /admin/users` (create doctor/admin accounts) · `PATCH /admin/users/:id`
- CRUD `/admin/categories` · `/admin/symptoms` · `/admin/cms/:page/:key` (image upload → file, URL in DB)
- `GET /admin/doctor-applications` · `POST /admin/doctor-applications/:id/decide`

---

## Phase 0: Repo + API Foundations

**Files:**
- Create: `package.json` (root, workspaces), `api/package.json`, `api/tsconfig.json`, `api/vitest.config.ts`, `api/src/index.ts`, `api/src/config.ts`, `api/src/middleware/error.ts`, `api/src/routes/health.ts`, `api/test/health.test.ts`, `vercel.json`, `.gitignore` (merge), `.env.example`

**Interfaces:**
- Produces: `createApp(): express.Express` (exported from `api/src/index.ts`); `config` object parsed from env with zod; error middleware converting `ZodError` → 400 `{ error: { issues } }`.

- [ ] **Step 1: git init + root workspaces**
  ```bash
  git init && git add -A && git commit -m "chore: baseline from mock patient app"
  ```
  Root `package.json`:
  ```json
  {
    "name": "physio-prime",
    "private": true,
    "type": "module",
    "workspaces": ["api", "admin"],
    "scripts": {
      "dev": "concurrently \"npm run dev -w api\" \"npm run dev -w src\" \"npm run dev -w admin\"",
      "build": "npm run build -w api && npm run build -w src && npm run build -w admin",
      "lint": "npm run lint -w api && npm run lint -w src && npm run lint -w admin",
      "test": "npm run test -w api"
    },
    "devDependencies": { "concurrently": "^9.0.0" }
  }
  ```
  (Note: existing `src/` has no package.json of its own — move its `package.json` to the root of `src/` during this step and give `src/` the `workspaces` entry.)

- [ ] **Step 2: Write failing health test**

  `api/test/health.test.ts`:
  ```ts
  import { describe, it, expect } from 'vitest';
  import request from 'supertest';
  import { createApp } from '../src/index';

  describe('GET /api/v1/health', () => {
    it('returns ok with service name', async () => {
      const res = await request(createApp()).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true, service: 'physio-prime-api' });
    });
  });
  ```

- [ ] **Step 3: Run test to verify it fails**
  Run: `npm test -w api` — Expected: FAIL (module not found / no test file exists yet after install). Install deps first: `npm install -w api` with express, pg, drizzle-orm, zod, bcryptjs, jsonwebtoken, dotenv, cors; dev: vitest, supertest, @types/*, tsx, drizzle-kit.

- [ ] **Step 4: Implement createApp + health + error middleware**

  `api/src/index.ts`:
  ```ts
  import express from 'express';
  import cors from 'cors';
  import { errorHandler } from './middleware/error';
  import { healthRouter } from './routes/health';

  export function createApp() {
    const app = express();
    app.use(cors({ origin: true, credentials: true }));
    app.use(express.json());
    app.use('/api/v1/health', healthRouter);
    app.use(errorHandler);
    return app;
  }
  ```
  `api/src/config.ts`: zod-parses `DATABASE_URL`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, `APP_URL`; throws at boot if missing (dev uses `.env` via `dotenv/config`).

- [ ] **Step 5: Run test to verify it passes**
  Run: `npm test -w api` — Expected: PASS.

- [ ] **Step 6: Lint + typecheck**
  Run: `npm run lint -w api && npx tsc -b api` — Expected: clean.

- [ ] **Step 7: Commit**
  ```bash
  git add -A && git commit -m "feat(api): express scaffold with health endpoint"
  ```

---

## Phase 1: Schema, Migrations, Seed

**Files:**
- Create: `api/src/db/schema.ts`, `api/src/db/migrate.ts`, `api/src/db/pool.ts`, `api/drizzle.config.ts`, `api/src/lib/seed.ts`, `api/drizzle/0000_init.sql` (generated by drizzle-kit)
- Modify: `api/src/index.ts` (mount `/api/v1/categories`, `/symptoms`, `/cms` after Phase 3 data models land — defer; Phase 1 only wiring order)

**Interfaces:**
- Produces: Drizzle tables exactly per the schema section; `db` (`PgDatabase` from `pool.ts`); `npm run db:migrate`, `npm run db:seed` scripts.

- [ ] **Step 1: Write `db/schema.ts`** — all tables from the SQL above as Drizzle schema, matching column names/types exactly.
- [ ] **Step 2: Generate migration**
  Run: `npm run db:generate` — Expected: `drizzle/0000_init.sql` created.
- [ ] **Step 3: Write failing test — seed round-trip**
  `api/test/seed.test.ts`: connect to a test DB, run migrations, run `seed()`, expect `doctors` count > 0 and `categories` count == 9, `symptoms` count == 12 (port the existing `src/data/*` into `seed.ts` as the initial content).
- [ ] **Step 4: Implement `pool.ts`, `migrate.ts`, `seed.ts`** (seed reads `src/data/doctors.ts`-style arrays moved into `api/src/lib/seed-data/*`).
- [ ] **Step 5: Run test** — Expected: PASS.
- [ ] **Step 6: Commit**
  ```bash
  git commit -am "feat(api): drizzle schema, migrations, and seed from existing data"
  ```

---

## Phase 2: Auth — Register / Login / Apply / Roles

**Files:**
- Create: `api/src/middleware/auth.ts`, `api/src/routes/auth.ts`, `api/test/auth.test.ts`, `api/src/lib/tokens.ts`
- Modify: `api/src/index.ts` (mount auth + `requireRole` usage scaffolding)

**Interfaces:**
- `login(email, password)` → `{ token, user: { id, role, name } }`
- `registerPatient(payload)` → creates `users(role=patient)` + `patient_profiles`
- `applyAsDoctor(payload)` → creates `users(role=doctor, status='inactive')` + `doctor_applications(pending)`
- `createAdminUser(email, password, name)` (server-side helper, used by admin routes in Phase 9 and by seed)
- `requireAuth` (sets `req.user`), `requireRole('admin'|'doctor'|'patient')`
- `POST /auth/me` returns current user profile

- [ ] **Step 1: Write failing tests** — register patient (201, password stored hashed, token issued); login wrong password (401); apply-as-doctor creates pending application; `/auth/me` with valid token returns the user; `requireRole('admin')` rejects a patient token (403).
- [ ] **Step 2: Run to verify failure** — Expected: FAIL (routes 404).
- [ ] **Step 3: Implement tokens + auth middleware + auth routes** (bcryptjs cost 10; JWT `{ sub, role }`, 7d expiry; zod input validation).
- [ ] **Step 4: Run tests** — Expected: PASS.
- [ ] **Step 5: Commit**
  ```bash
  git commit -am "feat(api): auth for patient, doctor-apply, admin roles"
  ```

---

## Phase 3: Public Content API (replaces `src/data/`)

**Files:**
- Create: `api/src/routes/doctors.ts` (list + detail + slots stub), `api/src/routes/categories.ts`, `api/src/routes/symptoms.ts`, `api/src/routes/cms.ts`, `api/test/public.test.ts`

**Interfaces:**
- `GET /doctors?q&category&symptom&mode&gender&maxFee&sort` — mirrors FindDoctorsPage filters today; `sort` ∈ `recommended|price_low|rating|experience`
- `GET /doctors/:slug` → full `Doctor` shape (same fields as current `types/index.ts` `Doctor`, camelCase)
- `GET /categories` · `GET /symptoms` → active, ordered by `sort_order`
- `GET /cms/:page` → `content_sections` for that page as `{ key: data }`

- [ ] **Step 1: Write failing tests** — doctors list with filter/sort behavior; slug detail; categories/symptoms only return `active`; cms page returns sections keyed by `key`.
- [ ] **Step 2: Run to verify failure.**
- [ ] **Step 3: Implement the four routers** (query filtering in SQL via Drizzle `.where()`; no fetch-all-then-filter-in-JS).
- [ ] **Step 4: Run tests** — Expected: PASS.
- [ ] **Step 5: Commit**
  ```bash
  git commit -am "feat(api): public doctors/categories/symptoms/cms endpoints"
  ```

---

## Phase 4: Appointments, Slots, Razorpay

**Files:**
- Create: `api/src/lib/slots.ts`, `api/src/lib/razorpay.ts`, `api/src/routes/appointments.ts`, `api/src/routes/razorpay.ts`, `api/test/appointments.test.ts`, `api/test/slots.test.ts`, `api/test/razorpay-webhook.test.ts`

**Interfaces:**
- `getAvailableSlots(doctorId, date)` → `[{ start: '09:00', end: '09:30' }, ...]` — 30-min slots within each active schedule band for that weekday, minus booked/unavailable appointments
- `POST /appointments` `{ doctorId, mode, date, slot, symptom, patientName, patientPhone, address?, feePaisa }` → creates appointment `pending` + Razorpay order; returns `{ appointment, razorpayOrder }`
- `POST /appointments/:id/verify` `{ razorpayPaymentId, razorpaySignature }` → validates signature, sets `paid`, fires booking notification (Phase 5 hook)
- `POST /razorpay/webhook` — signature-verified; handles `payment.captured` / `payment.failed` / `order.paid`
- `POST /appointments/:id/reschedule` — validates slot still free, updates, re-notifies
- `POST /appointments/:id/cancel` — sets `cancelled` + reason; if paid → Razorpay refund

- [ ] **Step 1: Write failing slot tests** — weekday band produces correct slot list; a booked appointment removes its slot; Sunday-off doctor yields none.
- [ ] **Step 2: Run to verify failure.**
- [ ] **Step 3: Implement `lib/slots.ts`** and wire `GET /doctors/:slug/slots?date=`.
- [ ] **Step 4: Write failing appointment tests** — create (order id returned, payment pending); double-book same slot → 409; verify with bad signature → 400; reschedule to free slot succeeds / taken slot 409; cancel refunds via mocked Razorpay.
- [ ] **Step 5: Implement appointment + razorpay routes** (all mutations in transactions; `booking_id` = `APT-` + 6 digits; money in paise; webhook signature check via `crypto.timingSafeEqual`).
- [ ] **Step 6: Run all tests** — Expected: PASS.
- [ ] **Step 7: Commit**
  ```bash
  git commit -am "feat(api): slot engine, appointments, razorpay orders and webhooks"
  ```

---

## Phase 5: Notifications (WhatsApp/SMS)

**Files:**
- Create: `api/src/lib/notifications.ts`, `api/src/routes/notifications.ts` (admin view/retry), `api/test/notifications.test.ts`
- Modify: appointments router (call `notify()` on create-paid / reschedule / cancel)

**Interfaces:**
- `notify(userId, channel, to, subject, body)` → inserts `notifications` row `queued`, then dispatches; on provider error marks row `failed` with error (never throws into the booking flow)
- WhatsApp via Twilio WhatsApp API, falling back to SMS when no WhatsApp-enabled number. No email channel (decision: whatsapp/sms only)
- Templates: `booking-confirmed`, `booking-rescheduled`, `booking-cancelled`, `appointment-reminder` (sent by a scheduled reminder pass)

- [ ] **Step 1: Write failing tests** — `notify` writes a `queued` row; provider failure marks `failed` but does not reject the caller; templates render expected body strings.
- [ ] **Step 2: Run to verify failure.**
- [ ] **Step 3: Implement `lib/notifications.ts` + template functions** (Twilio clients injected so tests stub them).
- [ ] **Step 4: Wire into appointments router** at paid/reschedule/cancel.
- [ ] **Step 5: Run tests** — Expected: PASS.
- [ ] **Step 6: Commit**
  ```bash
  git commit -am "feat(api): whatsapp/sms notifications on booking events"
  ```

---

## Phase 6: Reviews

**Files:**
- Create: `api/src/routes/reviews.ts`, `api/test/reviews.test.ts`
- Modify: appointments router (when doctor marks completed, nothing auto-triggers — patient sees a review prompt client-side)

**Interfaces:**
- `POST /reviews` `{ appointmentId, rating, comment }` — only owner, only `completed` appointment, one per appointment (DB unique constraint enforces)
- `GET /doctors/:slug/reviews`
- Doctor `rating`/`review_count` recomputed in the same transaction on insert (rolling average, stored on `doctors`)

- [ ] **Step 1: Write failing tests** — review on non-completed appointment → 400; review not owned → 403; second review on same appointment → 409; doctor rating recalculated correctly.
- [ ] **Step 2: Run to verify failure.**
- [ ] **Step 3: Implement reviews router + aggregation.**
- [ ] **Step 4: Run tests** — Expected: PASS.
- [ ] **Step 5: Commit**
  ```bash
  git commit -am "feat(api): verified post-appointment reviews with rating aggregation"
  ```

---

## Phase 7: Patient App Rebuild (existing `src/`)

**Files:**
- Modify: `src/context/BookingContext.tsx` (replace store with API calls + React Query), `src/App.tsx` (auth context, login route, remove `/book/:doctorId` route), all `src/pages/*`, all `src/components/home/*`, `src/components/chatbot/Chatbot.tsx`, `src/components/doctors/*`, `src/components/auth/AuthModal.tsx` (real login/register)
- Create: `src/lib/api.ts` (fetch client + token storage), `src/context/AuthContext.tsx`, `src/hooks/useDoctors.ts`, `src/hooks/useSlots.ts`, `src/hooks/useAppointments.ts`, `src/components/booking/RazorpayModal.tsx`
- Delete: `src/data/*`, `src/vercel.json`

**Behaviors:**
- Replace all `import ... from './data/...'` with React Query hooks hitting `/api/v1/...`
- Navbar Sign In → real login; appointments page requires `patient` role (redirect to login)
- Booking modal: step 1 reads categories/symptoms from API; step 2 real doctors; step 3 real slots (`/doctors/:slug/slots`); step 4 patient profile prefilled; step 5 → create order → **Razorpay checkout script** → `/appointments/:id/verify` → confetti on paid
- Reschedule/cancel call API, refresh query cache
- Chatbot: keep decision-tree logic, source answers from API data (no local copies)
- Remove the fake payment delay, fake GPS stays (or moves to real doctor status later — out of scope), AuthModal becomes functional
- Appointments list shows real `payment_status`; completed appointments show a review prompt

- [ ] **Step 1: Add `lib/api.ts` + React Query provider + AuthContext**; port login/register into AuthModal.
- [ ] **Step 2: Swap home sections to API data** (hero stats still static or from `/admin/insights` later).
- [ ] **Step 3: Swap FindDoctors + DoctorDetail to API** (search/filters now server-side).
- [ ] **Step 4: Rewrite booking flow to real slots + Razorpay.**
- [ ] **Step 5: Rewrite AppointmentsPage against API** (reschedule/cancel/review).
- [ ] **Step 6: DB-backed chatbot, delete `src/data/`, delete `src/vercel.json`.**
- [ ] **Step 7: Verify no remaining `src/data` imports** — `grep -r "data/" src` empty; `npm run lint -w src && npm run build -w src` clean.
- [ ] **Step 8: Commit**
  ```bash
  git commit -am "feat(patient): full API integration, razorpay checkout, real auth"
  ```

---

## Phase 8: Doctor App (in `admin/` package)

**Files:**
- Create: `admin/` package (Vite scaffold mirroring `src/` config), `admin/src/pages/LoginPage.tsx`, `admin/src/pages/doctor/SchedulePage.tsx`, `admin/src/pages/doctor/MyAppointments.tsx`, `admin/src/pages/doctor/MyProfile.tsx`, `admin/src/components/doctor/ScheduleEditor.tsx`, `admin/src/lib/api.ts`

**Behaviors:**
- Doctor logs in → sees only doctor routes (route guard on `role`)
- **ScheduleEditor**: 7-day grid, set working bands + breaks per day (writes `PUT /doctor/schedules`)
- **MyAppointments**: list today/upcoming/past, mark completed / no-show, view patient contact from appointment snapshot
- **MyProfile**: edit fees, bio, expertise, treatments, photo; sees approval status (disabled until approved)

- [ ] **Step 1: Scaffold `admin/` Vite app + shared `lib/api.ts` + login + route guard.**
- [ ] **Step 2: ScheduleEditor against schedule endpoints** (write tests via API already covered in Phase 4/5 — this phase is UI integration, verified by `tsc` + manual).
- [ ] **Step 3: MyAppointments + status actions.**
- [ ] **Step 4: MyProfile edit.**
- [ ] **Step 5: Lint/build clean + commit**
  ```bash
  git commit -am "feat(doctor): schedule, appointments, profile portal"
  ```

---

## Phase 9: Admin App (in `admin/` package)

**Files:**
- Create: `admin/src/pages/admin/DashboardPage.tsx`, `DoctorsPage.tsx`, `PatientsPage.tsx`, `BookingsPage.tsx`, `CMSPage.tsx`, `InsightsPage.tsx`, `admin/src/components/admin/*` (tables, forms, image-upload, DataTable), `admin/src/components/admin/charts.tsx`

**Behaviors:**
- Route guard: `admin` role only; seed one admin via `npm run db:seed`
- **DoctorsPage**: list + edit any field, toggle verified/featured, approve/reject doctor applications (with notes), create doctor account directly
- **PatientsPage**: searchable table of patients + their appointments
- **BookingsPage**: all appointments, filter by status/date/doctor/mode, view payment status, refund from Razorpay if needed
- **CMSPage**: CRUD categories, symptoms, and every `content_sections` row (home hero, search, why-choose-us, stories, footer) with image upload → managed file storage (Vercel Blob or S3-compatible bucket), stores returned URL
- **InsightsPage**: charts from `/admin/insights` — bookings over time, revenue, bookings by mode/specialty, top doctors, new patients; date-range filter
- Admin CRUD creates the corresponding admin/patient/doctor API routes (from the API surface section)

- [ ] **Step 1: Admin routes in API** (`admin.ts` + `insights` aggregate queries) with tests for authorization (non-admin → 403) and the insight aggregates.
- [ ] **Step 2: Admin app shell + guards + table primitives.**
- [ ] **Step 3: Doctors + applications management UI.**
- [ ] **Step 4: Patients + bookings management UI.**
- [ ] **Step 5: CMS UI (categories/symptoms/content sections) + image upload.**
- [ ] **Step 6: Insights dashboard with recharts.**
- [ ] **Step 7: Lint/build clean + commit**
  ```bash
  git commit -am "feat(admin): full control panel — doctors, patients, bookings, cms, insights"
  ```

---

## Phase 10: Deploy + Hardening

**Files:**
- Modify: `vercel.json` (root), root scripts; create `.env.example` at root, `api` env vars in Vercel
- Create: `docs/DEPLOY.md`

**Behaviors:**
- Provision Neon DB, run `drizzle-kit migrate` against prod, seed prod admin
- Vercel monorepo: root `vercel.json` rewrites `/(api/*)` → the Express function; patient app + admin app as two Vercel projects (or one project with distinct builds) — decide at execution, minimal config wins
- Configure env: `DATABASE_URL`, `JWT_SECRET`, `RAZORPAY_KEY_ID/SECRET` (test mode first), `TWILIO_*`, `APP_URL`
- Smoke test on prod: register → login → book with Razorpay test card → verify → admin sees booking + insight

- [ ] **Step 1: Write `docs/DEPLOY.md`.**
- [ ] **Step 2: Provision Neon + migrate + seed prod admin.**
- [ ] **Step 3: Deploy API + both front-ends; set env vars.**
- [ ] **Step 4: End-to-end smoke test (steps above).**
- [ ] **Step 5: Commit**
  ```bash
  git commit -am "docs: deploy guide; chore: production wiring"
  ```

---

## Self-Review Notes

- Spec coverage: 3 roles ✓ (Phase 2 auth, 8 doctor, 9 admin), admin controls all content ✓ (Phase 9 CMS incl. home sections), bookings/patients/insights ✓ (Phase 9), all improvement picks ✓ (Razorpay P4, slots P4, email+WhatsApp P5, DB chatbot P7, reviews P6, full CMS P9).
- Placeholder scan: foundation phases carry full code; later phases carry exact interfaces/endpoints/behaviors and explicitly defer per-phase full code plans — flagged in the ponytail note above.
- Type consistency: `slot` strings are `"HH:mm-HH:mm"` everywhere; money `fee_paise` int; doctor lookup by `slug` in public routes, by `id` in admin/booking routes; `appointment.status` and `payment_status` values fixed per schema check constraints.
