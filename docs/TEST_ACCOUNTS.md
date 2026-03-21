# Test accounts (after running seed)

Passwords are set by `prisma/seed.ts`. **Do not commit real passwords to the repo.** For local dev, run `npx prisma db seed` and use the seeded accounts; change all passwords before using any seed data against production.

| Role | Email | Password (do not commit real values) |
|------|--------|--------------------------------------|
| Super Admin | admin@printhub.africa | Set by seed — change in production |
| Admin | admin2@printhub.africa | Set by seed |
| Staff (Sales) | sales@printhub.africa | Set by seed |
| Staff (Marketing) | marketing@printhub.africa | Set by seed |
| Customer | customer@printhub.africa | Set by seed |
| Corporate (approved) | corporate@printhub.africa | Set by seed |

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
- **URL:** http://localhost:8080  
- **Username:** administrator  
- **Password:** (set by ERPNext setup — do not commit; change in production)  
- **Site:** printhub.localhost  

Start ERPNext with `npm run erpnext:start`. 

| Role | Email | Password | Access |
|------|--------|----------|--------|
| **Super Admin** | admin@printhub.africa | Set by seed | Full admin dashboard, all areas |
| **Admin** | admin2@printhub.africa | Set by seed | Admin dashboard (same as Staff/Admin in app) |
| **Staff (Sales)** | sales@printhub.africa | Set by seed | Admin dashboard; department: Sales |
| **Staff (Marketing)** | marketing@printhub.africa | Set by seed | Admin dashboard; department: Marketing |
| **Customer** | customer@printhub.africa | Set by seed | Shop, account, checkout only (no /admin) |
| **Corporate (approved)** | corporate@printhub.africa | Set by seed | Approved corporate account (CORP-001). Account → Corporate, NET-30, place orders on account. Use for review and testing. |

## Notes

- **CUSTOMER** – Can use shop, cart, checkout, account (orders, addresses, profile). Cannot open `/admin`.
- **CORPORATE** – Same as customer, plus an **approved** corporate account (CORP-001, NET-30). Log in and go to **Account → Settings → Corporate Account** to see the dashboard, team, and place orders on account. Use **corporate@printhub.africa** with the seeded password for review and testing.
- **STAFF**, **ADMIN**, **SUPER_ADMIN** – Can open `/admin` (Dashboard, Orders, Products, etc.). Sales/Marketing are STAFF with different departments in the `Staff` table (for future permissions or display).
- If the database was already seeded before, `upsert` will not change existing users’ passwords. To reset a password, update it in the database or re-seed (seed uses `update: {}` so existing rows are not updated).

## First-time setup (local)

1. Ensure PostgreSQL is running and `DATABASE_URL` in `.env` or `.env.local` is correct.
2. Run migrations: `npx prisma migrate dev`
3. Run seed: `npx prisma db seed`
4. Go to http://localhost:3000/login (or your dev URL) and sign in with any of the emails above.

## Create a new super admin

From the project root, with `DATABASE_URL` set (e.g. in `.env`):

```bash
EMAIL=your@email.com PASSWORD=YourSecurePassword npx tsx scripts/create-super-admin.ts
```

Optional display name:

```bash
EMAIL=your@email.com PASSWORD=YourSecurePassword NAME="Your Name" npx tsx scripts/create-super-admin.ts
```

- If the email **doesn’t exist**, a new user is created as SUPER_ADMIN.
- If the email **already exists**, that user is updated to SUPER_ADMIN and the password is set to the one you provide.

Then log in at `/login` with that email and password.

## Adding more admins or staff later

- **Same emails, reset DB:** Run `npx prisma db seed` again (upsert won’t change existing users’ passwords).
- **New super admin:** Use `scripts/create-super-admin.ts` (see above).
- **New staff/admin (other roles):** Register at `/register`, then in the database set `role` to `STAFF`, `ADMIN`, or `SUPER_ADMIN` and add a row in `Staff` if they’re STAFF (with `userId`, `department`, `position`, `permissions`). Easiest: use Prisma Studio with `DATABASE_URL` set to your deployed DB: `npx prisma studio`.
