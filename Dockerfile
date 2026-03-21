# PrintHub — printhub.africa | An Ezana Group Company
# Multi-stage Dockerfile for Next.js app

# ============== Stage 1: Dependencies ==============
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ============== Stage 2: Builder ==============
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma generate (needs schema; use dummy URL for build only — real URL at runtime)
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
ENV DATABASE_URL_UNPOOLED="postgresql://build:build@localhost:5432/build?schema=public"
RUN npx prisma generate

# Build Next.js (disable telemetry)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ============== Stage 3: Runner ==============
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built app (standalone includes server.js and traced deps)
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/start.sh ./start.sh
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Install prisma CLI and tsx for migrations & seeding at runtime
COPY --from=deps /app/node_modules/prisma ./node_modules/prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/tsx ./node_modules/tsx
COPY --from=deps /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=deps /app/node_modules/esbuild ./node_modules/esbuild
COPY --from=deps /app/node_modules/get-tsconfig ./node_modules/get-tsconfig
COPY --from=deps /app/node_modules/resolve-pkg-maps ./node_modules/resolve-pkg-maps
COPY --from=deps /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=deps /app/node_modules/.bin/tsx ./node_modules/.bin/tsx

# Make start script executable
USER root
RUN chmod +x ./start.sh
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["./start.sh"]

