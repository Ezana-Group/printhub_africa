-- Internal email system (Cloudflare Email Routing → Resend inbound)

-- CreateEnum
CREATE TYPE "EmailDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "ThreadStatus" AS ENUM ('OPEN', 'CLOSED', 'SPAM');

-- CreateTable
CREATE TABLE "EmailAddress" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailThread" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "label" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "customerName" TEXT,
    "customerEmail" TEXT NOT NULL,
    "mailboxId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "hasUnread" BOOLEAN NOT NULL DEFAULT true,
    "status" "ThreadStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "EmailThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Email" (
    "id" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "threadId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "direction" "EmailDirection" NOT NULL,
    "resendMessageId" TEXT,
    "bodyText" TEXT,
    "bodyHtml" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "cc" TEXT,
    "toAddress" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "attachments" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailAddress_address_key" ON "EmailAddress"("address");

-- CreateIndex
CREATE INDEX "EmailThread_mailboxId_idx" ON "EmailThread"("mailboxId");

-- CreateIndex
CREATE INDEX "EmailThread_customerEmail_idx" ON "EmailThread"("customerEmail");

-- CreateIndex
CREATE INDEX "EmailThread_status_idx" ON "EmailThread"("status");

-- CreateIndex
CREATE INDEX "EmailThread_assignedToId_idx" ON "EmailThread"("assignedToId");

-- CreateIndex
CREATE INDEX "EmailThread_updatedAt_idx" ON "EmailThread"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Email_resendMessageId_key" ON "Email"("resendMessageId");

-- AddForeignKey
ALTER TABLE "EmailThread" ADD CONSTRAINT "EmailThread_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailThread" ADD CONSTRAINT "EmailThread_mailboxId_fkey"
  FOREIGN KEY ("mailboxId") REFERENCES "EmailAddress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailThread" ADD CONSTRAINT "EmailThread_assignedToId_fkey"
  FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_threadId_fkey"
  FOREIGN KEY ("threadId") REFERENCES "EmailThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

