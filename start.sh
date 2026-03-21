#!/bin/sh
set -e
echo "Running database migrations..."
./node_modules/.bin/prisma migrate deploy
echo "Running production seed..."
./node_modules/.bin/tsx prisma/seed-production.ts || echo "⚠️ Seed skipped (missing env vars or already seeded)"
echo "Starting Next.js server..."
node server.js
