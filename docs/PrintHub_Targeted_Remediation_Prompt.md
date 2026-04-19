# PrintHub Africa — Targeted Security & Architecture Remediation Prompt

> **Instructions for the AI Agent:** You are performing a **targeted remediation audit** of the PrintHub Africa codebase (`Printhub_Africa_ProdV1`). Every issue below was identified from the system architecture document. For each item, you must: (1) locate the exact file(s) involved, (2) confirm whether the vulnerability exists in the code, (3) implement the fix, and (4) report what was changed. Do not skip any item. Work through them in order of severity.

---

## 🔴 CRITICAL — Fix Before Anything Else

---

### CRIT-1: Server-Side Order Price Recalculation

**File:** `app/api/orders/route.ts` (POST handler)

**Problem:** The cart lives in Zustand (client state). If `POST /api/orders` trusts `unitPrice`, `total`, or any price from the request body, a buyer can manipulate prices before submitting.

**Task:**
1. Open `app/api/orders/route.ts` and find the order creation logic.
2. Identify every price field being read from the request body (`unitPrice`, `subtotal`, `total`, `deliveryFee`, `discount`, `vatAmount`).
3. Remove all client-supplied price values from the order creation logic.
4. Replace with a server-side recalculation:
   - For each `productId`/`variantId` in the cart, fetch the current `basePrice` / `ProductVariant.price` from the database.
   - Recalculate: `subtotal = sum(dbPrice * quantity)`, `vatAmount = subtotal * vatRate`, `deliveryFee` from `ShippingSettings`, `discount` from validated coupon in DB.
   - Use these server-computed values to create the `Order` record.
5. Confirm the same recalculation is applied in `app/api/admin/orders/create/route.ts`.
6. Add a test case: submit an order with a manipulated `unitPrice: 1` and confirm the order total in the DB reflects the real product price.

---

### CRIT-2: Seed Credentials — No Known Default Password

**File:** `prisma/seed.ts`

**Problem:** The default `SUPER_ADMIN` account is seeded with what is likely a hardcoded or known default password. If this reaches production unchanged, it is a full admin takeover.

**Task:**
1. Open `prisma/seed.ts` and find the SUPER_ADMIN user creation block.
2. If a hardcoded password string exists (e.g. `"password"`, `"admin123"`, `"printhub123"`), remove it.
3. Replace with one of the following approaches:
   - **Option A (Preferred):** Generate a cryptographically random password using `crypto.randomBytes(16).toString('hex')`, bcrypt-hash it, print the plaintext to console once during seed (`console.log('\n⚠️  SUPER_ADMIN TEMP PASSWORD:', tempPassword, '\n')`), and store only the hash.
   - **Option B:** Read the initial password from an environment variable `SEED_ADMIN_PASSWORD` and throw an error if it is not set during seed execution.
4. Confirm the seed script cannot be re-run on an existing DB without first checking if the admin user already exists (prevent credential reset via re-seed).
5. Add a comment block at the top of `seed.ts` warning that this script must never be run in production after initial setup.

---

### CRIT-3: VirusTotal — Make Mandatory, Not Optional

**Files:** `lib/virustotal.ts`, `app/api/upload/confirm/route.ts` (or equivalent confirm handler)

**Problem:** VirusTotal scanning is documented as optional. Files go to R2 without scanning if `VIRUSTOTAL_API_KEY` is not set. This platform accepts STL files, design files, and arbitrary uploads.

**Task:**
1. Open the upload confirm handler and find where `UploadedFile.virusScanStatus` is set.
2. Change the logic so that:
   - If `VIRUSTOTAL_API_KEY` is set: submit to VirusTotal, set `virusScanStatus = PENDING`, poll/webhook for result, set `CLEAN` or `INFECTED`.
   - If `VIRUSTOTAL_API_KEY` is NOT set in production (`NODE_ENV === 'production'`): **throw a startup error** — do not allow the app to boot without it.
   - In development only: allow a bypass with `virusScanStatus = SKIPPED`.
3. Ensure files with `virusScanStatus = PENDING` or `INFECTED` cannot be downloaded via `/api/upload/[id]/download` or served publicly.
4. Add a startup check in `instrumentation.ts` that asserts `VIRUSTOTAL_API_KEY` is present in production.

---

## 🟠 HIGH — Fix Before Go-Live

---

### HIGH-1: CSRF Exemption for Payment Callbacks — Verify and Document

**Files:** `middleware.ts`, `app/api/payments/mpesa/callback/route.ts`, `app/api/payments/stripe/webhook/route.ts`, `app/api/payments/pesapal/callback/route.ts`, `app/api/payments/flutterwave/route.ts`

**Problem:** The CSRF origin check applies to all mutations. Payment callbacks from Safaricom, Stripe, Pesapal, and Flutterwave have no browser `Origin` header and will be blocked — unless there's an explicit exemption that is currently undocumented.

**Task:**
1. Open `middleware.ts` and find the Origin check logic.
2. Confirm that `/api/payments/*/callback`, `/api/payments/*/webhook`, and `/api/payments/*/ipn` paths are explicitly exempted from the Origin check.
3. If no exemption exists, add one — but ONLY for these specific paths.
4. For each payment callback, confirm provider-specific validation is in place:
   - **M-Pesa:** `CheckoutRequestID` matched against a pending `MpesaTransaction` in the DB before updating order status.
   - **Stripe:** `stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)` — confirm raw body is used, not `req.json()`.
   - **Pesapal:** IPN re-verified against Pesapal API before order confirmation.
   - **Flutterwave:** `verif-hash` header checked against `FLUTTERWAVE_SECRET_HASH`.
5. Add inline comments in each callback handler documenting exactly what validation is performed.

---

### HIGH-2: Catalogue Import — SSRF Prevention

**File:** `app/api/admin/catalogue/import/route.ts`

**Problem:** This endpoint accepts an arbitrary URL from the admin and passes it to n8n to scrape. A compromised admin account could point it at internal Railway services or metadata endpoints.

**Task:**
1. Open the import route handler and find where the URL is received and forwarded.
2. Add URL validation before triggering the n8n workflow:
   ```typescript
   const ALLOWED_IMPORT_DOMAINS = [
     'printables.com',
     'www.printables.com',
     'thingiverse.com',
     'www.thingiverse.com',
     'myminifactory.com',
     'www.myminifactory.com',
   ];
   
   function validateImportUrl(url: string): boolean {
     try {
       const parsed = new URL(url);
       // Block non-HTTPS
       if (parsed.protocol !== 'https:') return false;
       // Block private IP ranges
       const hostname = parsed.hostname;
       if (/^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/.test(hostname)) return false;
       // Allowlist check
       return ALLOWED_IMPORT_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
     } catch { return false; }
   }
   ```
3. Return a 400 error with a clear message if the URL fails validation.
4. Log the attempted URL in `AuditLog` for all import requests (both valid and rejected).

---

### HIGH-3: Geo Detection — Fail-Open Safely with Fallback

**File:** `lib/geo-detection.ts`

**Problem:** Every admin login calls `ip-api.com`. If this external service is down, rate-limited, or slow, it could block all admin logins or cause unhandled errors. Also, admin IPs are being sent to a third-party service.

**Task:**
1. Open `lib/geo-detection.ts` and wrap the `ip-api.com` call in a try/catch with a timeout (max 2 seconds).
2. On failure (timeout, network error, non-200 response), return a fallback object:
   ```typescript
   { city: 'Unknown', country: 'Unknown', source: 'fallback' }
   ```
   — and log a warning to Sentry. Never throw or block the login flow.
3. Add a request timeout of 2000ms to the fetch call.
4. Consider switching to a self-hosted or Cloudflare-based geo lookup (e.g. Cloudflare's `cf-ipcountry` header if traffic goes through Cloudflare) to eliminate the third-party dependency entirely.
5. Document the fallback behaviour in a comment above the function.

---

### HIGH-4: AuditLog — Redact Sensitive Fields from Before/After Snapshots

**File:** `lib/audit.ts`

**Problem:** `AuditLog.before` and `AuditLog.after` store full JSON snapshots of entity state. A `User` snapshot could contain `passwordHash`, a `Payment` snapshot could contain card tokens.

**Task:**
1. Open `lib/audit.ts` and find where `before`/`after` snapshots are constructed.
2. Add a `redactSensitiveFields` function that removes or masks the following fields before storing:
   ```typescript
   const REDACTED_FIELDS = [
     'passwordHash', 'password', 'secret', 'token', 'apiKey',
     'securityCredential', 'passkey', 'cardToken', 'cvv',
     'twoFactorSecret', 'resetToken', 'verificationToken',
   ];
   
   function redactSensitiveFields(obj: Record<string, any>): Record<string, any> {
     return Object.fromEntries(
       Object.entries(obj).map(([k, v]) => [
         k,
         REDACTED_FIELDS.some(f => k.toLowerCase().includes(f.toLowerCase()))
           ? '[REDACTED]'
           : v
       ])
     );
   }
   ```
3. Apply this function to both `before` and `after` before the `AuditLog` record is written.
4. Run a migration or cleanup script on existing `AuditLog` entries to redact any `passwordHash` values already stored.

---

### HIGH-5: Admin JWT TTL — Shorten to 8 Hours

**File:** `lib/auth-admin.ts`

**Problem:** The architecture does not specify the admin session TTL. If it inherits the default or customer 30-day maxAge, a stolen admin JWT is valid for 30 days.

**Task:**
1. Open `lib/auth-admin.ts` and find the NextAuth `session` config.
2. Set `maxAge` to `8 * 60 * 60` (8 hours) for admin sessions.
3. Consider setting it to `4 * 60 * 60` (4 hours) for SUPER_ADMIN sessions specifically.
4. Confirm that `AdminSession` records in the DB are also expired/deleted after this TTL.
5. Confirm the admin login page shows a session expiry warning and gracefully redirects to `/admin/login` on expiry rather than throwing an unhandled error.

---

### HIGH-6: Open Redirect — Validate callbackUrl

**Files:** `lib/auth-customer.ts`, `lib/auth-admin.ts`, any login redirect logic

**Problem:** The `callbackUrl` parameter used after login is not documented as validated for same-origin. An attacker can craft `login?callbackUrl=https://evil.com`.

**Task:**
1. Find all usages of `callbackUrl` in the auth config and any redirect-after-login logic.
2. Add validation that `callbackUrl` must be a relative path (starts with `/`) or match the application domain exactly:
   ```typescript
   function isSafeCallbackUrl(url: string, appUrl: string): boolean {
     if (url.startsWith('/')) return true;
     try {
       const parsed = new URL(url);
       const app = new URL(appUrl);
       return parsed.hostname === app.hostname;
     } catch { return false; }
   }
   ```
3. If the `callbackUrl` fails validation, default to `/` (customer) or `/admin/dashboard` (admin).
4. Apply this to both `auth-customer.ts` and `auth-admin.ts`.

---

## 🟡 MEDIUM — Fix Within First Week Post-Launch

---

### MED-1: AI-Generated Content — Moderation Gate Before Public Visibility

**Files:** `app/api/admin/catalogue/[id]/approve/route.ts`, any route that sets `ProductMockup` or `ProductVideo` to visible

**Problem:** StabilityAI and DALL-E generate images and videos that link directly to products. A prompt injection via a malicious import URL could produce inappropriate content that auto-publishes.

**Task:**
1. Ensure `ProductMockup` and `ProductVideo` records have a `status` field (`PENDING_REVIEW`, `APPROVED`, `REJECTED`).
2. Newly generated AI assets must default to `PENDING_REVIEW` — they must not appear on public product pages until an admin explicitly approves them.
3. Add an admin UI section at `/admin/catalogue/[id]` to preview and approve/reject AI-generated mockups and videos before they go live.
4. Confirm the public product page query filters out `PENDING_REVIEW` and `REJECTED` assets.

---

### MED-2: BlogPost — Human Review Gate Before External Sync

**File:** Any route or n8n workflow that syncs `BlogPost` to Medium/LinkedIn

**Problem:** AI-generated blog posts could contain hallucinated or defamatory content and be automatically synced to external platforms.

**Task:**
1. Confirm `BlogPost` has a `status` field with at least `DRAFT`, `PENDING_REVIEW`, `PUBLISHED`.
2. The Medium/LinkedIn sync workflow in n8n must only trigger on posts with `status = PUBLISHED`.
3. Add a manual publish action in the admin portal (`/admin/content/blog/[id]`) that moves a post from `PENDING_REVIEW` to `PUBLISHED` — this is the only gate that triggers the sync.
4. Add a `publishedAt` timestamp and `publishedBy` (userId) field to `BlogPost` for audit trail.

---

### MED-3: SmsBroadcast — Opt-In Verification and Rate Limiting

**File:** Any route or n8n workflow that triggers `SmsBroadcast`

**Problem:** Bulk SMS campaigns have no documented opt-in verification, campaign-level unsubscribe handling, or rate limiting. In Kenya, unsolicited SMS can trigger Communications Authority enforcement.

**Task:**
1. Confirm that `SmsBroadcast` campaigns only send to users where `smsMarketingOptIn = true`.
2. Add a campaign-level unsubscribe tracking field to `SmsBroadcast` (recipients who opted out during this campaign).
3. Add a rate limit on the broadcast trigger endpoint — no more than 1 broadcast per hour per admin, enforced via Upstash Redis.
4. Add a mandatory confirmation step in the admin UI before a broadcast is sent: show recipient count, estimated cost, and require a typed confirmation ("SEND TO 1,234 CONTACTS").
5. Log every broadcast in `AuditLog` with the admin userId, recipient count, and message content.

---

### MED-4: ElevenLabs — Spend Limit and Key Rotation Policy

**Files:** n8n workflows using `ELEVENLABS_API_KEY`, `lib/` if used directly

**Problem:** ElevenLabs voice synthesis API key, if leaked, enables unlimited audio generation in your brand's voice. No spend controls are documented.

**Task:**
1. Confirm `ELEVENLABS_API_KEY` is stored only in Railway environment variables and n8n credentials — never in code or workflow JSON.
2. Set a monthly spend/character limit in the ElevenLabs dashboard.
3. Add `ELEVENLABS_API_KEY` to the list of keys that trigger a Sentry alert if usage spikes unexpectedly (via `AiServiceLog` monitoring).
4. Document key rotation frequency in `docs/SECURITY.md` (recommend every 90 days).

---

### MED-5: Hardware Warranty — Prevent Serial Number Enumeration

**File:** `app/api/account/warranties/route.ts` or equivalent warranty lookup endpoint

**Problem:** `WarrantyRecord` links to `User`. A customer could look up another customer's warranty record by guessing a serial number.

**Task:**
1. Find the warranty lookup endpoint.
2. Confirm that every query scopes to the authenticated user's `userId`:
   ```typescript
   const warranty = await prisma.warrantyRecord.findFirst({
     where: { serialNumber: input.serialNumber, userId: session.user.id }
   });
   ```
3. Ensure the endpoint returns a generic 404 (not "warranty exists but belongs to another user") if the serial number doesn't match the authenticated user.
4. Add rate limiting (max 10 attempts per hour per user) to prevent automated serial number enumeration.

---

### MED-6: Corporate Role Enforcement — Double-Check API Layer

**Files:** `app/api/corporate/*/route.ts`, `app/api/account/corporate/checkout/route.ts`

**Problem:** `CorporateTeamMember` has its own role (`OWNER`, `ADMIN`, `FINANCE`, `MEMBER`) with flags like `canPlaceOrders` and `canManageTeam`. If API routes only check `User.role` and not these corporate-specific flags, a `MEMBER` could perform `OWNER`-level actions.

**Task:**
1. Audit every `/api/corporate/*` and `/api/account/corporate/*` route handler.
2. For each handler, confirm it checks BOTH:
   - `session.user.isCorporate === true`
   - The specific `CorporateTeamMember` record from the DB with the correct `corporateId` and required role/flag
3. Specifically check:
   - `POST /api/corporate/team/invite` — must require `canManageTeam = true`
   - `GET /api/account/corporate/checkout` — must require `canPlaceOrders = true`
   - Corporate invoice endpoints — must require `canViewInvoices = true` or `FINANCE`/`OWNER` role
4. Never trust `corporateRole` from the JWT alone for write operations — always re-fetch from DB.

---

## 🔵 DOCUMENTATION — Add to Architecture Doc

---

### DOC-1: Document Payment Callback Security Model
Add a section to `SYSTEM_ARCHITECTURE.md` under §6.3 explicitly listing:
- Which routes are exempted from CSRF origin checks and why
- The exact validation method for each payment provider callback
- What happens if callback validation fails (log + 400, never silently succeed)

### DOC-2: Document Admin Session TTL
Add to §6.1 the exact `maxAge` values for `printhub.admin.session` and `printhub.customer.session`.

### DOC-3: Document Geo Detection Fallback
Add to §6.2 what happens when `ip-api.com` is unreachable — confirm login is not blocked.

### DOC-4: Document AI Content Pipeline
Add to §7.4 the moderation steps between AI asset generation and public product page visibility.

### DOC-5: Document Seed Policy
Add to §9.2 that `prisma/seed.ts` generates a random one-time password, prints it once to console, and must never be re-run in production after initial setup.

### DOC-6: Create `docs/SECURITY.md`
Create a new file documenting:
- API key rotation schedule (90 days for AI services, 180 days for payment gateways)
- Incident response steps if a key is compromised
- Which keys have spend limits set and where
- n8n webhook HMAC key rotation procedure

---

## ✅ FINAL VERIFICATION CHECKLIST

After all fixes are implemented, confirm the following before closing this audit:

- [ ] `POST /api/orders` recalculates all prices from DB — client price fields are ignored
- [ ] `prisma/seed.ts` generates a random password — no hardcoded credentials
- [ ] VirusTotal is mandatory in production — app fails to boot without `VIRUSTOTAL_API_KEY`
- [ ] Payment callback routes are explicitly exempted from CSRF check with provider validation confirmed
- [ ] `/api/admin/catalogue/import` rejects URLs not on the domain allowlist
- [ ] `lib/geo-detection.ts` has a 2-second timeout and fails open
- [ ] `lib/audit.ts` redacts `passwordHash` and token fields from snapshots
- [ ] `lib/auth-admin.ts` sets `maxAge` to 8 hours or less
- [ ] `callbackUrl` is validated as same-origin in both auth configs
- [ ] `ProductMockup` and `ProductVideo` require admin approval before public visibility
- [ ] `BlogPost` external sync only triggers on `PUBLISHED` status after human review
- [ ] `SmsBroadcast` scoped to `smsMarketingOptIn = true` users only
- [ ] `WarrantyRecord` lookups scoped to authenticated `userId`
- [ ] Corporate API routes check DB-level role flags, not JWT claims alone
- [ ] `docs/SECURITY.md` created with key rotation and incident response policy
