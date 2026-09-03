# Physio Prime — Production Issues Tracker

> **Generated:** 2026-09-03  
> **Overall Production Readiness:** ~55-60%  
> **Stack:** React 19 + Vite (frontend) · Express 5 + Drizzle ORM (backend) · Supabase Auth + PostgreSQL · Razorpay · Twilio · Vercel

> **Reconciled:** This file is now the single source of truth for tracked work. It incorporates the items previously tracked in `docs/AUDIT.md` (which is removed) — most notably the resolved refund / earnings / payout items in [§8 Resolved Items](#8-resolved-items-fixed). Overlapping issues from the two docs were deduplicated; the resolved items are kept for history.

---

## How to Use This File

Each issue has:
- A unique ID (e.g. `SEC-01`) for reference
- **Severity** label: 🔴 Critical · 🟡 High · 🟢 Medium · ⚪ Low
- **Effort** estimate: XS (< 30 min) · S (< 2 hrs) · M (half day) · L (1–2 days) · XL (3+ days)
- **Status** checkbox: `[ ]` open · `[/]` in progress · `[x]` done

---

## Working rules
- Work items **one at a time** — never begin an item until the user explicitly asks.
- Update status (`[ ]` → `[/]` → `[x]`) as work proceeds.
- Decisions with legal/financial impact (e.g. refund policy) require the user to pick a direction before coding.

---

## Table of Contents

1. [Security (SEC)](#1-security)
2. [Missing Critical Features (FEAT)](#2-missing-critical-features)
3. [Infrastructure & DevOps (INFRA)](#3-infrastructure--devops)
4. [SEO & Performance (PERF)](#4-seo--performance)
5. [UX & Frontend Gaps (UX)](#5-ux--frontend-gaps)
6. [Missing Pages (PAGE)](#6-missing-pages)
7. [Code Quality & Maintainability (CODE)](#7-code-quality--maintainability)
8. [Resolved Items (fixed)](#8-resolved-items-fixed)

---

## 1. Security

### `SEC-01` — CORS is wide open 🔴 XS
- **Status:** `[x]`
- **File:** [`server/src/index.ts:28`](file:///d:/DEVELOPMENT/physio-prime/server/src/index.ts#L28)
- **Problem:**
  ```ts
  app.use(cors({ origin: true, credentials: true }));
  ```
  `origin: true` mirrors every incoming `Origin` header back as allowed. Any website on the internet can make credentialed API calls to your backend — reading patient data, booking appointments on behalf of logged-in users.
- **Fix:**
  ```ts
  app.use(cors({
    origin: [
      'https://physio-prime.com',
      'https://www.physio-prime.com',
      'https://admin.physio-prime.com',
      // dev origins only in non-production:
      ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:5173', 'http://localhost:5174'] : []),
    ],
    credentials: true,
  }));
  ```
- **Notes:** Do this before anything else. Takes 5 minutes.

---

### `SEC-02` — No security headers (Helmet missing) 🔴 XS
- **Status:** `[x]`
- **File:** [`server/src/index.ts`](file:///d:/DEVELOPMENT/physio-prime/server/src/index.ts)
- **Problem:** No `helmet` middleware means the API responds with zero security headers:
  - No `X-Frame-Options` → clickjacking risk
  - No `X-Content-Type-Options` → MIME sniffing risk
  - No `Content-Security-Policy`
  - No `Strict-Transport-Security`
  - Express version disclosed in `X-Powered-By`
- **Fix:**
  ```bash
  cd server && npm install helmet
  ```
  ```ts
  import helmet from 'helmet';
  // Add as the very first middleware:
  app.use(helmet());
  ```
- **Notes:** One import, one line. No reason not to have this on day one.

---

### `SEC-03` — No rate limiting on any endpoint 🔴 S
- **Status:** `[x]`
- **File:** [`server/src/index.ts`](file:///d:/DEVELOPMENT/physio-prime/server/src/index.ts)
- **Problem:** Every API endpoint — including auth, booking, and payment — accepts unlimited requests per IP. Exposed to:
  - Credential brute-force on `/api/v1/auth`
  - Slot-hoarding attacks on `/api/v1/appointments`
  - Razorpay order creation abuse
  - Doctor listing scraping
- **Fix:**
  ```bash
  cd server && npm install express-rate-limit
  ```
  ```ts
  import rateLimit from 'express-rate-limit';

  // Strict limit for auth
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true });
  app.use('/api/v1/auth', authLimiter);

  // General API limit
  const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true });
  app.use('/api/v1', apiLimiter);
  ```
- **Notes:** Adjust limits based on expected traffic patterns.

---

### `SEC-04` — Error handler leaks internals 🔴 XS
- **Status:** `[x]`
- **File:** [`server/src/middleware/error.ts`](file:///d:/DEVELOPMENT/physio-prime/server/src/middleware/error.ts)
- **Problem:**
  ```ts
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  res.status(500).json({ error: { message } });
  ```
  `err.message` from database errors, Drizzle ORM, or internal logic can contain SQL queries, table names, file paths, or stack traces. This leaks implementation details to any user who triggers a 500.
- **Fix:**
  ```ts
  export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: { issues: err.issues } });
      return;
    }
    // Log full error server-side (replace with your logger)
    console.error('[ERROR]', err);

    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({
      error: { message: isProd ? 'Something went wrong. Please try again.' : (err instanceof Error ? err.message : 'Internal Server Error') },
    });
  }
  ```

---

### `SEC-05` — No request body size limit 🟡 XS
- **Status:** `[x]`
- **File:** [`server/src/index.ts:32`](file:///d:/DEVELOPMENT/physio-prime/server/src/index.ts#L32)
- **Problem:**
  ```ts
  app.use(express.json());
  ```
  No `limit` set. An attacker can send a multi-MB JSON payload to any endpoint, causing memory exhaustion or DoS.
- **Fix:**
  ```ts
  app.use(express.json({ limit: '512kb' }));
  ```

---

### `SEC-06` — Blog HTML content stored without sanitization 🟡 S
- **Status:** `[ ]`
- **File:** [`server/src/routes/blog.ts`](file:///d:/DEVELOPMENT/physio-prime/server/src/routes/blog.ts)
- **Problem:** Blog post `content` is stored raw (TipTap produces HTML). If this HTML is rendered via `dangerouslySetInnerHTML` on the frontend without sanitization, it's a stored XSS vector — an admin or doctor could inject malicious scripts visible to all patients.
- **Fix (server-side):**
  ```bash
  cd server && npm install sanitize-html
  ```
  ```ts
  import sanitizeHtml from 'sanitize-html';
  // Before insert/update:
  const cleanContent = sanitizeHtml(body.content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2']),
    allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt'] },
  });
  ```
- **Fix (frontend, defence-in-depth):** Use `DOMPurify` before `dangerouslySetInnerHTML`.

---

### `SEC-07` — Signed upload URLs not implemented for Supabase Storage 🟡 M
- **Status:** `[ ]`
- **Problem:** Doctor photos and blog images appear to be uploaded directly from the frontend to Supabase Storage without a server-validated signed URL flow. This means any authenticated user could upload arbitrary files to your storage bucket.
- **Fix:** Add a `/api/v1/upload/signed-url` endpoint that:
  1. Validates the user's role and the target bucket/path
  2. Returns a Supabase signed upload URL via `supabase.storage.from('bucket').createSignedUploadUrl(path)`
  3. Frontend uploads directly to that URL
- **Notes:** Blocks the blog image upload feature completely until resolved.

---

### `SEC-08` — Dummy `passwordHash: 'supabase-auth'` in `users` table (was AUDIT L3) ⚪ XS
- **Status:** `[ ]`
- **Files:** [`server/src/middleware/auth.ts:35`](file:///d:/DEVELOPMENT/physio-prime/server/src/middleware/auth.ts#L35), [`server/src/routes/admin.ts:702`](file:///d:/DEVELOPMENT/physio-prime/server/src/routes/admin.ts#L702)
- **Problem:** The `users.passwordHash` column stores the literal placeholder `'supabase-auth'` (Supabase owns passwords; the app row is just an identity/role mirror). It's harmless — nothing ever uses it for login — but it's a misleading seed value.
- **Fix:** Either make the column nullable and store `NULL` for Supabase-managed users, or leave as-is (documented placeholder). Cosmetic.

---

## 2. Missing Critical Features

### `FEAT-01` — No email notifications 🔴 M
- **Status:** `[ ]`
- **Files:** [`server/src/lib/notifications.ts`](file:///d:/DEVELOPMENT/physio-prime/server/src/lib/notifications.ts), [`server/src/db/schema.ts:193`](file:///d:/DEVELOPMENT/physio-prime/server/src/db/schema.ts#L193)
- **Problem:** The `dispatch()` function only handles `whatsapp` and `sms` channels:
  ```ts
  case 'whatsapp': ...
  case 'sms': ...
  default: throw new Error(`Unknown notification channel: ${notification.channel}`);
  ```
  The `notifications` table has `subject` and `body` columns clearly designed for email. Patients expect booking confirmation emails. Many users won't have WhatsApp. Without email, a large portion of users get **zero booking confirmation**.
- **Fix:**
  ```bash
  cd server && npm install resend
  # (Resend is simplest; alternatively: @sendgrid/mail, nodemailer)
  ```
  ```ts
  // In notifications.ts dispatch():
  case 'email':
    await resend.emails.send({
      from: 'Physio Prime <no-reply@physio-prime.com>',
      to: notification.toAddress,
      subject: notification.subject ?? 'Appointment Update',
      html: notification.body ?? '',
    });
    return;
  ```
  Add `RESEND_API_KEY` to `.env` and `config.ts`. Then call `sendNotification({ channel: 'email', to: patientEmail, ... })` alongside the existing WhatsApp call in the appointments route.
- **Notes:** Resend has a free tier (3,000 emails/month). Can be configured in under 2 hours.

---

### `FEAT-02` — Appointment reminder cron never runs 🔴 S
- **Status:** `[ ]`
- **Files:** [`server/src/lib/notifications.ts:167`](file:///d:/DEVELOPMENT/physio-prime/server/src/lib/notifications.ts#L167), [`server/src/routes/notifications.ts`](file:///d:/DEVELOPMENT/physio-prime/server/src/routes/notifications.ts)
- **Problem:** `sendReminderPass()` is fully implemented and idempotent (checks for existing reminder before sending), but it is **never called automatically**. Patients receive no reminder before their appointment.
- **Fix Option A — Vercel Cron (recommended for Vercel deployment):**
  ```json
  // vercel.json — add crons section
  {
    "crons": [{ "path": "/api/v1/notifications/reminder-cron", "schedule": "0 8 * * *" }]
  }
  ```
  Add a `GET /api/v1/notifications/reminder-cron` route protected by a `CRON_SECRET` header check that calls `sendReminderPass()`.

- **Fix Option B — node-cron (for self-hosted):**
  ```bash
  cd server && npm install node-cron
  ```
  ```ts
  // server/src/main.ts
  import cron from 'node-cron';
  cron.schedule('0 8 * * *', () => sendReminderPass());
  ```
- **Notes:** Without this, the reminder feature silently does nothing.

---

### `FEAT-03` — No password reset page 🔴 S
- **Status:** `[x]`
- **Files:** [`src/App.tsx`](file:///d:/DEVELOPMENT/physio-prime/src/App.tsx), [`src/context/AuthContext.tsx`](file:///d:/DEVELOPMENT/physio-prime/src/context/AuthContext.tsx)
- **Problem:** Supabase sends a password reset email with a link like `https://physio-prime.com/reset-password?type=recovery&access_token=...`. There is no `/reset-password` route in `App.tsx`, so the link lands on a redirect-to-home. Users who forget their password **cannot reset it**.
- **Fix:**
  1. Create `src/pages/ResetPasswordPage.tsx`:
     ```tsx
     // On mount, read the access_token from URL, call:
     supabase.auth.updateUser({ password: newPassword })
     ```
  2. Add route: `<Route path="/reset-password" element={<ResetPasswordPage />} />`
  3. Add "Forgot Password?" link in `AuthModal.tsx` that calls `supabase.auth.resetPasswordForEmail(email)`.

---

### `FEAT-04` — Protected routes have no auth guard 🔴 S
- **Status:** `[x]`
- **File:** [`src/App.tsx:72-73`](file:///d:/DEVELOPMENT/physio-prime/src/App.tsx#L72)
- **Problem:**
  ```tsx
  <Route path="/appointments" element={<AppointmentsPage />} />
  <Route path="/dashboard" element={<DashboardPage />} />
  ```
  Both routes are accessible to logged-out users. They likely render in a broken state (empty data, errors) or silently show nothing, and API calls will get 401s. Confusing and unprofessional.
- **Fix:** Create a `ProtectedRoute` component:
  ```tsx
  // src/components/auth/ProtectedRoute.tsx
  export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, hydrated } = useAuth();
    if (!hydrated) return <LoadingSpinner />;
    if (!user) {
      // Optionally open the auth modal instead of redirecting
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  }
  ```
  ```tsx
  // In App.tsx:
  <Route path="/appointments" element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />
  <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
  ```

---

### `FEAT-05` — No 404 page 🔴 XS
- **Status:** `[x]`
- **File:** [`src/App.tsx:86`](file:///d:/DEVELOPMENT/physio-prime/src/App.tsx#L86)
- **Problem:**
  ```tsx
  <Route path="*" element={<Navigate to="/" replace />} />
  ```
  Any mistyped or broken URL silently sends users to the homepage with no indication of what happened. This hides broken links, breaks browser back-navigation expectations, and is bad UX.
- **Fix:**
  1. Create `src/pages/NotFoundPage.tsx` with a clear 404 message and a "Go Home" button.
  2. Replace: `<Route path="*" element={<NotFoundPage />} />`

---

### `FEAT-06` — No React ErrorBoundary 🔴 S
- **Status:** `[x]`
- **File:** [`src/App.tsx`](file:///d:/DEVELOPMENT/physio-prime/src/App.tsx)
- **Problem:** Any unhandled JavaScript error in a React component (network failure during render, null ref, bad API data shape) will crash the **entire app** to a blank white screen with no message. Users have no way to recover.
- **Fix:**
  ```tsx
  // src/components/ErrorBoundary.tsx
  import React from 'react';

  export class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
  > {
    state = { hasError: false };
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(err: Error, info: React.ErrorInfo) {
      console.error('Uncaught error:', err, info);
      // TODO: send to error reporting service (Sentry)
    }
    render() {
      if (this.state.hasError) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center">
            <h1>Something went wrong.</h1>
            <button onClick={() => window.location.href = '/'}>Go Home</button>
          </div>
        );
      }
      return this.props.children;
    }
  }
  ```
  Wrap in `main.tsx`: `<ErrorBoundary><App /></ErrorBoundary>`

---

### `FEAT-07` — No video call integration for online appointments 🟡 XL
- **Status:** `[ ]`
- **Files:** [`server/src/db/schema.ts:125`](file:///d:/DEVELOPMENT/physio-prime/server/src/db/schema.ts#L125)
- **Problem:** The `appointments` table has a `videoCallLink` column, and the booking flow supports `mode: 'online'`, but there is no mechanism to generate or join a video call. Online appointments are currently broken end-to-end.
- **Fix Options:**
  - **Daily.co** (recommended): Create a room via API on booking confirmation, store the join URL in `videoCallLink`. Simple REST API, generous free tier.
  - **Jitsi (free, open source)**: Generate a room name from `bookingId` — `https://meet.jit.si/physioprime-APT-123456`. No API key needed but less control.
  - **Vonage / Twilio Video**: More complex, more features.
- **Implementation path:**
  1. On appointment creation (post payment), call video provider API to create a room
  2. Save URL to `appointments.videoCallLink`
  3. Show "Join Call" button in patient dashboard and doctor portal at appointment time

---

### `FEAT-08` — Admin blog: Rich text editor not installed 🟡 L
- **Status:** `[ ]`
- **Problem:** No rich text editor (TipTap or equivalent) exists in the codebase. The admin blog form page and TipTap editor component are not implemented. The blog backend API is complete but the frontend editor is missing.

---

### `FEAT-09` — Blog image upload not implemented 🟡 M
- **Status:** `[ ]`
- **Problem:** Blog posts have a `featuredImage` field but there is no image upload mechanism. There's no server endpoint for generating Supabase Storage signed upload URLs (blocks `SEC-07`). No Supabase Storage bucket name defined in config.
- **Depends on:** `SEC-07`
- **Fix:**
  1. Create a `blog-images` bucket in Supabase Storage
  2. Implement `GET /api/v1/upload/signed-url?bucket=blog-images&path=...` (see `SEC-07`)
  3. Wire into `BlogFormPage.tsx` as a file picker that uploads to the signed URL

---

### `FEAT-10` — Doctor profile: Extended fields & change password not implemented 🟡 M
- **Status:** `[x]`
- **File:** [`admin/src/pages/ProfilePage.tsx`](file:///d:/DEVELOPMENT/physio-prime/admin/src/pages/ProfilePage.tsx)
- **Problem:** Per `PROGRESS.md`, the doctor profile page needs phone, designation, employee ID, department, and address fields. Change password functionality is also not implemented. The `doctors` table has columns for all these fields (`phone`, `designation`, `employeeId`, `department`, `address`) but the UI doesn't expose them.
- **Fix:**
  1. Add the missing fields to `ProfilePage.tsx` form
  2. Add "Change Password" section using `supabase.auth.updateUser({ password: newPassword })`

---

### `FEAT-11` — Doctor tracking UI is fully simulated (was AUDIT C3) 🔴 M
- **Status:** `[ ]`
- **File:** [`src/components/tracking/DoctorTrackingModal.tsx`](file:///d:/DEVELOPMENT/physio-prime/src/components/tracking/DoctorTrackingModal.tsx)
- **Problem:** `DoctorTrackingModal.tsx` is a **client-side animation** — hardcoded route waypoints, `Math.random()` ETA, fake notifications, placeholder phone `tel:+919876543210`, and a no-op "Message" toast. There is **zero backend** for GPS/location/websocket, yet the UI presents itself as live tracking.
- **Fix:** Integrate a real location provider (doctor app + live socket/GPS feed), or remove/hide the tracking modal entirely until then.
- **Notes:** Same "fake feature, paid/positioned as real" class as `FEAT-07` (video). Decide: wire it or cut it.

### `FEAT-12` — Unpaid / abandoned bookings block slots forever (was AUDIT H1) 🟡 M
- **Status:** `[ ]`
- **Files:** [`server/src/routes/appointments.ts:243-252`](file:///d:/DEVELOPMENT/physio-prime/server/src/routes/appointments.ts#L243)
- **Problem:** No cron/cleanup exists. A prepay appointment created but never paid stays `status:'upcoming'` + `paymentStatus:'pending'` indefinitely and still counts as "booked" in slot availability. Ghost bookings block real ones.
- **Fix:** Add a job to expire/void stale unpaid appointments (e.g. after 15–30 min) and free the slot. Wire a cron/Vercel cron to run it (see also `FEAT-02`).

### `FEAT-13` — Doctor notifications are dead code (was AUDIT H2) 🟡 M
- **Status:** `[ ]`
- **File:** [`server/src/lib/seed.ts:253`](file:///d:/DEVELOPMENT/physio-prime/server/src/lib/seed.ts#L253)
- **Problem:** The `doctorNotifications` API + UI exist but nothing inserts a row in app logic — only `seed.ts`. New bookings/cancellations produce no doctor notification.
- **Fix:** Emit doctor notifications from real events (booking created, cancelled, review left, etc.) at shared points in the appointment / doctor flows.

### `FEAT-14` — Admin Settings page broken (was AUDIT H5) 🟡 XS
- **Status:** `[ ]`
- **File:** [`admin/src/pages/admin/SettingsPage.tsx`](file:///d:/DEVELOPMENT/physio-prime/admin/src/pages/admin/SettingsPage.tsx)
- **Problem:** The Settings page reads CMS for `page='settings'`, but [`server/src/routes/cms.ts:9`](file:///d:/DEVELOPMENT/physio-prime/server/src/routes/cms.ts#L9) only allows `home|about|footer` → the page will 400.
- **Fix:** Add `settings` to the allowed CMS pages (and admin `PUT /cms/:page` whitelist at `admin.ts:916`) or make the Settings page not depend on CMS.

### `FEAT-15` — No resend email-confirmation path (was AUDIT M2) 🟡 XS
- **Status:** `[ ]`
- **Problem:** After sign-up, "check your inbox" is a dead end — there is no way to trigger a new Supabase verification email if the first is lost/expired.
- **Fix:** Add a "Resend confirmation" action (e.g. in `AuthModal.tsx`) calling `supabase.auth.resend({ type: 'signup', email })`.

### `FEAT-16` — No payment retry for failed prepay appointments (was AUDIT M3) 🟡 M
- **Status:** `[ ]`
- **Problem:** A prepay appointment that fails payment is stuck on `paymentStatus:'failed'` with no retry path — the patient must start a fresh booking.
- **Fix:** Add a retry endpoint/UI that re-initiates a Razorpay order for the existing appointment (or safely allows rebooking it).

### `FEAT-17` — No doctor↔patient chat (was AUDIT M4) 🟡 L
- **Status:** `[ ]`
- **File:** [`server/src/routes/messages.ts`](file:///d:/DEVELOPMENT/physio-prime/server/src/routes/messages.ts)
- **Problem:** `messages.ts` is doctor-to-doctor. There is no patient-facing chat channel, and the tracking modal's "Message" action is a fake toast.
- **Fix:** Extend conversations/messages to support patient participants (participant checks already exist; add patient access + booking-scoped conversations).

### `FEAT-18` — Admin notifications UI missing (was AUDIT M5) 🟢 M
- **Status:** `[ ]`
- **Problem:** The admin notifications API exists but there is no UI surface to view/retry failed notifications.
- **Fix:** Add an admin notifications page consuming the existing route.

### `FEAT-19` — No doctor blog approval gate (was AUDIT M8) 🟡 S
- **Status:** `[ ]`
- **File:** [`server/src/routes/doctor-blog.ts:240`](file:///d:/DEVELOPMENT/physio-prime/server/src/routes/doctor-blog.ts#L240)
- **Problem:** Doctors self-publish with `status:'published'` — no admin gate. Combined with unsanitized HTML (`SEC-06`), a compromised or careless doctor account ships content directly to the public blog.
- **Fix:** Require an admin review step that flips an approved flag before `status:'published'`; hide draft/un-reviewed posts from the public blog route.

---

## 3. Infrastructure & DevOps

### `INFRA-01` — No structured logging 🟡 S
- **Status:** `[ ]`
- **Files:** All server route files
- **Problem:** Every log call is a raw `console.log` / `console.error`. In production on Vercel or any cloud platform, these are unstructured strings that are impossible to query, filter by severity, or correlate across requests. Debugging production issues becomes very hard.
- **Fix:**
  ```bash
  cd server && npm install pino pino-pretty
  ```
  ```ts
  // server/src/lib/logger.ts
  import pino from 'pino';
  export const logger = pino({
    level: process.env.LOG_LEVEL ?? 'info',
    ...(process.env.NODE_ENV !== 'production' ? { transport: { target: 'pino-pretty' } } : {}),
  });
  ```
  Replace `console.error(err)` with `logger.error({ err }, 'description')` throughout.
- **Notes:** Structured logs (JSON) work with Vercel Log Drains, Datadog, Logtail, etc.

---

### `INFRA-02` — Database health check is superficial 🟡 XS
- **Status:** `[x]`
- **File:** [`server/src/routes/health.ts`](file:///d:/DEVELOPMENT/physio-prime/server/src/routes/health.ts)
- **Problem:** The health endpoint (172 bytes) almost certainly just returns `{ ok: true }` without actually checking DB connectivity. If the database is down, the health check still returns 200 — useless for monitoring.
- **Fix:**
  ```ts
  import { sql } from 'drizzle-orm';
  healthRouter.get('/', async (_req, res) => {
    try {
      await db.execute(sql`SELECT 1`);
      res.json({ ok: true, db: 'ok', ts: new Date().toISOString() });
    } catch (err) {
      res.status(503).json({ ok: false, db: 'error' });
    }
  });
  ```

---

### `INFRA-03` — No graceful shutdown 🟡 S
- **Status:** `[ ]`
- **File:** [`server/src/main.ts`](file:///d:/DEVELOPMENT/physio-prime/server/src/main.ts)
- **Problem:** The server likely doesn't handle `SIGTERM` (the signal Vercel/Docker/PM2 sends before killing a process). In-flight requests — including active booking and payment flows — can be abruptly dropped mid-transaction, leaving data in inconsistent states.
- **Fix:**
  ```ts
  const server = app.listen(port, () => logger.info(`Listening on port ${port}`));

  async function shutdown(signal: string) {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await pool.end(); // close DB pool
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000); // force after 10s
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  ```

---

### `INFRA-04` — No DB connection pool config for serverless 🟡 S
- **Status:** `[ ]`
- **File:** [`server/src/db/pool.ts`](file:///d:/DEVELOPMENT/physio-prime/server/src/db/pool.ts)
- **Problem:** Running on Vercel serverless means each function invocation may create a new DB connection. With no `max` pool size set, under concurrent load you can hit Supabase's connection limit (typically 60 on free tier, 200 on pro) very quickly, causing `too many connections` errors.
- **Fix:** Use Supabase's built-in PgBouncer (transaction mode) connection pooler:
  1. In Supabase dashboard → Settings → Database → Connection Pooling → copy the **Transaction** connection string
  2. Set it as `DATABASE_URL` in production env
  3. Append `?pgbouncer=true` and add `max: 1` to the `pg` pool config (each serverless function should use 1 connection)

---

### `INFRA-05` — `bcryptjs` is only used by seed scripts 🟢 XS
- **Status:** `[ ]`
- **File:** [`server/package.json`](file:///d:/DEVELOPMENT/physio-prime/server/server/package.json)
- **Problem:** `bcryptjs` is a production dependency but is **only used by seed scripts** (`server/src/lib/seed.ts:17,595` — `bcrypt.hashSync('physio123', 10)`). Runtime auth is fully delegated to Supabase — password hashing is Supabase's responsibility. The `passwordHash` field in the `users` table stores the literal string `'supabase-auth'` for Supabase-managed users. It is not *dead*, but it doesn't belong in the runtime/production dependency set.
- **Fix:** `cd server && npm uninstall bcryptjs`, then hardcode or move the seed hash generation so seeding doesn't need it (or move `bcryptjs` to `devDependencies`).
- **Notes:** If you ever add local password auth (not recommended — stick with Supabase), re-add it then.

---

### `INFRA-06` — No error monitoring service (Sentry) 🟢 M
- **Status:** `[ ]`
- **Problem:** There is no integration with an error monitoring service. Production errors are invisible unless a user reports them or you manually scan logs. You won't know if the booking flow is silently failing for a subset of users.
- **Fix:** Install Sentry in both frontend and backend:
  ```bash
  npm install @sentry/react        # in src/
  npm install @sentry/node         # in server/
  ```
  Initialize in `main.tsx` and `server/src/main.ts` with your DSN. Sentry has a generous free tier.

---

### `INFRA-07` — No CI/CD pipeline 🟢 L
- **Status:** `[ ]`
- **Problem:** No `.github/workflows/` directory exists. There is no automated pipeline to:
  - Run TypeScript type-check on PRs
  - Run the 13 server tests
  - Lint with oxlint
  - Block merges if tests fail
- **Fix:** Create `.github/workflows/ci.yml`:
  ```yaml
  name: CI
  on: [push, pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: '20' }
        - run: npm install
        - run: npm run lint
        - run: npm run build
        - run: npm run test
          env:
            DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
            # ... other test env vars
  ```

---

## 4. SEO & Performance

### `PERF-01` — Zero per-page SEO meta tags 🔴 M
- **Status:** `[ ]`
- **Files:** All page files in [`src/pages/`](file:///d:/DEVELOPMENT/physio-prime/src/pages/)
- **Problem:** The entire public site is a React SPA. The root `index.html` has one static `<title>` and one static `<meta name="description">`. Every page — including doctor profiles, blog posts, condition pages — shows the same title and description. Google will see them as duplicate, thin-content pages. Blog posts and doctor profiles (the most SEO-valuable pages) are completely invisible.
- **Fix:**
  ```bash
  cd src && npm install react-helmet-async
  ```
  ```tsx
  // src/main.tsx — wrap in HelmetProvider
  import { HelmetProvider } from 'react-helmet-async';
  <HelmetProvider><App /></HelmetProvider>

  // In each page component:
  import { Helmet } from 'react-helmet-async';
  <Helmet>
    <title>Dr. {doctor.name} — Physiotherapist | Physio Prime</title>
    <meta name="description" content={doctor.bio?.slice(0, 155)} />
    <meta property="og:title" content={`Dr. ${doctor.name}`} />
    <meta property="og:image" content={doctor.photo} />
  </Helmet>
  ```
- **Priority pages:** DoctorDetailPage, BlogDetailPage, ConditionDetailPage, CategoryDetailPage, HomePage

---

### `PERF-02` — No robots.txt 🟡 XS
- **Status:** `[ ]`
- **File:** [`public/`](file:///d:/DEVELOPMENT/physio-prime/public/)
- **Problem:** No `robots.txt` file. Search engine crawlers have no directives — they may crawl API routes, admin paths, or other unintended URLs.
- **Fix:** Create `public/robots.txt`:
  ```
  User-agent: *
  Allow: /
  Disallow: /api/
  Disallow: /dashboard
  Disallow: /appointments
  Sitemap: https://physio-prime.com/sitemap.xml
  ```

---

### `PERF-03` — No sitemap.xml 🟡 M
- **Status:** `[ ]`
- **Problem:** No sitemap means Google has to discover pages by crawling links alone. Doctor profile pages, blog posts, and condition pages won't be indexed reliably or promptly.
- **Fix:** Generate a sitemap at build time using Vite plugin or a build script that:
  1. Fetches all published doctors, blog posts, and conditions from the DB
  2. Generates `public/sitemap.xml` with `<url>` entries including `<lastmod>`
  3. Updates automatically with each deployment

---

### `PERF-04` — Chatbot loaded in initial bundle (49 KB component) 🟡 XS
- **Status:** `[ ]`
- **File:** [`src/App.tsx:31`](file:///d:/DEVELOPMENT/physio-prime/src/App.tsx#L31)
- **Problem:**
  ```tsx
  import { ChatbotButton } from './components/chatbot/ChatbotButton';
  ```
  `ChatbotButton.tsx` imports `Chatbot.tsx` (49 KB of script, likely ~150+ KB unminified with all its conversational tree). This is loaded for every user on every page even if they never open the chatbot.
- **Fix:**
  ```tsx
  // In App.tsx:
  const ChatbotButton = React.lazy(() =>
    import('./components/chatbot/ChatbotButton').then(m => ({ default: m.ChatbotButton }))
  );
  // Wrap in Suspense (null fallback — button is non-critical):
  <Suspense fallback={null}><ChatbotButton /></Suspense>
  ```

---

### `PERF-05` — No image optimization 🟢 M
- **Status:** `[ ]`
- **Problem:** Doctor profile photos and blog images load at full resolution with no:
  - `loading="lazy"` attribute on `<img>` tags below the fold
  - `srcset` / responsive sizing
  - WebP/AVIF format conversion
  - Width/height attributes (causes layout shift)
- **Fix (short term):** Add `loading="lazy"` and explicit `width`/`height` to all non-hero images.
- **Fix (long term):** Use Supabase Storage image transformations (`?width=400&quality=80`) or Cloudflare Images for automatic format optimization.

---

### `PERF-06` — No SSR for SEO-critical pages 🟢 XL
- **Status:** `[ ]`
- **Problem:** All pages are client-rendered. Googlebot gets an empty `<div id="root"></div>` initially. While Google can execute JavaScript, indexing is delayed and inconsistent — especially problematic for blog posts and doctor profile pages.
- **Fix (pragmatic):** In the short term, `react-helmet-async` (`PERF-01`) is sufficient. For full SSR, evaluate migrating SEO-critical pages to Next.js App Router in the future.
- **Notes:** This is a long-term architectural decision, not an urgent fix.

---

## 5. UX & Frontend Gaps

### `UX-01` — No global toast/notification system 🟡 S
- **Status:** `[ ]`
- **Problem:** Success and error states are handled inconsistently across the app — some show inline messages, some show nothing at all. Users get no consistent feedback when:
  - A booking is confirmed
  - Profile is updated
  - A payment fails
  - A form submission errors
- **Fix:**
  ```bash
  cd src && npm install sonner
  # (or react-hot-toast)
  ```
  ```tsx
  // src/main.tsx
  import { Toaster } from 'sonner';
  // Add inside app root: <Toaster position="top-right" richColors />

  // Usage anywhere:
  import { toast } from 'sonner';
  toast.success('Booking confirmed!');
  toast.error('Payment failed. Please try again.');
  ```

---

### `UX-02` — Catch-all route silently redirects instead of showing 404 🟡 XS
- **Status:** `[x]`
- **Depends on:** `FEAT-05`
- **Problem:** Related to `FEAT-05` but also a UX issue — users who mistype a URL (e.g. `/docter` instead of `/doctor`) get silently taken to the homepage with no explanation, breaking the browser back button expectation.

---

### `UX-03` — Chatbot has no real AI backend 🟢 L
- **Status:** `[ ]`
- **File:** [`src/components/chatbot/Chatbot.tsx`](file:///d:/DEVELOPMENT/physio-prime/src/components/chatbot/Chatbot.tsx)
- **Problem:** The chatbot (49 KB) appears to be a scripted decision-tree flow with no connection to an AI backend. There's no chatbot API endpoint in the server. If this is meant to be an AI-powered assistant, the backend integration is missing.
- **Fix Options:**
  - **Gemini API** (cost-effective): Add a `POST /api/v1/chatbot/message` endpoint that calls Gemini with a physiotherapy-focused system prompt and the patient's message
  - **Keep scripted**: Fine as-is for simple FAQ flows, but don't market it as AI

---

### `UX-04` — No "Forgot Password" link in AuthModal 🔴 XS
- **Status:** `[x]`
- **File:** [`src/components/auth/AuthModal.tsx`](file:///d:/DEVELOPMENT/physio-prime/src/components/auth/AuthModal.tsx)
- **Depends on:** `FEAT-03`
- **Problem:** Users who forget their password have no recovery path visible in the login modal.
- **Fix:** Add a "Forgot your password?" link/button in the login form that calls:
  ```ts
  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  ```
  Then show a "Check your email" confirmation message.

---

### `UX-05` — No loading state during auth hydration 🟢 S
- **Status:** `[ ]`
- **File:** [`src/context/AuthContext.tsx:46`](file:///d:/DEVELOPMENT/physio-prime/src/context/AuthContext.tsx#L46)
- **Problem:** The `AuthContext` has a `hydrated` flag but if it's not used to show a loading spinner during the initial Supabase session check, protected pages may flash briefly in an unauthed state before redirecting — creating a jarring UX.
- **Fix:** In `ProtectedRoute` (from `FEAT-04`), show a full-page spinner while `!hydrated`.

---

### `UX-06` — Doctor list API is not paginated 🟢 S
- **Status:** `[ ]`
- **File:** [`server/src/routes/doctors.ts:86`](file:///d:/DEVELOPMENT/physio-prime/server/src/routes/doctors.ts#L86)
- **Problem (confirmed):** `GET /api/v1/doctors` (`doctors.ts`) has **no `page`/`limit`/`offset` support** — it runs `db.select(summaryColumns).from(doctors)` across all filters and returns every matching doctor in one response, then re-queries locations for all of them. As the doctor roster grows, list load time and payload size degrade linearly for every user.
- **Fix:** Add `page`/`limit` (and a `total`) to the doctors endpoint, mirroring the pattern already used in `blog.ts`, `public-blog.ts`, `admin.ts`, and `community.ts`. Use React Query's `useInfiniteQuery` or simple pagination controls on `FindDoctorsPage.tsx`.
- **Notes:** All sibling list endpoints already paginate — this one is the outlier.

---

## 6. Missing Pages

### `PAGE-01` — No 404 Page 🔴 XS
- **Status:** `[x]`
- **Depends on:** `FEAT-05`
- See `FEAT-05`.

---

### `PAGE-02` — No Contact Us page 🟢 S
- **Status:** `[ ]`
- **Problem:** No way for patients or doctors to contact support other than replying to notifications. A contact form or at minimum a page with contact details (email, phone, address) is expected by users and required for trust/compliance.
- **Fix:** Create `src/pages/ContactPage.tsx` with a simple contact form (name, email, message) and add it to the footer. Backend: a simple `POST /api/v1/contact` that emails your support address.

---

### `PAGE-03` — No doctor public registration / application page 🟢 M
- **Status:** `[ ]`
- **Problem:** The `doctor_applications` table exists and the admin can review applications, but there is no public-facing page where a doctor can apply to join the platform. New doctor acquisition relies entirely on manual admin creation.
- **Fix:** Create a `src/pages/DoctorApplyPage.tsx` with a form (name, email, phone, specialty, registration number, experience). Submit creates a user + `doctorApplications` record. Admin reviews in the dashboard.

---

### `PAGE-04` — No email verification landing page 🔴 S
- **Status:** `[ ]`
- **Problem:** When a new user registers, Supabase sends a verification email with a link like `https://physio-prime.com/verify?token_hash=...&type=email`. There is no route to handle this — the verification link lands on a redirect-to-home, and while Supabase will still process the verification from the URL params, the user sees no confirmation.
- **Fix:**
  1. Add `<Route path="/verify" element={<EmailVerifyPage />} />` in `App.tsx`
  2. The page reads URL params and calls `supabase.auth.verifyOtp()` or just shows a "Email verified!" message.

---

### `PAGE-05` — No booking confirmation / success page 🟡 S
- **Status:** `[ ]`
- **Problem:** After completing a booking and payment, there is no dedicated confirmation page. Users likely see an in-modal success message or get redirected back to the booking flow. A dedicated `/booking/success?bookingId=APT-XXXXX` page with booking summary, next steps, and "Add to Calendar" would significantly improve post-booking experience.

---

## 7. Code Quality & Maintainability

### `CODE-01` — No frontend tests 🟢 L
- **Status:** `[ ]`
- **Problem:** Zero test files in `src/` or `admin/src/`. The server has 13 test files (good!) but the entire React codebase — including critical flows like the booking multi-step form, AuthContext, and payment verification — has no tests.
- **Fix:**
  ```bash
  cd src && npm install -D vitest @testing-library/react @testing-library/user-event jsdom
  ```
  Start with the most critical: `AuthContext`, `BookingContext`, and the `ConfirmStep` component (30 KB — most complex).

---

### `CODE-02` — No Drizzle `relations()` defined 🟢 S
- **Status:** `[ ]`
- **File:** [`server/src/db/schema.ts`](file:///d:/DEVELOPMENT/physio-prime/server/src/db/schema.ts)
- **Problem:** The schema has no `relations()` declarations. Without them, all joins are manual `.leftJoin()` calls, losing Drizzle's type-safe relational query API (`db.query.doctors.findMany({ with: { schedules: true } })`). This leads to verbose, repetitive join code scattered across route files.
- **Fix:** Add `export const doctorsRelations = relations(doctors, ({ many }) => ({ schedules: many(doctorSchedules), ... }))` for each table.

---

### `CODE-03` — DB columns use plain `text` where enums should be used 🟢 M
- **Status:** `[ ]`
- **File:** [`server/src/db/schema.ts`](file:///d:/DEVELOPMENT/physio-prime/server/src/db/schema.ts)
- **Problem:** Several critical columns use `text` with no DB-level constraints:
  - `users.role` — should only be `'patient' | 'doctor' | 'admin'`
  - `appointments.status` — should only be `'upcoming' | 'completed' | 'cancelled' | 'no-show'`
  - `appointments.paymentStatus` — `'pending' | 'paid' | 'refunded'`
  If application code has a bug, invalid values silently enter the DB. Use Drizzle's `pgEnum` or `check` constraints.
- **Fix:**
  ```ts
  // schema.ts
  export const userRoleEnum = pgEnum('user_role', ['patient', 'doctor', 'admin']);
  export const users = pgTable('users', {
    ...
    role: userRoleEnum('role').notNull(),
  });
  ```

---

### `CODE-04` — Single `queries.ts` hooks file 🟢 XS
- **Status:** `[ ]`
- **File:** [`src/hooks/queries.ts`](file:///d:/DEVELOPMENT/physio-prime/src/hooks/queries.ts)
- **Problem:** All React Query hooks are in a single 3 KB file. As the app grows this will become a 500-line file mixing doctor, appointment, blog, and auth queries.
- **Fix:** Split into domain-specific files: `src/hooks/useDoctors.ts`, `src/hooks/useAppointments.ts`, `src/hooks/useBlog.ts`, etc.

---

### `CODE-05` — `bcryptjs` in runtime deps but only used by seed 🟢 XS
- **Status:** `[ ]`
- **Depends on:** `INFRA-05`
- See `INFRA-05`.

---

### `CODE-06` — No `.env` validation on frontend startup 🟢 XS
- **Status:** `[ ]`
- **Problem:** The server validates its environment variables via Zod on startup (`config.ts`), which is excellent. But the frontend (`src/`) has no equivalent check — if `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing, the app silently loads and fails at runtime with cryptic Supabase errors.
- **Fix:**
  ```ts
  // src/lib/env.ts
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  for (const key of required) {
    if (!import.meta.env[key]) throw new Error(`Missing env var: ${key}`);
  }
  ```
  Import this at the top of `main.tsx`.

---

### `CODE-07` — Minimal automated coverage for booking/cancel/commission paths (was AUDIT L4) 🟢 M
- **Status:** `[ ]`
- **Problem:** Server tests are strong overall, but booking/cancel/commission edge paths are thin, and these routers are never tested at all: **community (forum posts/replies/votes), doctor messaging (conversations/messages), locations, blog (admin/doctor/public), doctor-notifications.** The Razorpay crypto itself (`verifySignature`/`verifyWebhookSignature`) is fully mocked in every suite, and the `FOR UPDATE` booking contention race is never exercised.
- **Fix:** Add spec files for the untested routers; add real-HMAC unit tests for the Razorpay lib; add a concurrency test for duplicate same-slot bookings.
- **Notes:** Frontend (patient + admin) still has zero tests — see `CODE-01`.

### `CODE-08` — Two parallel notification systems (was AUDIT L5) 🟢 S
- **Status:** `[ ]`
- **Files:** [`server/src/lib/notifications.ts`](file:///d:/DEVELOPMENT/physio-prime/server/src/lib/notifications.ts), [`server/src/routes/doctor-notifications.ts`](file:///d:/DEVELOPMENT/physio-prime/server/src/routes/doctor-notifications.ts)
- **Problem:** `notifications.ts` (patient-facing, Twilio) and `doctor-notifications.ts` (doctor in-app) are parallel systems with **no shared emission point** — an event can notify one audience and silently skip the other (see also `FEAT-13`, doctor notifications are dead code).
- **Fix:** Consolidate emission behind a single `emitAppointmentEvent(...)` that fans out to both channels, instead of calling each system separately or not at all.

---

## Issue Summary

| ID | Title | Severity | Effort | Status |
|---|---|---|---|---|
| SEC-01 | CORS wide open | 🔴 Critical | XS | `[x]` |
| SEC-02 | No Helmet headers | 🔴 Critical | XS | `[x]` |
| SEC-03 | No rate limiting | 🔴 Critical | S | `[x]` |
| SEC-04 | Error handler leaks internals | 🔴 Critical | XS | `[x]` |
| SEC-05 | No body size limit | 🟡 High | XS | `[x]` |
| SEC-06 | Blog HTML not sanitized | 🟡 High | S | `[ ]` |
| SEC-07 | No signed upload URLs | 🟡 High | M | `[ ]` |
| SEC-08 | Dummy `passwordHash` in users table | ⚪ Low | XS | `[ ]` |
| FEAT-01 | No email notifications | 🔴 Critical | M | `[ ]` |
| FEAT-02 | Reminder cron never runs | 🔴 Critical | S | `[ ]` |
| FEAT-03 | No password reset page | 🔴 Critical | S | `[x]` |
| FEAT-04 | No auth guards on protected routes | 🔴 Critical | S | `[x]` |
| FEAT-05 | No 404 page | 🔴 Critical | XS | `[x]` |
| FEAT-06 | No React ErrorBoundary | 🔴 Critical | S | `[x]` |
| FEAT-07 | No video call integration | 🟡 High | XL | `[ ]` |
| FEAT-08 | Blog: TipTap editor not installed | 🟡 High | L | `[ ]` |
| FEAT-09 | Blog image upload not implemented | 🟡 High | M | `[ ]` |
| FEAT-10 | Doctor profile fields incomplete | 🟡 High | M | `[x]` |
| FEAT-11 | Doctor tracking UI is fully simulated | 🔴 Critical | M | `[ ]` |
| FEAT-12 | Unpaid bookings block slots forever | 🟡 High | M | `[ ]` |
| FEAT-13 | Doctor notifications are dead code | 🟡 High | M | `[ ]` |
| FEAT-14 | Admin Settings page broken | 🟡 High | XS | `[ ]` |
| FEAT-15 | No resend email-confirmation path | 🟡 High | XS | `[ ]` |
| FEAT-16 | No payment retry for failed prepay | 🟡 High | M | `[ ]` |
| FEAT-17 | No doctor↔patient chat | 🟡 High | L | `[ ]` |
| FEAT-18 | Admin notifications UI missing | 🟢 Medium | M | `[ ]` |
| FEAT-19 | No doctor blog approval gate | 🟡 High | S | `[ ]` |
| INFRA-01 | No structured logging | 🟡 High | S | `[ ]` |
| INFRA-02 | DB health check superficial | 🟡 High | XS | `[x]` |
| INFRA-03 | No graceful shutdown | 🟡 High | S | `[ ]` |
| INFRA-04 | No DB pool config for serverless | 🟡 High | S | `[ ]` |
| INFRA-05 | `bcryptjs` only in seed scripts | 🟢 Medium | XS | `[ ]` |
| INFRA-06 | No error monitoring (Sentry) | 🟢 Medium | M | `[ ]` |
| INFRA-07 | No CI/CD pipeline | 🟢 Medium | L | `[ ]` |
| PERF-01 | No per-page SEO meta tags | 🔴 Critical | M | `[ ]` |
| PERF-02 | No robots.txt | 🟡 High | XS | `[ ]` |
| PERF-03 | No sitemap.xml | 🟡 High | M | `[ ]` |
| PERF-04 | Chatbot in initial bundle | 🟡 High | XS | `[ ]` |
| PERF-05 | No image optimization | 🟢 Medium | M | `[ ]` |
| PERF-06 | No SSR for SEO-critical pages | 🟢 Medium | XL | `[ ]` |
| UX-01 | No global toast system | 🟡 High | S | `[ ]` |
| UX-02 | Catch-all silently redirects | 🟡 High | XS | `[x]` |
| UX-03 | Chatbot has no AI backend | 🟢 Medium | L | `[ ]` |
| UX-04 | No "Forgot Password" in AuthModal | 🔴 Critical | XS | `[x]` |
| UX-05 | No loading state during auth hydration | 🟢 Medium | S | `[ ]` |
| UX-06 | Doctor list API not paginated | 🟢 Medium | S | `[ ]` |
| PAGE-01 | No 404 page | 🔴 Critical | XS | `[x]` |
| PAGE-02 | No Contact Us page | 🟢 Medium | S | `[ ]` |
| PAGE-03 | No doctor application page | 🟢 Medium | M | `[ ]` |
| PAGE-04 | No email verification page | 🔴 Critical | S | `[ ]` |
| PAGE-05 | No booking success page | 🟡 High | S | `[ ]` |
| CODE-01 | No frontend tests | 🟢 Medium | L | `[ ]` |
| CODE-02 | No Drizzle relations | 🟢 Medium | S | `[ ]` |
| CODE-03 | No DB enums / check constraints | 🟢 Medium | M | `[ ]` |
| CODE-04 | Single queries.ts file | 🟢 Medium | XS | `[ ]` |
| CODE-05 | `bcryptjs` in runtime deps, seed-only | 🟢 Medium | XS | `[ ]` |
| CODE-06 | No frontend env validation | 🟢 Medium | XS | `[ ]` |
| CODE-07 | Thin coverage: booking/comm + untested routers | 🟢 Medium | M | `[ ]` |
| CODE-08 | Two parallel notification systems | 🟢 Medium | S | `[ ]` |

---

## 8. Resolved Items (fixed)

Resolved items carried over from the former `docs/AUDIT.md`. Kept for history and audit trail; no work remains.

### `RES-01` — Refund policy reconciled with Terms (was AUDIT C1) 🔴 `[x]`
- **Summary:** Physical-safety/legal conflict: the Terms page and booking checkbox promised the payment was **non-refundable**, but the backend refunded **in full** on every patient cancellation (no window, no partial logic). With the user's decision to **enforce non-refundable** (match the Terms), the code now behaves as the published Terms promise.
- **Fix applied:**
  - `server/src/routes/appointments.ts:482-503` — removed the auto `createRefund` on patient cancellation; a patient-cancelled appointment keeps `paymentStatus` unchanged (`paid` stays `paid`). No refund is issued.
  - `server/src/lib/notifications.ts` — the cancellation message now appends "As per our Terms, the payment is non-refundable."
  - Removed the now-unused `createRefund` import from `appointments.ts`.
- **Verify:** Cancel a paid appointment → it stays `cancelled` with `paymentStatus` = `paid` and no Razorpay refund is issued.
- **Note:** The clinic-side cancel (`doctor.ts` status update) never refunded and is untouched. Terms line 59 still lets the *clinic* offer a refund on *clinic* cancellation — that path is separate and out of scope here.

### `RES-02` — Earnings show net, not gross (was AUDIT H3) 🟡 `[x]`
- **Summary:** `server/src/routes/earnings.ts:74-77` summed `feePaise` (gross) and never subtracted the platform commission, though `computeCommission()` and `paymentTransactions.doctorEarningsPaise` track net. Earnings summary and payout balance could disagree.
- **Fix applied:**
  - `server/src/lib/commission.ts` — added `netAmountSql()` (SQL twin of `computeCommission`, same JS rounding via `::numeric` division + `round`).
  - `earnings.ts` summary + chart and `payouts.ts` (earned balance) now sum **net** through `netAmountSql`, joined to `doctors.platformFeePercent`, so every number agrees with the payment ledger and each other.
- **Verify:** `server/test/payouts.test.ts` asserts `paidEarningsPaise` = net (not gross) and `availableBalancePaise` equals the same figure.

### `RES-03` — Payouts hardened against double-request & bad completions (was AUDIT H4) 🟡 `[x]`
- **Summary:** Admin `PATCH /payouts/:id` only flipped a DB status; no actual disbursement (no Razorpay Payouts / bank API), `transactionId` free-text, money moved by hand. Hardened the manual path so the same money can't be requested twice and completions are validated.
- **Fix applied:**
  - `server/src/routes/payouts.ts` — `getEarnedNet()` / `getAvailableBalance()` now also **reserve pending/processing payouts**, so the same money can't be requested twice before the first request resolves.
  - `server/src/routes/admin.ts:1138` — payout status is one-way (`pending → processing/failed`, `processing → completed/failed`; terminal states locked), `transactionId` is **required** (trimmed, non-blank) to complete, and completion validates the amount against the doctor's net earned balance.
  - `admin/src/pages/admin/DoctorPayoutsPage.tsx` — Complete modal requires a transaction ID and surfaces backend rejections.
- **Verify:** `server/test/payouts.test.ts` covers over-request rejection, balance reservation, processing gate, required transactionId, and terminal-state locking.
- **Note:** Real Razorpay Payouts auto-disbursement still needs payout credentials + doctor bank/UPI registration captured — out of scope for the manual path.

---

## Suggested Sprint Order

> `RES-01` / `RES-02` / `RES-03` are done and no longer appear in the sprints.

### Sprint 1 — Security & Stability (1 day)
`SEC-01` → `SEC-02` → `SEC-03` → `SEC-04` → `SEC-05` → `FEAT-05` → `FEAT-06` → `UX-04` → `INFRA-02`

### Sprint 2 — Auth & Core UX (1–2 days)
`FEAT-03` → `FEAT-04` → `FEAT-15` → `PAGE-04` → `UX-01` → `UX-02` → `UX-05` → `PAGE-05`

### Sprint 3 — Notifications, Data-Integrity & SEO (1–2 days)
`FEAT-01` → `FEAT-02` → `FEAT-12` → `FEAT-13` → `FEAT-18` → `PERF-01` → `PERF-02` → `PERF-04`

### Sprint 4 — Infrastructure (1 day)
`INFRA-01` → `INFRA-03` → `INFRA-04` → `INFRA-07`

### Sprint 5 — Features (2–3 days)
`FEAT-07` → `FEAT-11` → `FEAT-19` → `FEAT-16` → `FEAT-17` → `FEAT-09` → `FEAT-10` → `FEAT-14` → `SEC-07` → `SEC-06`

### Sprint 6 — SEO & Performance (2 days)
`PERF-03` → `PERF-05` → `PAGE-02` → `PAGE-03`

### Sprint 7 — Code Quality (ongoing)
`CODE-01` → `CODE-02` → `CODE-03` → `CODE-04` → `CODE-05` → `CODE-06` → `CODE-07` → `CODE-08` → `INFRA-06` → `PERF-06`
