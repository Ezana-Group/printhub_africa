/*
  Warnings:

  - Added the required column `updatedAt` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "PaymentStatus" ADD VALUE 'AWAITING_CONFIRMATION';
ALTER TYPE "PaymentStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentStatus" TEXT,
ADD COLUMN     "pickupCode" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "manualReference" TEXT,
ADD COLUMN     "manualVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "manualVerifiedBy" TEXT,
ADD COLUMN     "mpesaCheckoutId" TEXT,
ADD COLUMN     "mpesaPhone" TEXT,
ADD COLUMN     "mpesaReceiptNo" TEXT,
ADD COLUMN     "paybillNumber" TEXT,
ADD COLUMN     "pesapalRef" TEXT,
ADD COLUMN     "pesapalStatus" TEXT,
ADD COLUMN     "pickupConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "pickupConfirmedBy" TEXT,
ADD COLUMN     "pickupNotes" TEXT,
ADD COLUMN     "proofFileId" TEXT,
ADD COLUMN     "tillNumber" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "SavedMpesaNumber" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "label" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedMpesaNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pesapalToken" TEXT NOT NULL,
    "last4" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "expiryMonth" INTEGER NOT NULL,
    "expiryYear" INTEGER NOT NULL,
    "holderName" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedMpesaNumber_userId_idx" ON "SavedMpesaNumber"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedMpesaNumber_userId_phone_key" ON "SavedMpesaNumber"("userId", "phone");

-- CreateIndex
CREATE INDEX "SavedCard_userId_idx" ON "SavedCard"("userId");

-- AddForeignKey
ALTER TABLE "SavedMpesaNumber" ADD CONSTRAINT "SavedMpesaNumber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedCard" ADD CONSTRAINT "SavedCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
