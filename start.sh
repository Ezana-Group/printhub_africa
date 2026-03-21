#!/bin/sh
set -e
echo "Running database migrations..."
npx prisma migrate deploy
echo "Running production seed..."
npx tsx prisma/seed-production.ts
echo "Starting Next.js server..."
node server.js
