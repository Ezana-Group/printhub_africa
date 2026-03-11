/*
  Warnings:

  - Made the column `senderId` on table `TicketMessage` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "BulkQuote" DROP CONSTRAINT "BulkQuote_assignedTo_fkey";

-- DropForeignKey
ALTER TABLE "BulkQuote" DROP CONSTRAINT "BulkQuote_corporateId_fkey";

-- DropForeignKey
ALTER TABLE "CouponUsage" DROP CONSTRAINT "CouponUsage_orderId_fkey";

-- DropForeignKey
ALTER TABLE "LFStockItem" DROP CONSTRAINT "LFStockItem_printerAssetId_fkey";

-- DropForeignKey
ALTER TABLE "ProductionQueue" DROP CONSTRAINT "ProductionQueue_machineId_fkey";

-- DropForeignKey
ALTER TABLE "ProductionQueue" DROP CONSTRAINT "ProductionQueue_orderId_fkey";

-- DropForeignKey
ALTER TABLE "TicketMessage" DROP CONSTRAINT "TicketMessage_senderId_fkey";

-- DropIndex
DROP INDEX "MpesaTransaction_mpesaReceiptNumber_key";

-- DropIndex
DROP INDEX "ProductionQueue_machineId_idx";

-- DropIndex
DROP INDEX "ProductionQueue_orderId_idx";

-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN     "variantId" TEXT;

-- AlterTable
ALTER TABLE "MpesaTransaction" ALTER COLUMN "transactionDate" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "variantId" TEXT;

-- AlterTable
ALTER TABLE "ThreeDConsumable" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "TicketMessage" ALTER COLUMN "senderId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
