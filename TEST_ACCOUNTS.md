# Test accounts (after running seed)

Role	Email	Password
Super Admin	admin@printhub.africa	Admin@Printhub2025!
Admin	admin2@printhub.africa	Test@12345
Staff (Sales)	sales@printhub.africa	Test@12345
Staff (Marketing)	marketing@printhub.africa	Test@12345
Customer	customer@printhub.africa	Test@12345


Run the database seed to create these users. Then log in at **/login** with email + password.

---

## Creating test accounts on your Vercel deployment (e.g. test.ovid.co.ke)

Your app is deployed but the database is empty. To create the admin, sales, and marketing test accounts **in the same database Vercel uses**:

1. **Get your database URL** from Vercel or Neon:
   - Vercel: Project → Settings → Environment Variables → copy `DATABASE_URL` (and `DIRECT_URL` if you use it).
   - Or Neon: Project → Connection details → copy the connection string.

2. **From your machine** (in the project folder), run the seed against that database:

   ```bash
   # One-time: point at your deployed DB (test or prod)
   export DATABASE_URL="postgresql://user:password@your-neon-host/neondb?sslmode=require"
   npx prisma db seed
   ```

   Or create a one-off `.env.seed` (do not commit it) with only `DATABASE_URL=...` and run:

   ```bash
   dotenv -e .env.seed -- npx prisma db seed
   ```

   If you use `dotenv`, install it once: `npm i -D dotenv-cli`. Or on macOS/Linux: `env $(cat .env.seed | xargs) npx prisma db seed`.

3. **Log in** at `https://test.ovid.co.ke/login` (or your app URL) with any of the emails below.

**Important:** Use a **separate test database** for test.ovid.co.ke. Do not seed your production DB with test passwords unless you change them right after.

---

## Local: run seed (same DB as dev)

```bash
npx prisma db seed
# or: npm run db:seed
```

Then log in at **http://localhost:3000/login** (or your dev URL).

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

## First-time setup (local)

1. Ensure PostgreSQL is running and `DATABASE_URL` in `.env` or `.env.local` is correct.
2. Run migrations: `npx prisma migrate dev`
3. Run seed: `npx prisma db seed`
4. Go to http://localhost:3000/login (or your dev URL) and sign in with any of the emails above.

## Adding more admins or staff later

- **Same emails, reset DB:** Run `npx prisma db seed` again (upsert won’t change existing users’ passwords).
- **New user:** Register at `/register`, then in the database set `role` to `STAFF`, `ADMIN`, or `SUPER_ADMIN` and add a row in `Staff` if they’re STAFF (with `userId`, `department`, `position`, `permissions`). Easiest: use Prisma Studio with `DATABASE_URL` set to your deployed DB: `npx prisma studio`.
