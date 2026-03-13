/*
  Warnings:

  - Made the column `ticketNumber` on table `SupportTicket` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "PaymentProvider" ADD VALUE 'AIRTEL_MONEY';

-- DropForeignKey
ALTER TABLE "SupportTicket" DROP CONSTRAINT "SupportTicket_userId_fkey";

-- DropForeignKey
ALTER TABLE "TicketMessage" DROP CONSTRAINT "TicketMessage_senderId_fkey";

-- AlterTable
ALTER TABLE "Cart" ALTER COLUMN "lastActivityAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "CorporateInvite" ALTER COLUMN "token" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SupportTicket" ALTER COLUMN "ticketNumber" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
