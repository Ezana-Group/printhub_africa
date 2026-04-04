#!/bin/sh
set -e
echo "Running database migrations..."
if [ -n "$DATABASE_URL_UNPOOLED" ]; then
  echo "Using unpooled connection for migrations..."
  DATABASE_URL="$DATABASE_URL_UNPOOLED" ./node_modules/.bin/prisma migrate deploy
else
  echo "⚠️ DATABASE_URL_UNPOOLED not found, falling back to pooled connection..."
  ./node_modules/.bin/prisma migrate deploy
fi

echo "Running production seed..."
if [ -n "$DATABASE_URL_UNPOOLED" ]; then
  DATABASE_URL="$DATABASE_URL_UNPOOLED" ./node_modules/.bin/tsx prisma/seed-production.ts || echo "⚠️ Seed skipped (missing env vars or already seeded)"
else
  ./node_modules/.bin/tsx prisma/seed-production.ts || echo "⚠️ Seed skipped (missing env vars or already seeded)"
fi
echo "Starting Next.js server..."
node server.js
