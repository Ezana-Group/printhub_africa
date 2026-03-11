# PrintHub — Complete deployment guide

Step-by-step guide to deploy PrintHub on **Vercel** with **Neon** (PostgreSQL), **Cloudflare R2** (file storage), **Resend** (email), **M-Pesa Daraja**, and **auth** (Google, Facebook, Apple, magic-link email). Includes database migrations and all required environment variables.

---

## 1. Deployment checklist (high level)

| Step | Service        | What you get / do |
|------|----------------|--------------------|
| 1    | **Vercel**     | Host the Next.js app, set env vars, connect domain |
| 2    | **Neon**       | PostgreSQL database → `DATABASE_URL`, `DIRECT_URL` |
| 3    | **Cloudflare R2** | File storage (uploads) → R2 credentials + bucket |
| 4    | **Resend**     | Transactional email → API key + verified domain |
| 5    | **M-Pesa Daraja** | STK Push payments → consumer key/secret, shortcode, passkey, callback URL |
| 6    | **Auth**          | Sign-in options: Google, Facebook, Apple (OAuth), magic-link email (Resend) |
| 7    | **Migrations** | Run `prisma migrate deploy` against production DB after first deploy |

Use **test.ovid.co.ke** for test; use **printhub.africa** (or your domain) for production. Set `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` to the deployed URL for each environment.

---

## 2. Vercel (app hosting)

### 2.1 Create project and connect repo

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub recommended).
2. **Add New** → **Project** → import your Git repository (e.g. `Ezana-Group/printhub_africa`).
3. **Framework Preset:** Next.js (auto-detected).
4. **Root Directory:** leave default (project root).
5. **Build Command:** leave default (`npm run build` — runs `prisma generate` + `next build`).
6. **Output Directory:** leave default.
7. **Install Command:** `npm install`.

Do **not** set a custom build command that runs `prisma migrate deploy`; the build runs without a database. Migrations are run separately (see §7).

### 2.2 Environment variables (Vercel)

Add all variables in **Project → Settings → Environment Variables**. Use **Production**, **Preview**, and **Development** as needed (e.g. Production = printhub.africa, Preview = test.ovid.co.ke).

You will fill these as you complete Neon, R2, Resend, M-Pesa, and Google below. Required for a working deploy:

- `NEXT_PUBLIC_APP_URL` — e.g. `https://test.ovid.co.ke` or `https://printhub.africa`
- `NEXTAUTH_URL` — same as `NEXT_PUBLIC_APP_URL`
- `NEXTAUTH_SECRET` — generate: `openssl rand -base64 32`
- `DATABASE_URL` — from Neon (pooled)
- `DIRECT_URL` — from Neon (direct connection)

Optional but recommended for full features:

- R2_* (or AWS_*) for uploads
- RESEND_API_KEY, FROM_EMAIL for email
- MPESA_* for M-Pesa
- GOOGLE_*, FACEBOOK_*, APPLE_* for OAuth; magic link uses Resend (no extra env)

### 2.3 Domain

- **Domains:** Project → Settings → Domains → Add (e.g. `test.ovid.co.ke` or `printhub.africa`).
- Add the CNAME (or A) record at your DNS provider as shown by Vercel.
- For test.ovid.co.ke, use the value Vercel gives (e.g. `cname.vercel-dns.com`).

Redeploy after adding env vars or domain so the build uses the correct values.

---

## 3. Neon (PostgreSQL database)

### 3.1 Create database

1. Go to [neon.tech](https://neon.tech) and sign in.
2. **New Project** — name (e.g. `printhub-test` or `printhub-prod`), region (choose closest to your app/users), Postgres version (e.g. 16).
3. Create project; Neon creates a default database and user.

### 3.2 Get connection strings

1. In the project dashboard, open **Connection Details** (or **Dashboard** → your branch).
2. You will see two URLs:
   - **Pooled (transaction mode)** — use for `DATABASE_URL` (serverless-friendly).
   - **Direct** — use for `DIRECT_URL` (migrations, Prisma introspection).

Example format:

- Pooled: `postgresql://user:password@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`
- Direct: `postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

Copy the pooled URL into **Vercel** as `DATABASE_URL` and the direct URL as `DIRECT_URL`. Use the same for `prisma.config.ts` when running migrations locally (via `.env`).

### 3.3 Optional: separate DBs for test vs prod

- Create two Neon projects (e.g. `printhub-test`, `printhub-prod`).
- In Vercel, use different env values per environment: Production → prod Neon URLs; Preview (or a “Test” env) → test Neon URLs.

---

## 4. Cloudflare R2 (file storage)

PrintHub uses S3-compatible storage; R2 is used via the same env pattern (and optional AWS_* fallbacks).

### 4.1 Create R2 bucket and API token

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **R2 Object Storage**.
2. **Create bucket** — e.g. `printhub-uploads` (private uploads) and optionally `printhub-public` (public read).
3. **Manage R2 API Tokens** → **Create API token**:
   - Name: e.g. `printhub-vercel`
   - Permissions: Object Read & Write (for the bucket(s) you use).
   - Copy **Access Key ID** and **Secret Access Key** (shown once).

### 4.2 Get R2 endpoint and public URL

- **Endpoint (S3 API):** In the bucket or account R2 overview, use the S3 API endpoint, e.g.  
  `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- **Public URL:** If you enable public access (e.g. via R2 custom domain or Workers), set that as the base URL for reading files.  
  Example: `https://pub-xxx.r2.dev` or a custom domain like `https://uploads.printhub.africa`.

### 4.3 Env vars for Vercel

| Variable           | Example / note |
|--------------------|----------------|
| `R2_ENDPOINT`      | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | From API token |
| `R2_SECRET_ACCESS_KEY` | From API token |
| `R2_UPLOADS_BUCKET` | `printhub-uploads` |
| `R2_PUBLIC_URL`    | Base URL for public file links (e.g. `https://pub-xxx.r2.dev` or custom domain) |

If you use a second bucket for public assets, you can set `R2_PUBLIC_BUCKET`; the app uses `R2_PUBLIC_URL` for building public URLs. Without R2 (or AWS) configured, upload endpoints will return empty or fail gracefully depending on code.

---

## 5. Resend (email)

### 5.1 API key and domain

1. Go to [resend.com](https://resend.com) and sign in.
2. **API Keys** → **Create API Key** — name (e.g. `printhub-vercel`), copy the key (shown once).
3. **Domains** → **Add Domain** — e.g. `printhub.africa` (or a subdomain for test). Add the DNS records Resend shows (SPF, DKIM, etc.) at your DNS provider and verify.

### 5.2 Env vars for Vercel

| Variable      | Example / note |
|---------------|----------------|
| `RESEND_API_KEY` | From Resend dashboard |
| `FROM_EMAIL`  | Sender address, e.g. `hello@printhub.africa` (must be on verified domain) |
| `FROM_NAME`   | e.g. `PrintHub` |

Optional: `CONTACT_EMAIL` for contact form; app falls back to `FROM_EMAIL`.

---

## 6. M-Pesa (Daraja API)

### 6.1 Sandbox (testing)

1. Go to [developer.safaricom.co.ke](https://developer.safaricom.co.ke).
2. Create an account, go to **My Apps** → create an app (e.g. “PrintHub Sandbox”).
3. Get **Consumer Key** and **Consumer Secret**.
4. Use **Sandbox** credentials:
   - **Shortcode:** often `174379` (test till number).
   - **Passkey:** from the sandbox app / test credentials page (Lipa Na M-Pesa Online).

Callback URL must be a **public HTTPS** URL that M-Pesa can reach:

- `https://test.ovid.co.ke/api/payments/mpesa/callback` (or your real callback route path).

Register this URL in the Daraja portal if required (sandbox may allow any URL; production requires whitelisting).

### 6.2 Production

1. Apply for production access with Safaricom if needed.
2. Create a production app and get production Consumer Key and Consumer Secret.
3. Use your **paybill or till number** as `MPESA_SHORTCODE` and the matching **Lipa Na M-Pesa Online passkey**.
4. Set callback to your production domain, e.g. `https://printhub.africa/api/payments/mpesa/callback`.

### 6.3 Env vars for Vercel

| Variable             | Sandbox example | Production |
|----------------------|-----------------|------------|
| `MPESA_CONSUMER_KEY` | From sandbox app | From prod app |
| `MPESA_CONSUMER_SECRET` | From sandbox app | From prod app |
| `MPESA_SHORTCODE`    | `174379` (sandbox till) | Your paybill/till |
| `MPESA_PASSKEY`      | Sandbox passkey | Production passkey |
| `MPESA_CALLBACK_URL` | `https://test.ovid.co.ke/api/payments/mpesa/callback` | `https://printhub.africa/api/payments/mpesa/callback` |
| `MPESA_ENV`          | `sandbox` | `production` |

---

## 7. Auth (sign-in / sign-up)

PrintHub supports **email + password**, **Google**, **Facebook**, **Apple**, and **magic-link email** (no password). Buttons for each provider appear on login/register only when the matching `NEXT_PUBLIC_*` env var is set. NextAuth callback URLs must match your app domain (e.g. `https://printhub.africa/api/auth/callback/google`).

### 7.1 Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create or select a project (e.g. “PrintHub”).
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**.
4. If prompted, configure **OAuth consent screen** (External for public users, add scopes email, profile, openid).
5. Application type: **Web application**.
6. **Authorized redirect URIs** — add:
   - `https://test.ovid.co.ke/api/auth/callback/google` (test)
   - `https://printhub.africa/api/auth/callback/google` (production)
   - `http://localhost:3000/api/auth/callback/google` (local)
7. Copy **Client ID** and **Client Secret**.

**Env vars:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (same as Client ID; used to show the "Google" button).

### 7.2 Facebook Login

1. Go to [developers.facebook.com](https://developers.facebook.com) → **My Apps** → create or select an app.
2. **Add Product** → **Facebook Login** → **Settings**.
3. **Valid OAuth Redirect URIs** — add:
   - `https://test.ovid.co.ke/api/auth/callback/facebook`
   - `https://printhub.africa/api/auth/callback/facebook`
   - `http://localhost:3000/api/auth/callback/facebook`
4. **App Review** — request `email` and `public_profile` if needed (basic login often allowed without review).
5. Copy **App ID** and **App Secret** (Settings → Basic).

**Env vars:** `FACEBOOK_CLIENT_ID` (App ID), `FACEBOOK_CLIENT_SECRET` (App Secret), `NEXT_PUBLIC_FACEBOOK_APP_ID` (same as App ID; used to show the "Facebook" button).

### 7.3 Apple Sign In

1. Go to [developer.apple.com](https://developer.apple.com) → **Certificates, Identifiers & Profiles**.
2. **Identifiers** → create a **Services ID** (e.g. `com.printhub.africa.auth`) — this is your `APPLE_CLIENT_ID`. Enable **Sign In with Apple**, configure domains and redirect URL (e.g. `https://printhub.africa/api/auth/callback/apple`).
3. **Keys** → create a key, enable **Sign In with Apple**, link to your App ID. Download the `.p8` key (once only). Note **Key ID** and **Team ID** and **Client ID** (Services ID).
4. Generate a **client secret JWT** (Apple expects a JWT as the "secret", not a static string). Use a script or a library (e.g. [apple-signin-auth](https://www.npmjs.com/package/apple-signin-auth)) with your Team ID, Key ID, Client ID (Services ID), and the `.p8` private key. The JWT typically expires in 6 months; regenerate and update `APPLE_CLIENT_SECRET` when it expires.

**Env vars:** `APPLE_CLIENT_ID` (Services ID), `APPLE_CLIENT_SECRET` (the JWT), `NEXT_PUBLIC_APPLE_CLIENT_ID` (same; used to show the "Apple" button).

### 7.4 Magic link (email sign-in)

Users can request a "Sign in to PrintHub" link sent to their email (no password). The app uses **Resend** to send the email; no extra env vars are required beyond `RESEND_API_KEY` and `FROM_EMAIL` (see §5). The "Email me a sign-in link" option is always shown on the login page. If Resend is not configured, the send will no-op (with a console warning).

---

## 8. Database migrations

The Vercel build does **not** run migrations (no DB at build time). Run them after deploy.

### 8.1 When to run

- **First deploy:** Run once after the first successful Vercel deploy and after Neon DB is created.
- **After schema changes:** Run after every deploy that includes new Prisma migrations (new files under `prisma/migrations/`).

### 8.2 How to run

**Option A — From your machine (recommended for one-off or manual):**

```bash
# Use the same DATABASE_URL and DIRECT_URL as in Vercel (e.g. from Neon).
# Set them in .env or pass inline:
export DATABASE_URL="postgresql://..."   # Neon pooled or direct
export DIRECT_URL="postgresql://..."     # Neon direct (for migrations)
npx prisma migrate deploy
```

Use the **production** Neon URLs when targeting production DB; use **test** Neon URLs for test.ovid.co.ke.

**Option B — From CI / deploy hook:**

In your CI (e.g. GitHub Actions) or a post-deploy script:

1. Have `DATABASE_URL` and `DIRECT_URL` available (e.g. from secrets).
2. Run: `npx prisma migrate deploy` (after `npm ci` so Prisma CLI is available).

`prisma.config.ts` in the repo reads `DATABASE_URL` (and optionally `DIRECT_URL`); ensure the env is loaded (e.g. `dotenv/config` or shell `export`) when running the CLI.

### 8.3 Seeding (optional)

To seed categories, products, and an admin user (e.g. for a fresh test DB):

```bash
export DATABASE_URL="postgresql://..."
npx prisma db seed
```

Uses `tsx prisma/seed.ts` (see `package.json`). Do **not** run seed in production if it would overwrite real data; use a separate test DB for that.

### 8.4 Clearing the production database

To wipe all data (or do a full schema reset), see **[scripts/db-clear-production.md](../scripts/db-clear-production.md)**. Summary:

- **Option A — Truncate all tables:** Keeps schema, deletes all rows. Run `DATABASE_URL="..." npx tsx scripts/db-truncate-all.ts`. Back up first.
- **Option B — Full reset:** Drop `public` schema, then `npx prisma migrate deploy` (and optionally seed). Use the **direct** connection URL for the drop step.

---

## 9. Environment variables summary

Use this as a single checklist. Add every variable you need to **Vercel → Settings → Environment Variables** (and optionally in `.env` for local runs).

### Required for minimal deploy (app + auth + DB)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Public app URL | `https://test.ovid.co.ke` or `https://printhub.africa` |
| `NEXTAUTH_URL` | Same as app URL (NextAuth base) | Same as above |
| `NEXTAUTH_SECRET` | Session encryption | `openssl rand -base64 32` |
| `DATABASE_URL` | Postgres (pooled for serverless) | Neon pooled URL |
| `DIRECT_URL` | Postgres direct (migrations) | Neon direct URL |

### File storage (Cloudflare R2)

| Variable | Description |
|----------|-------------|
| `R2_ENDPOINT` | R2 S3 API endpoint |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_UPLOADS_BUCKET` | Bucket name for uploads |
| `R2_PUBLIC_URL` | Base URL for public file links |

### Email (Resend)

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key |
| `FROM_EMAIL` | Sender (e.g. `hello@printhub.africa`) |
| `FROM_NAME` | Sender name (e.g. `PrintHub`) |

### M-Pesa (Daraja)

| Variable | Description |
|----------|-------------|
| `MPESA_CONSUMER_KEY` | Daraja app consumer key |
| `MPESA_CONSUMER_SECRET` | Daraja app consumer secret |
| `MPESA_SHORTCODE` | Till/paybill number |
| `MPESA_PASSKEY` | Lipa Na M-Pesa Online passkey |
| `MPESA_CALLBACK_URL` | Full URL to your callback route |
| `MPESA_ENV` | `sandbox` or `production` |

### Auth (OAuth + magic link)

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Same as Client ID (shows "Google" button) |
| `FACEBOOK_CLIENT_ID` | Facebook App ID |
| `FACEBOOK_CLIENT_SECRET` | Facebook App Secret |
| `NEXT_PUBLIC_FACEBOOK_APP_ID` | Same as App ID (shows "Facebook" button) |
| `APPLE_CLIENT_ID` | Apple Services ID |
| `APPLE_CLIENT_SECRET` | Apple client secret JWT (regenerate ~6 months) |
| `NEXT_PUBLIC_APPLE_CLIENT_ID` | Same (shows "Apple" button) |

Magic link uses Resend (§5); no extra vars. Set only the providers you use.

### Optional (see .env.example)

- **Pesapal:** `PESAPAL_*`
- **Flutterwave:** `FLUTTERWAVE_*`
- **Stripe:** `STRIPE_*`, `NEXT_PUBLIC_STRIPE_*`
- **Africa's Talking (SMS):** `AT_*`
- **Analytics:** `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- **Sentry:** `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`
- **Admin:** `ADMIN_EMAIL`, `CRON_SECRET`

---

## 10. Recommended order of operations

1. **Neon** — Create project, copy `DATABASE_URL` and `DIRECT_URL`.
2. **Vercel** — Import repo, add **required** env vars (app URL, NextAuth, DB). Deploy once (build should succeed).
3. **Migrations** — Run `prisma migrate deploy` against the Neon DB (from local or CI).
4. **Optional seed** — Run `prisma db seed` on test DB if needed.
5. **Resend** — Verify domain, create API key, add `RESEND_*` and `FROM_*` to Vercel; redeploy.
6. **R2** — Create bucket and API token, add `R2_*` to Vercel; redeploy.
7. **Auth** — Google: create OAuth client, add redirect URIs, add `GOOGLE_*` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. Optional: Facebook (`FACEBOOK_*`, `NEXT_PUBLIC_FACEBOOK_APP_ID`), Apple (`APPLE_*`, `NEXT_PUBLIC_APPLE_CLIENT_ID`). Magic link works automatically if Resend is configured. Redeploy.
8. **M-Pesa** — Create Daraja app (sandbox first), set callback URL, add `MPESA_*` to Vercel; redeploy.
9. **Domain** — Add domain in Vercel and DNS; ensure `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` match; redeploy.

After that, test login (email + password, Google/Facebook/Apple if configured, magic link), file upload, M-Pesa flow, and email (e.g. quote received, verification).

---

## 11. Troubleshooting

- **Build fails with Prisma “url/directUrl” error:** Schema must not contain `url`/`directUrl`; they live in `prisma.config.ts`. See README and Prisma 7 upgrade notes.
- **Invalid URL at build:** Set `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` in Vercel (and optionally in Build env) so they are non-empty (e.g. `https://test.ovid.co.ke`).
- **M-Pesa callback not hit:** Ensure `MPESA_CALLBACK_URL` is exact, HTTPS, and reachable from the internet; check Vercel function logs for the callback route.
- **OAuth redirect mismatch:** Redirect URI in the provider (Google, Facebook, Apple) must match exactly (e.g. `https://yourdomain.com/api/auth/callback/google`). `NEXTAUTH_URL` must match the app domain.
- **DB connection errors in production:** Use pooled `DATABASE_URL` for runtime; use `DIRECT_URL` only for migrations. Ensure Neon IP allowlist (if any) allows Vercel.
- **Emails not sending:** Check Resend domain verification and that `FROM_EMAIL` is on that domain; check Vercel logs for Resend errors.

For more on local setup and scripts, see the main [README](../README.md) and [.env.example](../.env.example).
