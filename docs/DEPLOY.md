# Deploying Physio-Prime to Vercel

Runbook for deploying the three-role platform. Everything below is prepared in the repo; this doc is the manual steps a human (or a later agent) executes.

## Topology

Three artifacts, one repo (npm workspaces):

| Artifact | Location | How it deploys |
|---|---|---|
| Patient app | repo root (`src/`, `index.html`, `vite.config.ts`) | Vite SPA, project root = repo root |
| Admin + doctor portal | `admin/` | Vite SPA, project root = `admin/` |
| Express API | `server/` (`src/index.ts`) | Bundled into one Vercel Node function (`api.func`) by `vercel-build.mjs` |

Routing glue already in the repo:

- `vercel.json` (root) sets the build command (`node vercel-build.mjs`). The Build Output API output is written by `vercel-build.mjs` itself:
  - `static/` = the built Vite SPA (`dist/`).
  - `functions/api.func/` = the API, fully esbuild-bundled into `index.js` (CJS, no external deps) + `.vc-config.json`.
  - `config.json` = `version: 3` routes: `/api/(.*)` → `/api`, then `{ "handle": "filesystem" }`, then `/(.*)` → `/index.html`. The filesystem handler is required so `/assets/*` is served as files and not rewritten to HTML (this caused a blank-page/MIME error once).
- `admin/vercel.json` rewrites `/(.*)` → `/index.html` for the admin app's client-side routes (`/admin/*`, `/doctor/*`).

## Prerequisites

- Node >= 20, npm 10+.
- Vercel account + CLI (`npm i -g vercel`), logged in (`vercel login`).
- Supabase project (auth: email/password + Google) with Postgres.
- Razorpay account (test mode first) and Twilio account (WhatsApp/SMS).

## 1. Two Vercel projects

Create them by linking with the CLI:

```
vercel link
```

When Vercel's monorepo detection offers to create a project per workspace, create **two** projects and set their root directories explicitly:

### Project A — patient + API
- Root directory: `.` (repo root)
- Framework preset: **Vite**
- Build command: `node vercel-build.mjs`
- Output directory: (blank — the build writes `.vercel/output` itself)
- Do **not** use an `api/` folder — Vercel treats every file under `api/` as a separate serverless function (Hobby plan caps at 12). The server lives in `server/`; `vercel-build.mjs` bundles it into the single `api.func`.

### Project B — admin
- Root directory: `admin`
- Framework preset: **Vite**
- Build command: `npm run build` (default)
- Output directory: `dist`

## 2. Environment variables

Same values across both projects, except where noted. Table from `.env.example`:

| Variable | Project A | Project B | Notes |
|---|---|---|---|
| `VITE_SUPABASE_URL` | ✓ | ✓ | Public, baked into the client at build time |
| `VITE_SUPABASE_ANON_KEY` | ✓ | ✓ | Public |
| `SUPABASE_URL` | ✓ | | API only |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | | Server-only — never expose in client env |
| `DATABASE_URL` | ✓ | | Postgres connection string — must be IPv4-reachable (Vercel functions are IPv4-only). See DB note below |
| `JWT_SECRET` | ✓ | | Long random string |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | ✓ | | Test mode first |
| `RAZORPAY_WEBHOOK_SECRET` | ✓ | | For webhook signature verification |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WHATSAPP_FROM` / `TWILIO_FROM_NUMBER` | ✓ | | SMS/WhatsApp |
| `APP_URL` | ✓ | | Public base URL of Project A |

Set these in Vercel (Dashboard → project → Settings → Environment Variables) for **Production**. The API reads them from `process.env`; the Vite apps read the `VITE_` ones at build time.

## 3. Database

```
npm run db:migrate      # runs drizzle migrations against DATABASE_URL
npm run db:seed-supabase  # seeds categories, symptoms, doctors + admin account
```

Seed admin login: `admin@physio.example` / `physio123`. Seed doctors use password `physio123`.

> `npm run db:migrate` resolves `DATABASE_URL` from the repo-root `.env` locally. On Vercel, run migrations from a local machine pointed at the production DB (or a Neon migration run) rather than a serverless instance — migrations must run once, not per-function.

> **Vercel needs the shared pooler (Supavisor), not the direct host.** The direct host `db.<ref>.supabase.co` is IPv6-only (no A record) and Vercel functions are IPv4-only → `getaddrinfo ENOTFOUND`. Use the shared pooler transaction mode, which is IPv4 on every tier:
> `postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?sslmode=no-verify`
> - The project's region must be the pooler region that actually hosts the tenant (ours is `ap-northeast-2`; a wrong region replies "tenant not found" — probe `select count(*) from doctors` per region to find it).
> - `sslmode=no-verify` because the pooler's TLS chain isn't in Vercel's CA bundle (`SELF_SIGNED_CERT_IN_CHAIN` otherwise). Traffic is still TLS-encrypted.
> - The bundle inlines `pg`, so the connection string is read at runtime from the Vercel env var, not baked into the function.

## 4. Deploy

Preview (safe first):

```
vercel --yes
```

Production:

```
vercel --prod
```

For the admin project, run the same from `admin/`:

```
cd admin && vercel --prod
```

## 5. Smoke test (end-to-end)

On the production patient URL:

1. Register a patient → verify login works.
2. Search a doctor → open profile.
3. Book an appointment → pay with a Razorpay **test card** (e.g. `4111 1111 1111 1111`, any future expiry, any CVV) → confirm the confetti/paid state.
4. Check the appointment appears in the patient dashboard with `payment_status = paid`.
5. Log in as admin (`admin@physio.example`) → Appointments shows the booking; Insights shows the revenue.
6. Log in as a seed doctor → the appointment appears in their list.

If Twilio is configured, a confirmation WhatsApp/SMS fires on payment.

## 6. Notes & gotchas

- **`server/src/config.ts` and `server/src/db/pool.ts`** guard `import.meta.url` (`typeof import.meta.url === 'string'`), because the CJS esbuild bundle turns it into `undefined` and `fileURLToPath(undefined)` would throw at module load.
- `vercel-build.mjs` runs `npm run build -w src` (SPA) + esbuild `server/index.ts` → `functions/api.func/index.js` (CJS, fully bundled, no external packages) and writes `config.json` + `.vc-config.json`. It must be run with `node` (it's ESM) from the repo root on the build machine.
- The root `package.json` `build` script builds all three workspaces — used by CI/local; Vercel (Project A) uses `node vercel-build.mjs`.
- `vercel.json` root rewrite `/(.*) → /index.html` must stay; the SPA routes client-side. Do not add trailing-slash redirects that break `/api/*`.
- Cold starts: the `pg` pool is created lazily per function instance; keep `PG_POOL_MAX` modest (Neon free tier allows 10 concurrent connections).
