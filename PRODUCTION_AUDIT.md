# PrintHub Africa — Production System Audit

**Date:** 2026-03-11  
**Purpose:** Identify all files required for the system to run in production; exclude dev-only, tests, docs, and secrets.

---

## 1. What the system needs to run

- **Runtime:** Next.js 14 (standalone), Node 20, Prisma (PostgreSQL).
- **Build:** `npm run build` → `prisma generate` + `next build`.
- **Start:** `npm run start` → `next start` (or Docker `node server.js`).

---

## 2. Files and folders — IN SCOPE (Production)

| Path | Purpose |
|------|--------|
| **Root config** | |
| `package.json` | Dependencies and scripts (build, start). |
| `package-lock.json` | Reproducible installs. |
| `next.config.mjs` | Next.js config (standalone, Sentry, headers, images). |
| `tsconfig.json` | TypeScript and path `@/*`. |
| `next-env.d.ts` | Next.js type references. |
| `tailwind.config.ts` | Tailwind CSS. |
| `postcss.config.mjs` | PostCSS. |
| `components.json` | Shadcn/UI component config. |
| `middleware.ts` | Next.js middleware (auth, redirects). |
| `instrumentation.ts` | Next.js instrumentation (if used). |
| `prisma.config.ts` | Prisma config. |
| **Sentry** | |
| `sentry.client.config.ts` | Sentry client. |
| `sentry.server.config.ts` | Sentry server. |
| `sentry.edge.config.ts` | Sentry edge. |
| **Source** | |
| `app/` | All routes, layouts, API routes. |
| `components/` | UI components. |
| `lib/` | Shared lib (auth, db, email, S3, etc.). |
| `store/` | Zustand stores. |
| `types/` | TypeScript types. |
| `hooks/` | React hooks. |
| **Data & static** | |
| `prisma/` | `schema.prisma`, `migrations/`, `seed.ts`, `legal-content.ts`. |
| `public/` | Static assets (images, templates). |
| **Deploy** | |
| `Dockerfile` | Multi-stage build and run. |
| `.dockerignore` | Docker build context. |
| `docker-compose.yml` | DB (and app if used). |
| **Env template** | |
| `.env.example` or `.env.local.example` | Env var template (no secrets). |
| `.gitignore` | Ignore node_modules, .env, .next, etc. |

---

## 3. Files and folders — OUT OF SCOPE (not in Production folder)

| Path | Reason |
|------|--------|
| `.env`, `.env.local`, `.env.test` | Secrets; set in deployment. |
| `node_modules/` | Recreated by `npm ci`. |
| `.next/` | Build output. |
| `.git/` | Version control. |
| `.husky/` | Git hooks (dev). |
| `.eslintrc.json`, `.prettierrc` | Lint/format (dev). |
| `__tests__/`, `tests/` | Test code. |
| `jest.config.ts`, `jest.setup.ts`, `playwright.config.ts` | Test config. |
| `playwright-report/`, `test-results/`, `coverage/` | Test artifacts. |
| `docs/` | Documentation. |
| `*.md` (except optional README) | Docs, checklists, audits. |
| `scripts/` | Dev/ops (erpnext, db helpers, image scripts). |
| `backup-*.sql` | DB backups. |
| `docker-compose.erpnext.yml` | Optional ERPNext stack. |
| `audit_report.md.resolved`, `REMAINING_FIXES_AUDIT.md` | Audits. |
| `BUILD_CHECKLIST.md`, `DOCKER.md`, `TESTING.md`, `TEST_ACCOUNTS.md` | Dev docs. |
| `PrintHub_Test_Checklist.docx` | Test checklist. |
| `public/uploads/` | User uploads (gitignored; mount or volume in prod). |

---

## 4. Summary

- **In Production folder:** Only files needed for build, run, and deploy (app, components, lib, store, types, hooks, prisma, public, configs, Docker, env example, .gitignore).
- **Not in Production folder:** Env with secrets, node_modules, .next, tests, docs, scripts, backups, and dev-only tooling.

The `Production/` folder created from this audit contains a copy of these essential files only, so the system can run as expected when deployed (e.g. via Docker or `npm run build && npm run start`).
