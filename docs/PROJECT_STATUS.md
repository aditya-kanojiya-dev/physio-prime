# Physio-Prime Platform — Project Status & Feature Guide

> Generated: 2026-08-13 · Branch: `feat/three-role-platform`
> Master plan: [`docs/superpowers/plans/2026-08-10-physio-prime-platform.md`](superpowers/plans/2026-08-10-physio-prime-platform.md)

---

## 1. Phase Completion Status

The three-role platform was planned in 11 phases (0–10). **Phases 0–9 are complete; Phase 10 (production deploy + hardening) is NOT started.**

| Phase | Scope | Status |
|---|---|---|
| **0** | Repo + API foundations (Express, health, error middleware, workspaces) | ✅ Complete |
| **1** | Drizzle schema, migrations, seed from original mock data | ✅ Complete |
| **2** | Auth — register / login / apply-as-doctor / roles | ✅ Complete |
| **3** | Public content API (doctors, categories, symptoms, CMS) | ✅ Complete |
| **4** | Slot engine, appointments, Razorpay orders + webhooks | ✅ Complete |
| **5** | Notifications (WhatsApp/SMS via Twilio) | ✅ Complete |
| **6** | Verified post-appointment reviews + rating aggregation | ✅ Complete |
| **7** | Patient app rebuilt against the API (React Query + real auth) | ✅ Complete |
| **8** | Doctor portal (schedule, appointments, profile, prescriptions) | ✅ Complete |
| **9** | Admin portal (doctors, patients, bookings, categories, symptoms, CMS, insights, payments) | ✅ Complete |
| **10** | Deploy to Vercel + Neon, production hardening, `docs/DEPLOY.md` | ⬜ **Not started** |

**Deliberate deviations from the original plan (all committed):**
- Auth switched from self-hosted JWT (`jsonwebtoken` + `bcryptjs`) to **Supabase Auth** — tokens validated against Supabase, app `users` row auto-created on first login. Original JWT code remains in `api/src/lib/tokens.ts` (unused).
- Email notification channel dropped; **WhatsApp/SMS only** (plan updated in `6cd9ec4`).
- Prescriptions feature added (Phase 8/9 bonus), not in the original plan.
- "Book for someone else" (`patient_relation`) added (Phase 7/9 bonus).

---

## 2. Architecture

Same-repo **npm-workspaces monorepo** — three packages:

```
physio-prime/
  src/        Vite + React 19 patient app (existing design, now API-backed)
  api/        Express 5 + Postgres (Drizzle ORM) REST API + Vitest/Supertest suite
  admin/      Second Vite + React app — doctor portal AND admin dashboard, role-gated
  docs/       Plans + this status doc
```

- **Frontend stack:** Vite, React 19, TypeScript (strict), Tailwind CSS v4, Framer Motion, React Query, React Router. Admin also uses **recharts** for insights charts.
- **Backend stack:** Node 20+, Express 5, `pg` + Drizzle ORM, `drizzle-kit` migrations, Zod validation.
- **Testing:** Vitest + Supertest (API, runs against a real Supabase Postgres test DB), `oxlint` + `tsc -b` for static checks.
- **Deploy shape:** one Express serverless function behind `/api/v1/*` (`vercel.json` rewrites already in place). Not yet actually deployed.

---

## 3. Database Schema (12 tables)

Drizzle schema lives in `api/src/db/schema.ts`; 5 generated migrations (`api/drizzle/0000–0004`).

| Table | Purpose |
|---|---|
| `users` | All three roles (`patient` / `doctor` / `admin`), email + password hash, status |
| `patient_profiles` | Gender, DOB, weight, height, address — editable from the patient dashboard |
| `doctor_applications` | Pending doctor applications awaiting admin decision |
| `doctors` | Public doctor profile: specialty, slug, photo, fees (paise), languages, location, education, expertise, treatments, rating/review_count |
| `doctor_schedules` | Weekly working bands + breaks per doctor/day (Mon–Sat seeded) |
| `appointments` | Booking snapshot (patient name/phone, fee, mode, slot, payment status, Razorpay ids, video link, cancellation reason) |
| `reviews` | One verified review per completed appointment; rating recomputed on `doctors` |
| `prescriptions` | Doctor-written prescription per completed appointment (diagnosis, medicines, advice, follow-up) |
| `categories` | Physio specialties (9 seeded) — admin-editable |
| `symptoms` | Conditions (12 seeded) — admin-editable |
| `content_sections` | CMS page content (`home`/`about`/`footer` sections as JSON) |
| `notifications` | Queued/dispatched notification log |

Money is stored as **integer paise** at the API boundary and formatted to INR only in UI.

---

## 4. API Surface (`/api/v1`)

### Public
- `GET /health`
- `GET /doctors` (filters: q, category, symptom, mode, gender, maxFee, sort) · `GET /doctors/:slug` · `GET /doctors/:slug/slots?date=`
- `GET /categories` · `GET /symptoms` · `GET /cms/:page`
- `POST /auth/register` · `POST /auth/login` · `POST /auth/apply-doctor` · `GET /auth/me` · `PATCH /auth/me`
- `GET /doctors/:slug/reviews`

### Patient (role: `patient`)
- `POST /appointments` (creates appointment + Razorpay order) · `POST /appointments/:id/verify` · `POST /appointments/:id/reschedule` · `POST /appointments/:id/cancel`
- `GET /appointments` (mine) · `GET /appointments/:id`
- `POST /reviews` (owner + completed only)
- `POST /razorpay/webhook` (signature-verified)

### Doctor (role: `doctor`)
- `GET /doctor/appointments` · `PATCH /doctor/appointments/:id` (complete / no-show / notes)
- `POST /doctor/appointments/:id/prescription`
- `GET /doctor/schedules` · `PUT /doctor/schedules` (replace week)
- `GET /doctor/profile` · `PATCH /doctor/profile`

### Admin (role: `admin`)
- `GET /admin/insights` (revenue, bookings by day/mode, new patients, top doctors, per-doctor client counts)
- `GET/PATCH /admin/doctors/:id` · `GET /admin/doctors/:id/clients` · `POST /admin/doctors/:id/approve`
- `GET /admin/doctor-applications` · `POST /admin/doctor-applications/:id/decide`
- `GET /admin/patients` · `GET /admin/patients/:id` (profile + summary + appointments + prescriptions)
- `GET /admin/appointments` (status/payment/date/doctor/mode/search filters + pagination)
- `POST /admin/users` · `PATCH /admin/users/:id` (create doctor/admin accounts)
- CRUD `/admin/categories` · `/admin/symptoms` · `/admin/cms/:page/:key`
- `GET /admin/prescriptions` · `GET /admin/notifications`

**Auth model:** Supabase Auth (email/password + Google OAuth) issues the token; `requireAuth` resolves the Supabase user → app `users` row (auto-created if new, default role `patient`); `requireRole('doctor' | 'admin')` gates role routes. Seed logins: `admin@physio.example` / `physio123`, seed doctors `physio123`.

**Payments:** Razorpay orders in test mode — order on booking, client-side checkout script, `verify` endpoint checks the signature, webhook handles captured/failed events. Cancelling a paid appointment triggers a refund path.

**Notifications:** Twilio WhatsApp/SMS (WhatsApp with SMS fallback). Templates: `booking-confirmed`, `booking-rescheduled`, `booking-cancelled`, `appointment-reminder`. Dispatch is fire-and-forget — provider errors mark the `notifications` row `failed` without breaking the booking flow.

---

## 5. What's in the Patient App (`src/`)

Routes: `/`, `/doctors`, `/doctor/:id`, `/categories`, `/categories/:specialty`, `/appointments`, `/dashboard`, `/about`, `/career`, `/booking-slots`, `/book/:doctorId`.

**Home page** (sections, top→bottom):
- **Hero** — animated headline, Home Visit / Online Video Consult mode toggle, booking + slots CTAs, video showcase card, floating "Trusted by 10K+" badge
- **Search bar** — "Search Therapists" with live suggestions (doctors + symptoms) + city dropdown
- **Full-width showcase video banner** (`bottom-vid.mp4`)
- **Stat strip** — 10K+ Happy Patients / 100+ Verified Doctors / 10+ Active Cities / 5K+ Recovery Stories; scroll-triggered fade + count-up
- **Symptoms grid** (12, from API) · **Specialty categories grid** (9, from API) · **Featured doctors** · **Why Choose Us** · **Recovery timeline** · **Patient stories** · **Careers CTA** · **App download**
- **Chatbot** — decision-tree assistant (Framer-Motion floating button, mic, minimize/maximize)

**Doctors:** server-side search/filter/sort (mode, symptom, category, max price, gender), full detail page with reviews.

**Booking:** 5-step modal — category/symptom → doctor → real derived slots → patient details → Razorpay checkout → signature verify → confetti. Supports "For myself / For someone else" (records relationship). Reschedule + cancel from appointments list.

**Appointments:** tabs (upcoming/completed/cancelled), live payment status, review prompt on completed visits.

**Dashboard:** profile editor (name, phone, gender, DOB, weight, height, address) + password change + record history.

---

## 6. What's in the Doctor Portal (`admin/`, role: doctor)

Routes under `/` guarded by `RequireDoctor`:
- **Appointments** — today/upcoming/past, mark completed / no-show, view patient snapshot + contact
- **Prescriptions** — write diagnosis/medicines/advice/follow-up for completed appointments
- **Patients** — roster of the doctor's own clients (visit count, last visit, total spent)
- **Schedule** — 7-day grid editor: working bands + breaks per day
- **Profile** — fees, bio, expertise, treatments, photo; disabled until application approved

---

## 7. What's in the Admin Dashboard (`admin/`, role: admin)

Routes under `/admin` guarded by `RequireAdmin`:
- **Dashboard** — KPIs (revenue, bookings, new patients) + insights snapshot
- **Doctors** — list/edit any field, toggle verified/featured, approve/reject applications, per-doctor client rosters, create doctor accounts directly
- **Appointments** — all bookings with status/payment/date/doctor/mode filters + search + pagination
- **Patients** — searchable table; drill into a patient's profile, summary, appointments, and prescriptions
- **Categories** / **Symptoms** — full CRUD (create/edit/delete, slug, sort order, active)
- **CMS** — edit `content_sections` (home/about/footer) JSON
- **Insights** — recharts: bookings & revenue over time, bookings by mode, top doctors, per-doctor client counts, date-range filter
- **Payments** — appointments grouped by payment status

**Seed accounts:** `admin@physio.example` (admin), 6 seed doctors, plus patient sign-up via the app.

---

## 8. Verification Status

- `tsc -b` (root patient app + api) — **clean**
- `tsc --noEmit` (admin) — **clean**
- `oxlint` (all three packages) — **clean** (1 pre-existing fast-refresh warning in `admin/src/lib/auth.tsx`)
- API tests (Vitest + Supertest) — **written for every phase** (health, config, seed, auth, public, appointments, reviews, notifications, doctor, admin) but **require a live Supabase Postgres DB** to run; not executed in this environment.

---

## 9. Remaining Work (Phase 10)

Deploy-prep completed in the repo:
- [x] `docs/DEPLOY.md` — deployment runbook (two Vercel projects, env vars, DB, smoke test)
- [x] `api/index.ts` — Vercel serverless entry for the Express API (root `vercel.json` already rewrites `/api/*` to it)
- [x] `admin/vercel.json` — SPA fallback for admin/doctor client-side routes

Still to do (actual provisioning/deploy):
1. Provision Neon/Supabase Postgres, run `drizzle-kit migrate` + seed prod admin
2. Create the two Vercel projects and set env vars (`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `RAZORPAY_KEY_ID/SECRET`, `TWILIO_*`, `APP_URL`)
3. Deploy API + patient app + admin app to Vercel
4. End-to-end smoke test: register → login → book with Razorpay test card → verify → admin sees booking + insights
