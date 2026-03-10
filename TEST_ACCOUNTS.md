# Test accounts (after running seed)

Run the database seed to create these users:

```bash
npx prisma db seed
# or: npm run db:seed
```

Then log in at **/login** with email + password.

Use these to log in to ERPNext when it’s running locally:
URL	http://localhost:8080
Username	administrator
Password	admin123
Site	printhub.localhost
Start ERPNext with `npm run erpnext:start`. 

| Role | Email | Password | Access |
|------|--------|----------|--------|
| **Super Admin** | admin@printhub.africa | Admin@Printhub2025! | Full admin dashboard, all areas |
| **Admin** | admin2@printhub.africa | Test@12345 | Admin dashboard (same as Staff/Admin in app) |
| **Staff (Sales)** | sales@printhub.africa | Test@12345 | Admin dashboard; department: Sales |
| **Staff (Marketing)** | marketing@printhub.africa | Test@12345 | Admin dashboard; department: Marketing |
| **Customer** | customer@printhub.africa | Test@12345 | Shop, account, checkout only (no /admin) |

## Notes

- **CUSTOMER** – Can use shop, cart, checkout, account (orders, addresses, profile). Cannot open `/admin`.
- **STAFF**, **ADMIN**, **SUPER_ADMIN** – Can open `/admin` (Dashboard, Orders, Products, etc.). Sales/Marketing are STAFF with different departments in the `Staff` table (for future permissions or display).
- If the database was already seeded before, `upsert` will not change existing users’ passwords. To reset a password, update it in the database or re-seed (seed uses `update: {}` so existing rows are not updated).

## First-time setup

1. Ensure PostgreSQL is running and `DATABASE_URL` in `.env` or `.env.local` is correct.
2. Run migrations: `npx prisma migrate dev`
3. Run seed: `npx prisma db seed`
4. Go to http://localhost:3000/login (or your dev URL) and sign in with any of the emails above.
