# GitHub Push Audit — What to Commit vs Keep Private

**Purpose:** Before pushing to GitHub (public or private), ensure no secrets, credentials, or security-sensitive content are committed. This doc lists what is **OK to push** and what is **not**, including documentation.

---

## 1. Never commit (already in .gitignore)

| Item | Reason |
|------|--------|
| `.env` | Real secrets (DB URL, API keys, NEXTAUTH_SECRET, etc.) |
| `.env.local` | Local overrides and secrets |
| `.env.development.local`, `.env.test.local`, `.env.production.local`, `.env.test` | Environment-specific secrets |
| `.env.sentry-build-plugin` | Sentry auth token |
| `.env.seed` | Optional file for `dotenv -e .env.seed -- npx prisma db seed`; may contain `DATABASE_URL` for a specific DB — **added to .gitignore** |
| `node_modules/` | Dependencies (reinstall from package.json) |
| `.next/`, `out/`, `build/` | Build output |
| `*.pem` | Private keys (SSL, Apple, etc.) |
| `public/uploads/` | User-uploaded files |
| `.vercel` | Vercel project linking |
| `erpnext-data/` | Local Docker volumes |
| `Coursera*.pdf`, `*Cursor*Prompt*`, `*CursorAI*` | Personal/dev files |
| `archive/` | Archived code (if it contains old secrets, audit before restoring) |

**Check before first push:** Run `git status` and `git log --all -- "*.env" "*.pem" ".env*"` — no `.env` or `.pem` files should ever appear in history. If they do, use `git filter-branch` or BFG to remove them and rotate all exposed secrets.

---

## 2. OK to commit (safe for GitHub)

| Item | Notes |
|------|--------|
| **`.env.example`** | Template with variable names and empty or placeholder values only. No real keys or secrets. |
| **`.env.local.example`** | Same as above. |
| **Source code** (`app/`, `lib/`, `components/`, `prisma/schema.prisma`, etc.) | No hardcoded secrets; app reads from `process.env`. |
| **`prisma/seed.ts`** | Contains **default dev passwords** for seeded users. Acceptable for a private repo if you never run seed against production without changing passwords. For a **public** repo, consider loading passwords from env (e.g. `SEED_ADMIN_PASSWORD`, `SEED_DEFAULT_PASSWORD`) so no password string lives in the repo. |
| **`package.json`, `package-lock.json`** | Dependencies only. |
| **`next.config.mjs`, `tailwind.config.ts`, `tsconfig.json`, etc.** | No secrets. |
| **Docs that only list env *names* and public URLs** | e.g. `docs/SYSTEM_ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, `docs/LAUNCH_CHECKLIST.md` — they reference `NEXTAUTH_SECRET`, `DATABASE_URL`, etc. by name and use placeholders like `https://printhub.africa`. Safe. |
| **`docs/SECURITY_AUDIT.md`** | Describes security findings and env var names; no actual secrets. |
| **`docs/R2_CORS.md`, `docs/SENTRY_SETUP.md`** | Instructions and placeholder values (e.g. "your-auth-token"). |
| **README.md** | After redaction: no real passwords; only "set by seed" or "change in production" type wording. |
| **TEST_ACCOUNTS.md** | After redaction: role/email table is fine; passwords must be placeholders (e.g. "set by seed") so real credentials are never in the repo. |

---

## 3. Documentation — security rules

- **Do not** put real API keys, passwords, tokens, or connection strings in any `.md` or comment.
- **Do** use placeholders: `your-api-key`, `openssl rand -base64 32`, `postgresql://user:password@host/db`.
- **Public URLs** (e.g. `https://printhub.africa`, `https://test.ovid.co.ke`) are fine; they do not expose secrets.
- **Internal URLs** that include tokens or keys** — never commit. If you need to document a callback URL, use a placeholder domain and path only (e.g. `https://your-domain.com/api/payments/mpesa/callback`).
- **Seed / test accounts:** Document **roles and emails** only. Passwords must come from "run seed" or env; never write the actual default passwords in docs (see fixes below).

---

## 4. Fixes applied in this audit

1. **README.md** — Removed real default admin and ERPNext passwords. Replaced with "(set by seed; change in production)" and "(default; do not use in production)".
2. **TEST_ACCOUNTS.md** — Replaced real passwords in the table with placeholders so the repo never contains the actual seed passwords.
3. **.gitignore** — Added `.env.seed` so any one-off seed env file is never committed.

---

## 5. Optional hardening (recommended for public repo)

- **prisma/seed.ts:** Load admin and default passwords from env (e.g. `SEED_ADMIN_PASSWORD`, `SEED_DEFAULT_PASSWORD`) with no fallback in production. Use fallbacks only when `NODE_ENV === 'development'` so production seed always requires explicit env.
- **TEST_ACCOUNTS.md:** Keep the file as reference for roles/emails; do not re-add real passwords. New developers get credentials via secure channel or by running seed and reading from env.
- **Pre-push hook:** Optionally run a quick check (e.g. `git diff --cached | grep -iE 'password|secret|api_key|bearer'` for obvious leaks) and block push if matches are found in tracked files.

---

## 6. Quick pre-push checklist

- [ ] No `.env` or `.env.local` (or any file with real secrets) is staged.
- [ ] No `*.pem` or other private keys are staged.
- [ ] README and TEST_ACCOUNTS do not contain real passwords (only placeholders / "set by seed").
- [ ] `.env.example` and `.env.local.example` contain only variable names and empty or example values.
- [ ] You have run `git status` and reviewed every staged file.
- [ ] If the repo is or will be **public**, consider env-based seed passwords and the optional hardening above.
