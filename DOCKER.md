# Docker — PrintHub

Use Docker where appropriate: **PostgreSQL** for all environments, and optionally the **Next.js app** for consistent runs.

---

## 1. Database only (recommended for local dev)

Run PostgreSQL in Docker; run the app on your host so you get hot reload and fast iteration.

```bash
# Start PostgreSQL
docker compose up -d db

# From project root, point to the containerized DB (create .env.local if needed)
export DATABASE_URL="postgresql://user:password@localhost:5432/printhub?schema=public"

# Apply migrations and seed (first time, or after schema changes)
npx prisma migrate deploy
npm run db:seed

# Run the app locally
npm run dev
```

Your `.env.local` should include:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/printhub?schema=public"
```

This fixes **ECONNREFUSED** when the DB isn’t running: start `db` with Docker and use the URL above.

---

## 2. Full stack (DB + app in Docker)

Run both the database and the Next.js app in containers.

```bash
# Start DB and wait for it to be healthy
docker compose up -d db

# One-time: run migrations (from host, with Node/Prisma installed)
DATABASE_URL="postgresql://user:password@localhost:5432/printhub?schema=public" npx prisma migrate deploy
npm run db:seed   # optional

# Build and start the app container
docker compose up -d app
```

App will be at **http://localhost:3000**. The app image uses Next.js `standalone` output.

To rebuild the app after code changes:

```bash
docker compose up -d --build app
```

---

## 3. Production-style build

Build the app image and run the stack (e.g. for staging or production-like runs):

```bash
docker compose up -d db
# Migrate and seed as above, then:
docker compose build app
docker compose up -d app
```

Override env for production (e.g. real `NEXTAUTH_URL`, `NEXTAUTH_SECRET`) via `.env` or `docker compose` env files.

---

## 4. Useful commands

| Task | Command |
|------|--------|
| Start DB only | `docker compose up -d db` |
| Start DB + app | `docker compose up -d` |
| View logs | `docker compose logs -f app` or `docker compose logs -f db` |
| Stop all | `docker compose down` |
| Stop and remove DB volume | `docker compose down -v` |
| Rebuild app image | `docker compose build --no-cache app` |

---

## 5. When to use what

- **Local development:** Use **§1 (DB only)**. App runs with `npm run dev` on your machine; DB runs in Docker so you don’t need a local PostgreSQL install.
- **CI / preview / “run the whole thing”:** Use **§2 or §3** so the same stack runs everywhere.
- **Production:** Typically you’d deploy the built app (e.g. from this Dockerfile) to your host or PaaS and point `DATABASE_URL` at your managed PostgreSQL; you can still use this Dockerfile as the production image.

---

## 6. Troubleshooting

- **ECONNREFUSED on Prisma:** Start the DB: `docker compose up -d db`. Ensure `DATABASE_URL` in `.env.local` uses `localhost:5432` when the app runs on the host, or `db:5432` when the app runs in Docker.
- **App container exits:** Check logs: `docker compose logs app`. Usually migration not applied: run `npx prisma migrate deploy` from the host (with `DATABASE_URL` set) then `docker compose up -d app` again.
- **Port 5432 or 3000 in use:** Change the host port in `docker-compose.yml` (e.g. `"5433:5432"` for DB).
