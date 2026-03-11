# Clearing the production database

**⚠️ Destructive. Backup first. Use only with the correct DATABASE_URL.**

Two options:

---

## Option A: Wipe all data, keep tables (TRUNCATE)

All rows are deleted; tables and schema stay. Good for a “fresh start” with the same schema.

1. **Backup** (optional but recommended). Ensure `DATABASE_URL` is set in this shell (e.g. from `.env`):
   ```bash
   # Load from .env (if DATABASE_URL is there), then run pg_dump
   export $(grep -v '^#' .env | grep DATABASE_URL | xargs)
   pg_dump "$DATABASE_URL" > backup-$(date +%Y%m%d-%H%M).sql
   ```
   Or set it explicitly: `export DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"`

   **If you see "server version mismatch":** Neon uses Postgres 17. Use a matching client: `brew install postgresql@17` then run backup with `$(brew --prefix postgresql@17)/bin/pg_dump "$DATABASE_URL" > backup.sql`

2. **Run the truncate script** (uses your `DATABASE_URL` from `.env` or env):
   ```bash
   export DATABASE_URL="postgresql://..."   # your PRODUCTION URL
   npx tsx scripts/db-truncate-all.ts
   ```

3. Optionally seed again:
   ```bash
   npx prisma db seed
   ```

---

## Option B: Full reset (drop schema + re-run migrations)

Drops the whole `public` schema and reapplies migrations. Use when you want the DB in the same state as a fresh `migrate deploy`.

1. **Backup** (recommended):
   ```bash
   pg_dump "$DATABASE_URL" > backup-$(date +%Y%m%d-%H%M).sql
   ```

2. **Connect with a direct URL** (Neon: use the non-pooled “direct” connection; poolers often don’t allow schema changes).

3. **Run SQL to drop and recreate the schema** (run once, then run Prisma):
   ```bash
   export DATABASE_URL="postgresql://..."   # PRODUCTION direct URL
   # One-time: drop public schema and recreate (PostgreSQL)
   npx prisma db execute --stdin <<'SQL'
   DROP SCHEMA IF EXISTS public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO current_user;
   GRANT ALL ON SCHEMA public TO public;
   SQL
   ```

4. **Re-apply migrations** (this recreates all tables):
   ```bash
   npx prisma migrate deploy
   ```

5. Optionally seed:
   ```bash
   npx prisma db seed
   ```

---

## Safety

- **Confirm DATABASE_URL** is the one you intend (production vs test).
- Prefer running Option A or B from your machine or a trusted CI job, not from the app.
- After clearing, if the app uses that DB, users will need to register again (or you run seed for test accounts).
