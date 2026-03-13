-- CreateEnum
CREATE TYPE "QuoteClosedBy" AS ENUM ('CUSTOMER', 'STAFF', 'SYSTEM');

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "closedBy" "QuoteClosedBy",
ADD COLUMN     "closedReason" TEXT;
