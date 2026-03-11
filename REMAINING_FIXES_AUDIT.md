# PrintHub Africa — Remaining Fixes Audit

**Date:** 2026-03-11  
**Scope:** Issues still outstanding after Test-Prob merge

---

## 🔴 CRITICAL — Fix Immediately

### 1. No CSRF Protection on Custom API Routes
**File:** All routes under `app/api/` (except NextAuth)

No CSRF tokens are generated or validated. NextAuth handles its own CSRF for sign-in, but all other API routes are unprotected:
- `/api/orders` — order creation
- `/api/payments/mpesa/stkpush` — payment initiation
- `/api/contact` — contact form
- `/api/quote` — quote submissions
- `/api/admin/*` — all admin operations

**Impact:** An attacker can craft a malicious page that submits orders or triggers payments on behalf of authenticated users.

**Fix:** Add CSRF token middleware using `csrf` or a custom double-submit cookie pattern in Next.js middleware.

---

### 2. JWT Staff Permissions Query on Every Request
**File:** `lib/auth.ts` (Lines 119-129)

```ts
// AUDIT FIX: Always fetch fresh staff permissions from DB
if (role === "STAFF" && token.id) {
  const staff = await prisma.staff.findUnique({...});
  token.permissions = staff?.permissions ?? [];
}
```

Every request from a STAFF user triggers a database query. With multiple staff users, this is a performance bottleneck.

**Fix:** Cache permissions with a short TTL (5 min) via in-memory Map or Redis. Invalidate on permission changes.

---

## 🟠 HIGH — Fix Before Production

### 3. Template Download Links Return 404
**File:** `app/(public)/services/large-format-printing/page.tsx` (Lines 638-654)

Four download links point to files that don't exist:

| Link | File Exists? |
|------|-------------|
| `/templates/rollup-banner.ai` | ❌ |
| `/templates/aframe.ai` | ❌ |
| `/templates/backdrop.ai` | ❌ |
| `/templates/vehicle-wrap-guide.pdf` | ❌ |

`public/templates/` only contains a `README.md`.

**Fix:** Either add the actual template files or remove/disable the download links.

---

### 4. Stray Files in Repo Root
Two files committed that shouldn't be in the repository:

| File | Size | Issue |
|------|------|-------|
| `Coursera LNP82RAEFMBN.pdf` | 56KB | Personal certificate — unrelated to project |
| `PrintHub_CursorAI_Prompt.md` | 56KB | Exposes dev methodology and project roadmap |

**Fix:** Delete both files and add to `.gitignore`.

---

### 5. No Error Monitoring (Sentry)
**Files:** `package.json`, project root

Env placeholders (`SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`) exist in `.env.local.example` and an admin settings page references Sentry, but:
- No `@sentry/nextjs` in `package.json`
- No `sentry.client.config.ts` or `sentry.server.config.ts`
- No initialization code anywhere

**Impact:** Production errors go completely unnoticed.

**Fix:** Install `@sentry/nextjs`, run the setup wizard, and wire DSN from env vars.

---

### 6. Google OAuth Initializes with Empty Strings
**File:** `lib/auth.ts` (Lines 25-28)

```ts
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID ?? "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
})
```

Facebook and Apple already use conditional inclusion, but Google still initializes with empty strings when env vars are missing.

**Fix:** Apply the same conditional pattern:
```ts
...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  ? [GoogleProvider({...})]
  : []),
```

---

## 🟡 MEDIUM — Fix When Possible

### 7. Zero Test Coverage Improvement
No new tests were added. Current coverage:

| Area | Coverage |
|------|----------|
| API route tests | 0 |
| Payment flow tests | 0 |
| E2E specs | 7 files (auth, finance, inventory, permissions, quotes, settings, staff) |
| Component tests | 1 file (`ui-button.test.tsx`) |
| Calculator tests | 1 file (`lf-calculator-engine.test.ts`) |

**Priority tests needed:** Registration, password reset, MPesa STK push/callback, order creation, admin operations.

---

### 8. Algolia Search Still a Stub
**File:** `lib/algolia.ts`

`searchProducts()` always returns `{ hits: [] }`. Product search doesn't work. Acceptable if search isn't user-facing yet.

---

### 9. Sanity CMS Still a Stub
**File:** `lib/sanity.ts`

`getClient()` returns `null`, `getBlogPosts()` returns `[]`. Acceptable if blog isn't launched yet.

---

## 🔵 LOW — Architectural Debt

### 10. Cart Items Stored as JSON Blob
**File:** `prisma/schema.prisma` — Cart model

```prisma
items Json // array of { productId, variantId, quantity, customizations }
```

No referential integrity. If a product is deleted, cart items silently reference non-existent products.

---

## Summary

| Priority | Count | Items |
|----------|-------|-------|
| 🔴 Critical | 2 | CSRF protection, JWT staff caching |
| 🟠 High | 4 | Template 404s, stray files, Sentry, Google OAuth |
| 🟡 Medium | 3 | Test coverage, Algolia, Sanity |
| 🔵 Low | 1 | Cart JSON blob |
| **Total** | **10** | |
