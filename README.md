# PrintHub — printhub.africa

**Large format printing & 3D printing for Nairobi and all of Kenya.**  
An Ezana Group Company.

## Tech stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **State:** Zustand, React Query
- **Backend:** Next.js API Routes, Prisma
- **Database:** PostgreSQL
- **Auth:** NextAuth.js (Email + Google)
- **Payments:** M-Pesa (Daraja), Pesapal, Flutterwave, Stripe

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy the example env file and fill in values:

```bash
cp .env.local.example .env.local
```

For local database, create a `.env` (or set in `.env.local`) with a PostgreSQL URL:

```bash
# .env or .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/printhub?schema=public"
```

**Keep redirects on localhost:** To test locally without being sent to printhub.africa (e.g. after login), set these in `.env.local`:

```bash
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=any-long-random-string   # e.g. run: openssl rand -base64 32
```

If these point at `https://printhub.africa`, NextAuth will redirect you to production after sign-in.

Prisma uses `prisma.config.ts` and loads `dotenv`; for Next.js use `.env.local` and ensure `DATABASE_URL` is available (e.g. copy to `.env` for Prisma CLI, or set in both).

### 3. Database setup

```bash
npm run db:generate   # Generate Prisma client
npm run db:push        # Push schema (dev) or use migrations
npm run db:seed        # Seed categories, products, admin user
```

For migrations (production-style):

```bash
npx prisma migrate dev --name init
npm run db:seed
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start dev server         |
| `npm run build`| Production build         |
| `npm run start`| Start production server  |
| `npm run lint` | Run ESLint               |
| `npm run format` | Format with Prettier   |
| `npm run db:generate` | Prisma generate   |
| `npm run db:push` | Prisma db push (dev)  |
| `npm run db:migrate` | Prisma migrate dev  |
| `npm run db:seed` | Seed database        |
| `npm run db:studio` | Prisma Studio       |
| `npm run build:with-migrate` | Build + run Prisma migrations (use where DB is available at build time) |

## Deploying to Vercel

The default `npm run build` runs only `prisma generate` and `next build`, so the build succeeds on Vercel (no database at build time).

**Run migrations separately:** After deploying, run migrations against your production DB once per release. Options:

1. **From your machine:** `DATABASE_URL="your-vercel-postgres-url" npx prisma migrate deploy`
2. **Vercel Post-Deploy:** If you use a deploy hook or external CI, add `npx prisma migrate deploy` there with `DATABASE_URL` and `DIRECT_URL` set.

Ensure `DATABASE_URL` and `DIRECT_URL` are set in the Vercel project (Settings → Environment Variables) for runtime.

## Project structure

```
app/
  (public)/     # Customer-facing: home, shop, services, cart, checkout
  (auth)/       # Login, register, forgot-password
  (admin)/      # Admin dashboard
  api/          # API routes (auth, payments, uploads, etc.)
components/
  ui/           # shadcn components
  layout/       # Header, Footer
  shop/         # Product cards, cart
  ...
lib/
  prisma.ts     # Prisma client
  auth.ts       # NextAuth config
  utils.ts      # cn(), formatPrice, etc.
prisma/
  schema.prisma # Full DB schema
  seed.ts       # Seed data
```

## Default admin (after seed)

- **Email:** admin@printhub.africa  
- **Password:** Admin@Printhub2025!  

Change this in production.

## Currency & locale

- Primary currency: **KES** (Kenyan Shilling)
- VAT: 16% (Kenya)
- Phone format: +254XXXXXXXXX

## ERPNext Integration

PrintHub uses ERPNext for finance, inventory, HR and payroll.

### First Time Setup

1. Make sure Docker Desktop is running
2. `npm run erpnext:check` — verify prerequisites
3. `npm run erpnext:start` — starts ERPNext (3–5 mins first time)
4. `npm run erpnext:setup` — configures ERPNext for PrintHub
5. `npm run erpnext:test` — verify everything works
6. `npm run erpnext:migrate` — sync existing data to ERPNext

### Daily Use

| Command | Description |
|--------|-------------|
| `npm run erpnext:start` | Start ERPNext |
| `npm run erpnext:stop` | Stop ERPNext |
| `npm run erpnext:logs` | View logs |
| `npm run erpnext:reset` | Reset all data (destructive) |

### Access ERPNext Directly

- **URL:** http://localhost:8080  
- **Username:** administrator  
- **Password:** admin123  
- **Do NOT use these defaults in production.**

### Troubleshooting

- **ERPNext won’t start:** Ensure Docker Desktop is running. Try `npm run erpnext:reset` then `npm run erpnext:start`.
- **API connection fails:** Run `npm run erpnext:setup` (regenerates API keys), then `npm run erpnext:test`.

---

## License

Proprietary — Ezana Group.
