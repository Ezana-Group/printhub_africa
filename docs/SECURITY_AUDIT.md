# PrintHub Africa — Production Security Audit

**Date:** March 2025  
**Scope:** Full-stack Next.js app (auth, API routes, uploads, payments, admin, cron).

---

## Executive summary

The application has solid foundations: NextAuth (JWT + credentials + OAuth), Prisma (no raw SQL in API routes), Zod validation on many endpoints, security headers (HSTS, X-Frame-Options, CSP), and Origin checks for API mutations. All **actionable** audit items have been **fixed** in code; see Section 6 for the full list of changes.

| Severity | Count | Status |
|----------|--------|--------|
| Critical | 0 | — |
| High     | 2 | Both fixed (Next.js upgraded; unsubscribe fixed earlier) |
| Medium   | 5 | 4 fixed (STK/B2C whitelist, rate limit Redis), 1 note (PesaPal) |
| Low      | 4 | Recommendations |

---

## 1. Critical & high findings

### 1.1 [FIXED] Unsubscribe token used weak secret fallback

- **Location:** `app/api/unsubscribe/abandoned-cart/route.ts`
- **Issue:** Token was computed as `HMAC-SHA256(CRON_SECRET ?? "abandoned-cart-unsubscribe", email)`. If `CRON_SECRET` was unset, the secret was predictable and anyone could forge unsubscribe links.
- **Fix applied:** Removed fallback. If `CRON_SECRET` is not set, the handler redirects with `error=server` and does not verify tokens. Ensure **CRON_SECRET** is set in all environments (and used for cron routes and unsubscribe).

---

### 1.2 [FIXED] Next.js vulnerabilities (DoS)

- **Finding:** `npm audit` reported **high** and **moderate** issues in `next` (GHSA-h25m-26qc-wcjf, GHSA-9g9p-9gw9-jx7f).
- **Fix applied:** Next.js upgraded to **15.5.12** (patched). Run `npm audit` to confirm 0 vulnerabilities.

---

## 2. Medium findings

### 2.1 [FIXED] Upload confirm had no ownership check

- **Location:** `app/api/upload/confirm/route.ts`
- **Issue:** `POST /api/upload/confirm` did not verify session. Anyone with a valid `uploadId` + `storageKey` (e.g. from a leaked presign response) could confirm an upload. Presign is session-gated, so risk was limited but present.
- **Fix applied:** When the upload record has `userId`, the handler now requires a session and verifies `file.userId === session.user.id`. Guest uploads (`userId` null) remain unauthenticated so the guest flow still works.

---

### 2.2 [FIXED] M-Pesa STK callback IP whitelist

- **Location:** `app/api/payments/mpesa/callback/route.ts`, `lib/mpesa-callback.ts`
- **Issue:** `MPESA_CALLBACK_IP_WHITELIST` was optional; when empty, all IPs were allowed.
- **Fix applied:** When `MPESA_ENV=production`, the callback now **requires** `MPESA_CALLBACK_IP_WHITELIST` to be set and non-empty; otherwise it returns 503. Sandbox (non-production) still allows all IPs when whitelist is empty. Set **MPESA_CALLBACK_IP_WHITELIST** in production to Safaricom’s callback IP(s).

---

### 2.3 [FIXED] M-Pesa B2C callback

- **Location:** `app/api/payments/mpesa/b2c-callback/route.ts`, `lib/mpesa-callback.ts`
- **Issue:** No IP verification.
- **Fix applied:** B2C callback now uses the same IP check as STK: shared helper `getMpesaCallbackIpCheck(req, { useB2CWhitelist: true })`. Uses `MPESA_B2C_CALLBACK_IP_WHITELIST` if set, otherwise `MPESA_CALLBACK_IP_WHITELIST`. In production, at least one must be set.

---

### 2.4 [NOTE] PesaPal IPN

- **Location:** `app/api/payments/pesapal/callback/route.ts`
- **Issue:** No signature or IP verification. PesaPal does not provide signed IPN or stable IPs (their docs state IP may change; recommend domain allowlist if needed).
- **Status:** Verification is done by fetching transaction status from PesaPal API after receiving the IPN. No code change; ensure `PESAPAL_IPN_URL` is registered in PesaPal and use HTTPS.

---

### 2.5 [FIXED] Rate limiting is in-memory

- **Location:** `lib/rate-limit.ts` (used by contact, register, forgot-password, quote, M-Pesa STK push).
- **Issue:** In-memory store does not share state across multiple instances.
- **Fix applied:** Optional **Redis** support added via **Upstash**. When `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set, rate limiting uses Redis (shared across instances). Otherwise falls back to in-memory. Set these env vars in production for multi-instance deployments.

---

## 3. Lower-priority recommendations

### 3.1 Content-Security-Policy

- **Location:** `next.config.mjs` → `headers()` → CSP.
- **Current:** `script-src` includes `'unsafe-inline'` and `'unsafe-eval'`.
- **Recommendation:** Tighten when possible (e.g. nonces or hashes for scripts) to reduce XSS impact.

### 3.2 Cron secret

- **Location:** `app/api/cron/abandoned-carts/route.ts`
- **Current:** Protected by `CRON_SECRET` (Bearer or `x-cron-secret`). No fallback.
- **Recommendation:** Ensure **CRON_SECRET** is strong and set in production; same secret is used for unsubscribe links (see 1.1).

### 3.3 Danger zone (admin)

- **Location:** `app/api/admin/settings/danger/*`
- **Status:** All danger routes use `requireRole(req, "SUPER_ADMIN")` and `validateDanger(...)` (phrase + password, optional 2FA). No change required; keep phrase and 2FA for destructive actions.

### 3.4 Raw SQL in scripts

- **Location:** `scripts/db-truncate-all.ts` uses `$queryRawUnsafe` with table names from the DB.
- **Recommendation:** Keep this script out of API paths and run only in controlled environments with a safe `DATABASE_URL`.

---

## 4. What was audited (summary)

| Area | Finding |
|------|---------|
| **Auth** | NextAuth JWT, credentials (bcrypt, lockout), OAuth optional. Session and role used consistently. |
| **Admin** | `requireAdminApi` / `requireRole` and section-based SUPER_ADMIN for danger. |
| **API** | 235+ routes; mutations protected by Origin check in middleware; auth per route. |
| **DB** | Prisma only; no raw SQL in API routes; health check uses parameterized `$queryRaw`. |
| **Secrets** | Read from `process.env`; no hardcoded secrets. |
| **Upload** | Presign session/role-gated; confirm now enforces ownership when `userId` set; download checks owner/quote/admin. |
| **Payments** | M-Pesa STK has IP whitelist (must be set in prod); B2C and PesaPal need verification if supported. |
| **Headers** | HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, CSP. |
| **Validation** | Zod used on contact, quote, auth, upload presign, careers, corporate, checkout, orders, admin. |

---

## 5. Production checklist

Before going live, confirm:

- [ ] **NEXTAUTH_SECRET** is set and strong (e.g. `openssl rand -base64 32`).
- [ ] **CRON_SECRET** is set (cron + abandoned-cart unsubscribe); no fallback.
- [ ] **MPESA_CALLBACK_IP_WHITELIST** is set to Safaricom production callback IP(s) (required when `MPESA_ENV=production`; callback returns 503 if missing).
- [ ] **DATABASE_URL** uses TLS and is not logged or exposed.
- [ ] All payment provider keys (M-Pesa, PesaPal, Flutterwave, Stripe) are production keys and webhook URLs use HTTPS.
- [ ] Next.js is 15.5.10+ (upgraded to 15.5.12 in this audit).
- [ ] Rate limiting: for multiple instances, set **UPSTASH_REDIS_REST_URL** and **UPSTASH_REDIS_REST_TOKEN** for shared Redis rate limits.
- [ ] `.env.example` / `.env.local.example` do not contain real secrets; production secrets only in secure env/config.

---

## 6. Files changed in this audit

**Initial audit (earlier):**
1. **app/api/unsubscribe/abandoned-cart/route.ts** — Removed default secret; require `CRON_SECRET` for unsubscribe.
2. **app/api/upload/confirm/route.ts** — Require session and ownership when `file.userId` is set.

**Follow-up fixes (security audit remediation):**
3. **package.json** — Upgraded `next` to 15.5.12 (patched DoS advisories). Added `@upstash/ratelimit`, `@upstash/redis`.
4. **lib/mpesa-callback.ts** — New shared helper for M-Pesa callback IP check (production requires whitelist).
5. **app/api/payments/mpesa/callback/route.ts** — Use shared IP check; in production require `MPESA_CALLBACK_IP_WHITELIST`.
6. **app/api/payments/mpesa/b2c-callback/route.ts** — Add IP verification (same whitelist; optional `MPESA_B2C_CALLBACK_IP_WHITELIST`).
7. **lib/rate-limit.ts** — Optional Redis (Upstash) when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set; `rateLimit()` is now async.
8. **app/api/auth/register/route.ts**, **app/api/auth/forgot-password/route.ts**, **app/api/contact/route.ts**, **app/api/quote/route.ts**, **app/api/quote/submit/route.ts**, **app/api/payments/mpesa/stkpush/route.ts** — Await `rateLimit()`.
