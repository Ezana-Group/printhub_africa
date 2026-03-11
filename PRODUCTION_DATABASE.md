# Production database — clean slate

For **launch and production**, the database should be a **clean slate** with only the super admin user, so you can start feeding real data.

## Do not use the default seed in production

- `npm run db:seed` / `npx prisma db seed` runs the **full seed**: test users (admin, staff, customer), categories, products, and other sample data. Use this only in development or test.
- In production, use the **production seed** instead.

## Production setup (clean slate)

1. **Apply migrations** (creates empty tables):
   ```bash
   npx prisma migrate deploy
   ```

2. **Create only the super admin user**:
   ```bash
   SUPER_ADMIN_EMAIL=admin@printhub.africa SUPER_ADMIN_PASSWORD="YourSecurePassword" npm run db:seed:production
   ```
   Replace with your own email and a strong password. Optional: `SUPER_ADMIN_NAME="PrintHub Super Admin"`.

3. **Log in** at `/login` with that email and password. The database will have no other users or test data; you can then add real products, categories, and settings from the admin.

## Summary

| Command | Use case |
|--------|----------|
| `prisma migrate deploy` | Apply schema (empty DB or existing prod DB). |
| `npm run db:seed:production` | Create **only** the super admin (set `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`). |
| `npm run db:seed` | **Do not use in production** — adds test users and sample data. |
