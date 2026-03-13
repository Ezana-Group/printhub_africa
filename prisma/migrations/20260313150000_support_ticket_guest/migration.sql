-- SupportTicket: make userId optional, add ticketNumber, guest fields, assignedTo, resolvedAt, closedAt
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "ticketNumber" TEXT;
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "guestEmail" TEXT;
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "guestName" TEXT;
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "guestPhone" TEXT;
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "assignedTo" TEXT;
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3);
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3);
ALTER TABLE "SupportTicket" ALTER COLUMN "userId" DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber") WHERE "ticketNumber" IS NOT NULL;

-- Backfill ticketNumber for existing rows (optional - use id slice if null)
-- UPDATE "SupportTicket" SET "ticketNumber" = 'TKT-' || LPAD((ROW_NUMBER() OVER ())::text, 5, '0') WHERE "ticketNumber" IS NULL;

-- TicketMessage: senderId optional, isInternal
ALTER TABLE "TicketMessage" ADD COLUMN IF NOT EXISTS "isInternal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TicketMessage" ALTER COLUMN "message" SET DATA TYPE TEXT;
ALTER TABLE "TicketMessage" ALTER COLUMN "senderId" DROP NOT NULL;
