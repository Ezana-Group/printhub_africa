# PrintHub — printhub.africa | An Ezana Group Company
# Multi-stage Dockerfile for Next.js app

# ============== Stage 1: Dependencies ==============
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN ls -la && npm ci

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

# Install prisma CLI + tsx + bcryptjs for migrations & seeding at runtime
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
RUN npm install --no-save prisma@7.5.0 @prisma/client@7.5.0 tsx bcryptjs

# Make start script executable
USER root
RUN chmod +x ./start.sh
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["./start.sh"]

