# Production deployment (Hostinger VPS + PM2 + Nginx)

Production is a **single Hostinger VPS**. Nginx serves the patient app and proxies
`/api` to a long-lived Node process under PM2. Database is Supabase.

> **Migration note.** The site is currently live on **Vercel** (canonical host
> `www.physio-prime.in`, whole Express app bundled as one serverless function at
> `/api`). This doc is the **target state** after cutover. During the migration,
> `server/index.ts` is the Vercel entry point and `server/src/main.ts` is the VPS one —
> both exist and are correct for their platform.

## What runs where

| Piece              | Where                                                  | Built by                       |
| ------------------ | ------------------------------------------------------ | ------------------------------ |
| Database (Postgres) | **Supabase** managed                                    | Drizzle migrations             |
| Node API (`/api/*`) | VPS, PM2 (`physio-api`) on `127.0.0.1:4000`            | esbuild → `server/dist`        |
| Patient app (`/`)   | VPS, Nginx static `dist/`                               | `npm run build -w src`         |
| Admin app           | VPS, Nginx static `admin/dist/` on `admin.` subdomain   | `npm run build -w admin`       |

One canonical host: **`https://www.physio-prime.in`**. The apex 308-redirects to it.

### The single most important decision

**Keep the hostname `www.physio-prime.in` and move only where it is served.**

If you reuse the same host, these all keep working with zero changes:

- `APP_URL` and the CORS allowlist (`server/src/lib/cors.ts`)
- `public/sitemap.xml` / `public/robots.txt`
- **The Razorpay webhook URL** — no dashboard edit, no risk of a missed payment
- The admin app, which hardcodes `https://www.physio-prime.in/api/v1` in
  `admin/src/lib/api.ts` for production builds

Giving the VPS a different hostname breaks all five at once. If you do change hosts,
you must update every one of them in the same sitting.

---

## 1. The Razorpay webhook (verify before and after cutover)

```
https://www.physio-prime.in/api/v1/razorpay/webhook
```

There is no separate API host — Nginx proxies `/api/` to PM2. **Razorpay does not
follow HTTP redirects when delivering webhooks**, so this must be the host that
serves the API directly, with no 30x in between.

> The webhook is the **only** path that marks an appointment `paid` and writes the
> commission ledger (`server/src/routes/razorpay.ts`). The browser `/verify` call
> marks the appointment `confirmed`, so if the webhook is dead a patient sees a
> successful booking while **no money is ever booked**. It fails silently.

The webhook secret is a separate field from the URL and must match
`RAZORPAY_WEBHOOK_SECRET` in `.env`. Check both in Razorpay → Settings → Webhooks.

Sanity check reachability with no real signature — **401 means the route is alive**:

```bash
curl -s -X POST https://www.physio-prime.in/api/v1/razorpay/webhook \
  -H 'Content-Type: application/json' -d '{"event":"payment.captured"}' \
  -w '\n[%{http_code}]\n'
# {"error":{"message":"Missing signature or body"}}  [401]
```

- `404` → Nginx is not proxying `/api/` to the API.
- `000` / connection error → TLS problem, i.e. the cert does not cover the host.

`server/src/index.ts` registers `express.raw()` for this path **before**
`express.json()` — do not reorder it. Signature verification needs the unparsed
bytes, and `server/src/lib/rate-limit.ts` exempts the path so Razorpay's retries
cannot be 429'd. Both are load-bearing.

---

## 2. DNS and SSL

1. **Lower the TTL on the `www` A record to 300** at least 24h before cutover, so
   the switchover propagates fast. Restore it to 3600 a day later.
2. Point `www` → your VPS IP. Also point the apex `physio-prime.in` at the VPS —
   you need it there to serve the redirect yourself, because Vercel's redirect
   disappears with the DNS.
3. Point `admin.physio-prime.in` → the same VPS IP (optional; see §6).
4. Issue certs covering **all** names you serve. The redirect host needs its own
   cert or the 301 is never reached — a client hits a TLS error first.

On the VPS, once DNS has propagated:

```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
sudo certbot certonly --webroot -w /var/www/html \
  -d physio-prime.in -d www.physio-prime.in
```

Add `-d admin.physio-prime.in` too if you are serving the admin app.

Confirm the cert covers the host you will actually use:

```bash
sudo certbot certificates
curl -sI https://www.physio-prime.in/ | head -1     # expect 200
curl -sI https://physio-prime.in/     | head -1     # expect 308 → www
```

---

## 3. Node and the app

```bash
curl -sL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs
sudo npm install -g pm2
```

Node ≥ 20 is required (the server bundle targets Node 20); 22 LTS is the safe pick.

```bash
sudo mkdir -p /var/www/physio-prime && cd /var/www/physio-prime
# git clone <your-repo> .   (or rsync/scp the working tree)
```

Create the root `.env` **before building** — the Vite apps inline `VITE_*` at build
time, so a missing client key is baked in as `undefined`.

```bash
npm ci
npm run build          # server + patient dist/ + admin dist/
```

`npm run build` at the root runs all three workspaces, so it is the only build you
need. `server/package.json` declares `"type": "module"` and its `prestart` re-runs
esbuild, so `npm run start` always runs a fresh bundle.

```bash
pm2 start ecosystem.config.cjs
pm2 save
sudo env PATH="$PATH:$(which node)" pm2 startup systemd   # survive reboot
```

`ecosystem.config.cjs` runs PM2 with `cwd: 'server'`, `PORT: 4000`, and
`TRUST_PROXY: 1`. That last one matters: it makes Express trust one hop of
`X-Forwarded-For` so the rate limiter sees real client IPs instead of `127.0.0.1`.
Without it every visitor shares one bucket and a busy afternoon 429s everyone.

`server/src/main.ts` applies pending migrations on boot, so `pm2 restart` is a
complete deploy for schema changes. It is idempotent. It also schedules the daily
reminder job and drains in-flight requests on `SIGINT`/`SIGTERM` — which is why you
restart via `pm2` rather than killing the process.

Check it before touching DNS:

```bash
pm2 logs physio-api        # expect: migrations applied, "API listening on http://localhost:4000"
curl -s localhost:4000/api/v1/health    # {"ok":true,"db":"ok","ts":"..."}
```

---

## 4. Nginx

```bash
sudo nano /etc/nginx/sites-available/physio
```

```nginx
# --- apex: 308 to canonical www ---
server {
    listen 80;
    listen [::]:80;
    server_name physio-prime.in;

    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 308 https://www.physio-prime.in$request_uri; }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name physio-prime.in;

    ssl_certificate     /etc/letsencrypt/live/physio-prime.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/physio-prime.in/privkey.pem;

    return 308 https://www.physio-prime.in$request_uri;
}

# --- canonical: patient app + API ---
server {
    listen 80;
    listen [::]:80;
    server_name www.physio-prime.in;

    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 301 https://www.physio-prime.in$request_uri; }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name www.physio-prime.in;

    ssl_certificate     /etc/letsencrypt/live/physio-prime.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/physio-prime.in/privkey.pem;

    root /var/www/physio-prime/dist;
    index index.html;
    client_max_body_size 2M;          # Razorpay webhook payloads are small

    # patient SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API -> PM2
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

`server_name` must appear in each block separately — it does **not** inherit. Getting
this wrong is the usual cause of a site that 404s on one hostname and works on the other.

```bash
sudo ln -sf /etc/nginx/sites-available/physio /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Verify the `/api/` proxy specifically, not just the homepage:

```bash
curl -s https://www.physio-prime.in/api/v1/health    # {"ok":true,"db":"ok",...}
```

---

## 5. Cutover and rollback

Do this **after** §2–§4 all pass locally on the VPS. Deploy first, cut over second.

```bash
# on the VPS, once: initial deploy per §3–§4, health check passing
```

Then, in order:

1. Repoint the `www` A record to the VPS IP.
2. `curl -sI https://www.physio-prime.in/ | head -1` → expect 200.
3. `curl -s https://www.physio-prime.in/api/v1/health` → expect `db:"ok"`.
4. POST the webhook test from §1 → expect 401.
5. Place one real ₹1 payment; confirm `payment.captured` in `pm2 logs physio-api`
   **and** a row in `payment_transactions`. Appointment `confirmed` with no ledger
   row means the webhook is not landing.
6. Log in as a patient and as an admin.

**Rollback: repoint the `www` A record back to Vercel.** Nothing else needs
reverting, because the hostname, app config, and webhook URL never changed. That
is the whole reason for keeping the same host — so **do not delete the Vercel
project** until the VPS has been stable for a few days.

Restore the DNS TTL to 3600 once you are satisfied.

---

## 6. Admin app

Two options, both zero-code:

- **Serve it from the VPS** at `admin.physio-prime.in` (below). Tidy, no Vercel
  project left to maintain.
- **Leave it on Vercel.** Also fine. Admin's production API base is the absolute
  `https://www.physio-prime.in/api/v1`, and CORS already allows
  `https://admin.physio-prime.in` (`server/src/lib/cors.ts`), so it keeps working
  unchanged while the patient app and API move.

If you serve it from the VPS, add the name to the certbot command in §2 and add a
third server block:

```nginx
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name admin.physio-prime.in;

    ssl_certificate     /etc/letsencrypt/live/physio-prime.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/physio-prime.in/privkey.pem;

    root /var/www/physio-prime/admin/dist;
    index index.html;

    location / { try_files $uri $uri/ /index.html; }

    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Note this is a **subdomain**, not a `/admin` path. The admin app is a separate SPA
with its own `index.html`; serving it under `/admin` would collide with the patient
app's SPA fallback, and would change its origin to `www`, invalidating the CORS
entry.

---

## 7. Environment

Root `.env` on the VPS (gitignored). `server/src/lib/load-env.ts` resolves it as
`../.env` from the `server` working directory, which is what PM2 uses.

**Runtime (API):**

```
DATABASE_URL=postgresql://…pooler.supabase.com:6543/postgres?pgbouncer=true
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=…
JWT_SECRET=<long random string>
APP_URL=https://www.physio-prime.in/     # canonical host, with www
RAZORPAY_KEY_ID=…
RAZORPAY_KEY_SECRET=…
RAZORPAY_WEBHOOK_SECRET=…                # must match the Razorpay dashboard
```

Optional, degrade gracefully when unset: `TWILIO_*`, `RESEND_*`, `SMARTPING_*`,
`DOCTOR_PANEL_URL`, `JAAS_*` (video consults 503 until configured).

**Build-time (inlined into the client bundles):**

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=…
VITE_RAZORPAY_KEY_ID=…
# VITE_API_URL is not needed for the patient app — it defaults to /api/v1,
# which Nginx proxies. Only set it if the API lives on another host.
```

`SUPABASE_SERVICE_ROLE_KEY` is the server-only bypass key. Never let it reach a
client bundle; the apps use the anon key only.

**Supabase dashboard** → Auth → URL Configuration → Redirect URLs must include
`https://www.physio-prime.in/**` and `https://admin.physio-prime.in/**`. The apex
308s and will fail the OAuth round-trip.

---

## 8. Deploying a release

```bash
cd /var/www/physio-prime
git pull
npm ci
npm run build       # rebuilds VITE_* inlines from the new .env
pm2 restart physio-api   # runs pending migrations, picks up server changes
pm2 save
```

Migrations apply automatically on restart via `server/src/main.ts`. They are
additive and idempotent, so a re-run is safe. To fail fast before traffic shifts,
run `npm run db:migrate -w server` by hand with `DATABASE_URL` pointed at
production and watch it succeed.

---

## Troubleshooting

- **Bookings succeed but no money is booked** → the webhook is not being delivered.
  Check the URL uses `www` with no redirect (§1), then check `pm2 logs physio-api`
  for `payment.captured`. Highest-impact silent failure in the system.
- **Everything 429s at once** → `TRUST_PROXY` is unset, so every request looks like
  it comes from `127.0.0.1` and they share one rate-limit bucket. It is set in
  `ecosystem.config.cjs`; confirm it survived your PM2 reload.
- **`relation "x" does not exist` right after a deploy** → the migration was not
  applied. Check `pm2 logs physio-api` for the migration output on boot.
- **502 on `/api/*`** → PM2 is not listening: `pm2 status`, then
  `curl localhost:4000/api/v1/health`. If that works, the `proxy_pass` port does
  not match `PORT`.
- **Site 404s on one hostname, works on the other** → `server_name` is wrong or
  missing in that block. It does not inherit between blocks.
- **Payments fail / "Payment gateway not configured"** → `RAZORPAY_*` missing in
  `.env`, or `VITE_RAZORPAY_KEY_ID` missing at build time. Rebuild after fixing a
  `VITE_*` value.
- **CORS error in the console** → the `Origin` is not allowlisted. Check `APP_URL`
  and `server/src/lib/cors.ts`; the admin app is a different origin and needs its
  own entry.
- **Auth 401s in prod but fine locally** → `JWT_SECRET` differs from the one that
  signed existing tokens, so every old session is invalid. Log users out rather
  than rotating the secret mid-day.
- **Admin login fails** → unrelated to patient auth: admin uses the Supabase
  password grant, which rejects unknown-email signups with a 400. Admin accounts
  must exist in Supabase Auth first.
