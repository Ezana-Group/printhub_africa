#!/bin/sh

# PrintHub Startup Script
# Run migrations before starting the application
echo "Running database migrations..."
npx prisma migrate deploy --schema prisma/schema.prisma

echo "Starting Next.js server..."
node server.js
