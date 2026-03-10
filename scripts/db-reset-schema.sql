-- Option B: Drop public schema and recreate (full reset). Run with: npx prisma db execute --file scripts/db-reset-schema.sql
-- Ensure DATABASE_URL (and DIRECT_URL if needed) is set. Backup first.
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO current_user;
GRANT ALL ON SCHEMA public TO public;
