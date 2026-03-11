# Next Steps After Audit Fixes

Actionable steps to finish hardening and running PrintHub in production.

---

## 1. Fix build: Invalid URL during static generation

**What was wrong:** During `npm run build`, static page generation can run with env where `NEXT_PUBLIC_APP_URL` is missing or invalid, causing `TypeError: Invalid URL`.

**What was done:** `app/layout.tsx` now safely builds `metadataBase` and falls back to `https://printhub.africa` if the env value is invalid.

**What you should do:**

1. **Local/build env:** Ensure a valid URL is set when you build:
   - In `.env.local`: `NEXT_PUBLIC_APP_URL=http://localhost:3000` (or your real local URL).
   - No spaces or trailing slashes; must be a full URL (`http://` or `https://`).
2. **CI/CD (e.g. Vercel):** In the project’s Environment Variables, set `NEXT_PUBLIC_APP_URL` for the environment that runs the build (e.g. Production / Preview) to your deployed URL (e.g. `https://printhub.africa` or `https://test.ovid.co.ke`).
3. **Verify:** Run `npm run build` locally with that env set; the build should complete without the Invalid URL error.

---

## 2. Production rate limiting (Redis/Upstash)

**Current state:** Rate limiting is in-memory in `lib/rate-limit.ts`. It works per single instance; with multiple instances or serverless, limits are not shared.

**What you should do:**

1. **Choose a store:** Use [Upstash Redis](https://upstash.com) (or another Redis) so limits are shared across all instances.
2. **Install:**  
   `npm install @upstash/ratelimit @upstash/redis`
3. **Env:** Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from your Upstash dashboard.
4. **Implement:** In `lib/rate-limit.ts`, if those env vars are set, use `@upstash/ratelimit` with `Redis.fromEnv()`; otherwise keep the existing in-memory limiter for local dev.
5. **Optional:** Document in `docs/DEPLOYMENT.md` that production should use Upstash (or similar) for rate limiting.

---

## 3. M-Pesa callback IP whitelist (production)

**Current state:** The M-Pesa callback route supports optional validation via `MPESA_CALLBACK_IP_WHITELIST`. If not set, any IP can call the callback (fine for sandbox; unsafe for production).

**What you should do:**

1. **Go-live with Safaricom:** When moving to production M-Pesa, complete Safaricom’s go-live process and get the list of **callback source IPs** (they may give you one or more IPs or a range).
2. **Set env in production:** In your production environment (e.g. Vercel), add:
   ```bash
   MPESA_CALLBACK_IP_WHITELIST=1.2.3.4,5.6.7.8
   ```
   (Replace with the actual IPs from Safaricom; comma-separated, no spaces.)
3. **Redeploy** so the callback route uses the whitelist.
4. **Test:** Trigger a real (or test) STK callback and confirm the callback still succeeds from Safaricom’s IPs and is rejected from other IPs.

---

## 4. Handle email “not configured” in callers (optional)

**Current state:** When `RESEND_API_KEY` is missing, `sendEmail()` returns `{ success: false, error: "email_not_configured" }`. Most callers only `await sendEmail(...)` and don’t check the result.

**What you should do:**

1. **Critical paths:** In routes that must ensure the user gets an email (e.g. register verification, password reset), after `await sendVerificationEmail(...)` or `sendPasswordResetEmail(...)`, check the return value.
2. **If `success === false`:** Log the error and either:
   - Return a 503 with a message like “Email is temporarily unavailable,” or
   - In development, return a clear “Email not configured; set RESEND_API_KEY” message so you don’t think the email was sent.

---

## 5. Stub payment providers and features (from audit)

**Current state:** Stripe, Flutterwave, and Pesapal are stubbed (501). S3 uploads, Algolia search, and Sanity CMS are non-functional.

**What you should do (pick one path):**

- **Option A – Hide until implemented:** In the UI, hide or disable payment options and features that are not implemented (e.g. don’t show Stripe/Flutterwave/Pesapal at checkout; hide search or replace with a simple filter; don’t rely on Sanity content) so users don’t hit dead ends.
- **Option B – Implement:** Implement at least one extra payment provider and/or file upload (e.g. S3/R2) so you have a fallback and core upload flow.

---

## 6. Error monitoring (production)

**Current state:** No Sentry (or similar) is configured; production errors are not reported.

**What you should do:**

1. **Sign up:** Create a project at [sentry.io](https://sentry.io) (or use another error monitoring service).
2. **Install:**  
   `npm install @sentry/nextjs`
3. **Configure:** Add `SENTRY_DSN` to production env and run Sentry’s Next.js wizard (`npx @sentry/wizard@latest -i nextjs`) to create `sentry.client.config.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts` and to update `next.config.mjs`.
4. **Verify:** Deploy and trigger a test error; confirm it appears in the Sentry dashboard.

---

## 7. Security and hygiene (from audit)

- **CSRF:** For state-changing API routes that aren’t protected by NextAuth (e.g. contact, quote), consider adding CSRF tokens or same-site cookie checks if you’re not relying on SameSite cookies and strict origin checks already.
- **Template files:** Audit item #16: add the missing template files under `public/templates/` (e.g. `rollup-banner.ai`, `aframe.ai`, etc.) or remove/update the links on the large-format printing page so they don’t 404.
- **Repo cleanup:** Remove or ignore personal/unrelated files (e.g. `Coursera LNP82RAEFMBN.pdf`, `PrintHub_CursorAI_Prompt.md`) from the repo or add them to `.gitignore` so they aren’t committed.

---

## Quick reference

| Priority   | Action                                      | When / where              |
|-----------|---------------------------------------------|---------------------------|
| Required  | Set valid `NEXT_PUBLIC_APP_URL` for build   | Local + CI/CD             |
| Production| Add Upstash Redis for rate limiting         | Before scaling / multi-instance |
| Production| Set `MPESA_CALLBACK_IP_WHITELIST`           | When going live with M-Pesa |
| Recommended | Check email `success` in auth routes     | After deploying audit fixes |
| Recommended | Add Sentry (or similar)                   | Production                |
| When ready | Implement or hide stub payments/features   | Before promoting to users |
