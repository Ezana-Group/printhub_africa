# PrintHub Africa — Railway Setup Guide

> **Status**: Production. Vercel has been fully removed.
> All deployments run on [Railway](https://railway.app).

---

## Railway Project Structure

One Railway project contains **four services**:

| Service | Description | Source |
|---------|-------------|--------|
| `printhub-web` | Next.js app (this repo) | Dockerfile at repo root |
| `printhub-n8n` | n8n automation engine | `n8n/` subdirectory Dockerfile |
| `printhub-db` | PostgreSQL for Next.js | Railway Postgres plugin |
| `n8n-db` | PostgreSQL for n8n only | Railway Postgres plugin |

> **Note**: `printhub-db` and `n8n-db` are **isolated** — n8n cannot reach the app's database.

---

## DNS Configuration

All domains use a CNAME pointing to Railway. Set these in your DNS provider (Cloudflare recommended):

```
printhub.africa          CNAME  printhub-web.railway.app
admin.printhub.africa    CNAME  printhub-web.railway.app   ← same service, middleware routes it
n8n.printhub.africa      CNAME  printhub-n8n.railway.app
```

> Middleware in `middleware.ts` reads the `host` header and routes `admin.printhub.africa` to the admin
> layout automatically. No separate Railway service is needed for the admin subdomain.

---

## Deploy Process

1. **Push to `main`** branch on GitHub
2. Railway auto-detects the push and triggers a build
3. Docker builds the standalone Next.js app (multi-stage)
4. `start.sh` runs **automatically on every deploy**:
   - `prisma migrate deploy` — applies pending migrations
   - `tsx prisma/seed-production.ts` — idempotent seed (safe to re-run)
   - `node server.js` — starts Next.js
5. Railway hits `/api/health` — must return `200` before traffic switches
6. Zero-downtime swap: old container serves traffic until new one passes health check

---

## Database Migrations

Migrations run automatically via `start.sh` **before** the server starts. This means:

- ✅ Schema changes are applied before any requests are served
- ⚠️ If a migration fails, the container will fail to start and Railway will not swap traffic

### Manual migration (if needed)

**Option A — Railway CLI** (recommended):
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and link to project
railway login
railway link

# Run migration against production DB
railway run npx prisma migrate deploy
```

**Option B — One-off Railway service**:
1. Add a temporary Railway service
2. Set `startCommand = "npx prisma migrate deploy"`
3. It runs once and exits — then delete the service

> **Important**: Never run `prisma migrate reset` on production. Only `prisma migrate deploy`.

---

## Environment Variables

Set all variables in **Railway → Service → Variables** tab. Never commit secrets.

### Required for `printhub-web`

#### Core
```
NEXT_PUBLIC_APP_URL=https://printhub.africa
NEXT_PUBLIC_ADMIN_URL=https://admin.printhub.africa
NEXT_PUBLIC_ADMIN_DOMAIN=admin.printhub.africa
NEXT_PUBLIC_APP_DOMAIN=.printhub.africa
NEXTAUTH_URL=https://printhub.africa
NEXTAUTH_SECRET=        # openssl rand -hex 32
DATABASE_URL=           # Railway Postgres "Private URL"
DATABASE_URL_UNPOOLED=  # Same as DATABASE_URL for Railway Postgres
```

#### Automation
```
NEXT_PUBLIC_N8N_URL=https://n8n.printhub.africa
N8N_WEBHOOK_BASE_URL=https://n8n.printhub.africa/webhook
N8N_WEBHOOK_SECRET=     # openssl rand -hex 32 (MUST match n8n service var)
INTERNAL_SERVICE_SECRET=# openssl rand -hex 64
CRON_SECRET=            # openssl rand -hex 32   (used by n8n to call /api/cron/*)
```

> See `.env.local.example` for the complete list of all other variables (payments, email, R2, etc.).

### Auto-provided by Railway (do NOT set manually)
```
RAILWAY_PUBLIC_DOMAIN   # *.up.railway.app domain of this service
RAILWAY_ENVIRONMENT     # "production" or "staging"
PORT                    # 3000 (set in Dockerfile)
```

---

## Staging Environment

Railway supports multiple environments per project.

1. In Railway project: **New Environment → Staging**
2. All services are duplicated automatically
3. Override these variables in staging:
   ```
   NEXT_PUBLIC_APP_URL=https://staging.printhub.africa
   NEXTAUTH_URL=https://staging.printhub.africa
   DATABASE_URL=           # staging DB connection string
   DATABASE_URL_UNPOOLED=  # staging DB
   ```
4. Add DNS: `staging.printhub.africa CNAME staging-printhub-web.railway.app`

---

## Local Development

```bash
# Option A: Standard Next.js dev server (uses .env.local)
npm run dev

# Option B: Railway CLI dev (loads all Railway production-equivalent vars — recommended)
railway login
railway link
railway run npm run dev
```

### Local admin subdomain

The admin subdomain is detected from the `host` header. For local dev:
```
# In /etc/hosts (Mac/Linux):
127.0.0.1  admin.localhost
```
Then visit: `http://admin.localhost:3000`

---

## Health Check

Railway uses `/api/health` to determine if the container is healthy.

```bash
curl https://printhub.africa/api/health
# Expected: {"status":"ok","timestamp":"...","checks":{"db":{"status":"ok","latencyMs":12}}}

# Railway admin runtime info (admin only):
curl https://admin.printhub.africa/api/admin/system/railway-health \
  -H "Cookie: <admin-session-cookie>"
# Returns: {"environment":"production","domain":"printhub-web.up.railway.app",...}
```

---

## Vercel → Railway Migration Checklist

Follow this order to avoid any downtime:

- [ ] **1. Export all env vars** from Vercel: Settings → Environment Variables → Export
- [ ] **2. Add each env var** to Railway `printhub-web` service → Variables tab
- [ ] **3. Test Railway deploy** by visiting the `*.up.railway.app` URL directly (before DNS switch)
- [ ] **4. Verify health**: `curl https://<railway-url>.up.railway.app/api/health` returns `200`
- [ ] **5. Verify admin**: Visit `https://<railway-url>.up.railway.app/admin/dashboard` — should load
- [ ] **6. Verify n8n**: Visit `https://n8n.printhub.africa` — should load
- [ ] **7. Switch DNS**: Update CNAME records (expect 5–15 min propagation with Cloudflare)
- [ ] **8. Run migration**: `railway run npx prisma migrate deploy` (if not using start.sh)
- [ ] **9. Test checkout** end-to-end: product → cart → M-Pesa payment
- [ ] **10. Test n8n webhooks**: Publish a product → verify n8n workflow fires
- [ ] **11. Test admin**: Login at `https://admin.printhub.africa` → check dashboard widgets
- [ ] **12. Monitor** Railway logs for 30 minutes
- [ ] **13. Only then**: Remove the Vercel project from the dashboard

---

## Testing Checklist (Railway-specific)

| Test | Expected |
|------|----------|
| `GET /api/health` | `{"status":"ok","checks":{"db":{"status":"ok"}}}` + 200 |
| `GET /admin/dashboard` on `admin.printhub.africa` | Admin dashboard loads |
| `GET /` on `printhub.africa` | Storefront loads |
| POST to `/api/cron/abandoned-carts` with `Authorization: Bearer $CRON_SECRET` | 200 |
| n8n webhook call to `/api/n8n/*` with `x-printhub-signature` | 200 |
| M-Pesa STK push flow | Works (callback URL is `https://printhub.africa/api/payments/mpesa/callback`) |
| WhatsApp auto-reply (AI-1 workflow) | Claude responds within 30s |
| `/api/admin/system/railway-health` | Returns `environment: "production"` |

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Container fails to start | Migration failed | Check Railway logs → look for Prisma error; fix schema |
| `/api/health` returns 503 | DB connection failed | Check `DATABASE_URL` in Railway Variables |
| Admin subdomain shows storefront | Middleware not receiving host header | Check that Railway custom domain for `admin.*` is set |
| n8n webhooks get 401 | `N8N_WEBHOOK_SECRET` mismatch | Must be identical in both Railway services |
| Cron routes return 401 | `CRON_SECRET` not set or mismatch | Set in Railway Variables; n8n must send same value |
| Images not loading | `R2_PUBLIC_URL` wrong | Check R2 custom domain or pub-*.r2.dev URL |
