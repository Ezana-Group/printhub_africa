-- Add missing auth fields that exist in schema.prisma but were never migrated

-- 1. Add lastLoginIp to User table (if it doesn't exist)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginIp" TEXT;

-- 2. Create AdminSession table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS "AdminSession" (
    "id"           TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "ipAddress"    TEXT,
    "userAgent"    TEXT,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt"    TIMESTAMP(3) NOT NULL,
    "revokedAt"    TIMESTAMP(3),
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- Unique index on sessionToken
CREATE UNIQUE INDEX IF NOT EXISTS "AdminSession_sessionToken_key" ON "AdminSession"("sessionToken");

-- Foreign key constraint
ALTER TABLE "AdminSession"
    ADD CONSTRAINT "AdminSession_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes for AdminSession
CREATE INDEX IF NOT EXISTS "AdminSession_userId_idx" ON "AdminSession"("userId");
CREATE INDEX IF NOT EXISTS "AdminSession_sessionToken_idx" ON "AdminSession"("sessionToken");

-- 3. Create KnownAdminDevice table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS "KnownAdminDevice" (
    "id"          TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnownAdminDevice_pkey" PRIMARY KEY ("id")
);

-- Foreign key constraint
ALTER TABLE "KnownAdminDevice"
    ADD CONSTRAINT "KnownAdminDevice_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
