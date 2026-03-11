# PrintHub Africa — Production

This folder contains **only the files required for the application to run** in production. It was generated from the project audit; see root `PRODUCTION_AUDIT.md` for what is included and excluded.

## Quick start

1. **Install and build**
   ```bash
   npm ci
   ```
   Set at least `DATABASE_URL` (e.g. copy from `.env.example` and fill, or use a dummy for build: `DATABASE_URL="postgresql://u:p@localhost:5432/db?schema=public"`). Then:
   ```bash
   npm run build
   ```
2. **Set environment variables**  
   Copy `.env.example` to `.env` (or `.env.local`) and fill in your values. Do not commit secrets.
3. **Database**  
   Ensure PostgreSQL is running and `DATABASE_URL` is set. To run DB with Docker: `docker compose up -d db`. Then:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed   # optional
   ```
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
