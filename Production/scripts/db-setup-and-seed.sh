#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."

echo "Starting PostgreSQL (Docker)..."
docker compose up -d db

echo "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if docker compose exec -T db pg_isready -U user -d printhub >/dev/null 2>&1; then
    echo "PostgreSQL is ready."
    break
  fi
  if [[ $i -eq 30 ]]; then
    echo "Timeout waiting for PostgreSQL."
    exit 1
  fi
  sleep 1
done

echo "Running migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npm run db:seed

echo "Done. Database is up and seeded."
