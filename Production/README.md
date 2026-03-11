# PrintHub Africa — Production

This folder contains **only the files required for the application to run** in production. It was generated from the project audit; see root `PRODUCTION_AUDIT.md` for what is included and excluded.

## Quick start

1. **Set environment variables first**  
   Prisma and the app need `DATABASE_URL` (and other vars). Either:
   - **Option A:** Copy `.env.example` to `.env` in this folder and fill in values (recommended for a standalone Production deploy), or  
   - **Option B:** Run commands from the **parent repo root** (where your existing `.env.local` lives) so Prisma and the app see the same env.
2. **Install and build**
   ```bash
   npm ci
   npm run build
   ```
3. **Database (clean slate for launch)**  
   Ensure PostgreSQL is running and `DATABASE_URL` is set. To run DB with Docker: `docker compose up -d db`. Then apply schema and create **only** the super admin user (no test data):
   ```bash
   npx prisma migrate deploy
   SUPER_ADMIN_EMAIL=admin@printhub.africa SUPER_ADMIN_PASSWORD="YourSecurePassword" npm run db:seed:production
   ```
   Use your own email and a strong password. This is the only user in the database; log in at `/login` and start adding real data.
4. **Run**
   ```bash
   npm run start
   ```
   Or use the included `Dockerfile` for a containerized deploy.

## Contents

- **App:** `app/`, `components/`, `lib/`, `store/`, `types/`, `hooks/`
- **Data:** `prisma/` (schema, migrations, seed)
- **Static:** `public/`
- **Config:** `next.config.mjs`, `tsconfig.json`, Tailwind, PostCSS, Sentry, middleware
- **Deploy:** `Dockerfile`, `docker-compose.yml`, `.dockerignore`
