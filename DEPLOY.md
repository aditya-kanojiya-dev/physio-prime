# Production deployment (Hostinger VPS + CloudPanel + Supabase)

What runs where:

| Piece            | Where                                      | Build                              |
| ---------------- | ------------------------------------------ | ---------------------------------- |
| Database (Postgres) | **Supabase** (managed, keeps backups & auth) | schema via Drizzle migrations    |
| Node API (`/api`)   | Hostinger VPS, PM2 (`physio-api`) on port 4000 | `server` via `tsx` (no compile) |
| Patient app (`/`)   | Hostinger VPS, Nginx static `dist/`        | `npm run build -w src`            |
| Admin app          | Hostinger VPS, Nginx static `admin/dist/`  | `npm run build -w admin`          |

One domain + one Nginx server block serves the patient app at the domain,
the admin app under a path (e.g. `/admin`), and proxies `/api` to the API.

---

## 0. Pre-flight (do once)

Create a **Supabase project**. Then build the production code once:

```bash
# from repo root
npm ci
npm run build        # server typecheck + patient dist/ + admin admin/dist/
```

> The Vite apps inline `VITE_*` vars **at build time** from the root `.env`. So the
> root `.env` on the server must contain the client keys **before** you run `npm run build`.
> See §2.

---

## 1. Database (Supabase) — the part you asked about

- **Connection string**: Supabase → Database → Connect → *Session/transaction pooler* port
  **6543** with `?pgbouncer=true` (recommended for pooled connections). Use this as `DATABASE_URL`.
- **Apply migrations**: `npm run db:migrate -w server` against `DATABASE_URL`.
  - On the VPS this runs automatically every time the API starts (see `server/src/main.ts`,
    wired into PM2). Safe to run repeatedly — Drizzle migrations are additive & idempotent.
  - Locally, `npm run db:migrate -w server` from the repo with `.env` set works identically.
- **Do NOT seed production**: `db:seed` and `db:seed-supabase` create demo doctors/patients
  with password `physio123` and provision Supabase auth accounts. Staging/dev DB only.
- **Schema changes** going forward: edit `server/src/db/schema.ts` →
  `npm run db:generate -w server` → commit the new `server/drizzle/00XX_*.sql` →
  the next deploy applies it automatically.
- **RLS/auth**: `SUPABASE_SERVICE_ROLE_KEY` is the server-only bypass key — never put it in
  a client bundle. The patient/admin apps use the **anon** key only.

## 2. Environment file (`.env` at repo root — is gitignored, create on the server)

```
# Server (API) — used at runtime
DATABASE_URL=postgresql://postgres.xxxx:password@xxxx.pooler.supabase.com:6543/postgres?pgbouncer=true
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=<long random string>
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...   # must match the webhook configured in Razorpay dashboard
TWILIO_ACCOUNT_SID=...        # optional
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=...
TWILIO_FROM_NUMBER=...
APP_URL=https://your-domain.com

# Client (Vite build-time — inlined into the bundles)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_RAZORPAY_KEY_ID=...
# VITE_API_URL defaults to /api/v1 (same-origin via Nginx) — only set if you proxy differently.
```

## 3. Server install (one-time)

```bash
sudo apt update
curl -sL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs
sudo npm install -g pm2
sudo apt-get install -y nginx   # (CloudPanel already provides nginx; use its UI instead if present)
```

Upload the repo to `/var/www/physio-prime` (rsync/git clone), then:

```bash
cd /var/www/physio-prime
npm ci
npm run build
# create/edit .env per §2 FIRST, then rebuild so VITE_* are inlined
pm2 start ecosystem.config.cjs
pm2 save
sudo env PATH=$PATH:$(which node) pm2 startup systemd   # enable on boot
```

Check: `pm2 logs physio-api` → should log "API listening on http://localhost:4000".

## 4. Nginx (CloudPanel UI or `/etc/nginx/sites-available/`)

Use a CloudPanel site for your domain (it wires Let's Encrypt + PHP-FPM + Nginx).
Replace the Vhost config so Nginx serves the static builds and proxies `/api`:

```nginx
root /var/www/physio-prime/dist;                       # patient app
index index.html;

# SPA fallback for the patient app
location / {
  try_files $uri $uri/ /index.html;
}

# Admin app under /admin
location /admin {
  alias /var/www/physio-prime/admin/dist;
  try_files $uri $uri/ /admin/index.html;
}

# Proxy API calls to the Node server
location /api/ {
  proxy_pass http://127.0.0.1:4000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

> Razorpay webhooks and live status are within `/api`, so the `/api/` proxy covers them.
> If the Razorpay webhook URL you configure uses a path under `/api/v1/razorpay/...`, it flows through here.

## 5. Deploy (a release)

```bash
cd /var/www/physio-prime
git pull            # or rsync
npm ci
npm run build       # rebuilds patient + admin with current .env VITE_* inlines
pm2 restart physio-api   # runs db:migrate on boot, picks up server changes
```

Toggling the API with `pm2 restart` applies any new `server/drizzle/*.sql` migrations
automatically — restarting the process is the deploy step for schema changes too.

## Troubleshooting

- **Tables missing** → migrations didn't run: `npm run db:migrate -w server` manually, then check `pm2 logs`.
- **API up but site 502** → Nginx can't reach 4000: confirm `pm2 status` shows `physio-api` online and the `proxy_pass` port matches `PORT`.
- **Payments fail / "Payment gateway not configured"** → `VITE_RAZORPAY_KEY_ID` missing at build time and/or `RAZORPAY_*` missing server-side; rebuild after fixing `.env`.
- **Auth 401s in prod but fine in dev** → confirm `JWT_SECRET` matches between the deployed `.env` and what signed the tokens, and `SUPABASE_SERVICE_ROLE_KEY` is present server-side.
