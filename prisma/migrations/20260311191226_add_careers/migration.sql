/*
  Warnings:

  - The values [READY_FOR_COLLECTION] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [POD] on the enum `OrderType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `category` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `details` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `target` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `targetId` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `interviewDate` on the `JobApplication` table. All the data in the column will be lost.
  - You are about to drop the column `interviewNotes` on the `JobApplication` table. All the data in the column will be lost.
  - You are about to drop the column `rejectionReason` on the `JobApplication` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedAt` on the `JobApplication` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedBy` on the `JobApplication` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `JobListing` table. All the data in the column will be lost.
  - The `benefits` column on the `JobListing` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `catalogueItemId` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `colourHex` on the `ThreeDConsumable` table. All the data in the column will be lost.
  - You are about to drop the column `weightPerSpoolKg` on the `ThreeDConsumable` table. All the data in the column will be lost.
  - You are about to drop the column `anonymisedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `dateOfBirth` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isAnonymised` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `totpSecret` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `BusinessSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CatalogueCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CatalogueDesigner` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CatalogueImportQueue` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CatalogueItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CatalogueItemMaterial` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CatalogueItemPhoto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Courier` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DeliveryZone` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DiscountSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Faq` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FaqCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LegalPage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LegalPageHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LoyaltyAccount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LoyaltySettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LoyaltyTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrderTrackingEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReferralCode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReferralSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SavedAddress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SeoSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ShippingSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SystemSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ThreeDConsumableMovement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserNotificationPrefs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserPermission` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `UploadedFile` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UploadContext" AS ENUM ('CUSTOMER_3D_PRINT', 'CUSTOMER_LARGE_FORMAT', 'CUSTOMER_QUOTE', 'CUSTOMER_GENERAL', 'CUSTOMER_PAYMENT_PROOF', 'ADMIN_CATALOGUE_STL', 'ADMIN_CATALOGUE_PHOTO', 'ADMIN_PRODUCT_IMAGE', 'ADMIN_CATEGORY_IMAGE', 'ADMIN_LOGO', 'ADMIN_OG_IMAGE', 'USER_AVATAR', 'STAFF_AVATAR');

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'PRINTING', 'QUALITY_CHECK', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');
ALTER TABLE "public"."Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "OrderType_new" AS ENUM ('SHOP', 'CUSTOM_PRINT', 'LARGE_FORMAT', 'THREE_D_PRINT', 'QUOTE');
ALTER TABLE "Order" ALTER COLUMN "type" TYPE "OrderType_new" USING ("type"::text::"OrderType_new");
ALTER TYPE "OrderType" RENAME TO "OrderType_old";
ALTER TYPE "OrderType_new" RENAME TO "OrderType";
DROP TYPE "public"."OrderType_old";
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UploadedFileStatus" ADD VALUE 'UPLOADING';
ALTER TYPE "UploadedFileStatus" ADD VALUE 'VIRUS_SCANNING';
ALTER TYPE "UploadedFileStatus" ADD VALUE 'CLEAN';
ALTER TYPE "UploadedFileStatus" ADD VALUE 'INFECTED';
ALTER TYPE "UploadedFileStatus" ADD VALUE 'EXPIRED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UploadedFileType" ADD VALUE 'THREE_MF';
ALTER TYPE "UploadedFileType" ADD VALUE 'STEP';
ALTER TYPE "UploadedFileType" ADD VALUE 'EPS';
ALTER TYPE "UploadedFileType" ADD VALUE 'WEBP';
ALTER TYPE "UploadedFileType" ADD VALUE 'TIFF';
ALTER TYPE "UploadedFileType" ADD VALUE 'DOCX';
ALTER TYPE "UploadedFileType" ADD VALUE 'XLSX';
ALTER TYPE "UploadedFileType" ADD VALUE 'OTHER';

-- DropForeignKey
ALTER TABLE "CatalogueItem" DROP CONSTRAINT "CatalogueItem_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "CatalogueItem" DROP CONSTRAINT "CatalogueItem_designerId_fkey";

-- DropForeignKey
ALTER TABLE "CatalogueItemMaterial" DROP CONSTRAINT "CatalogueItemMaterial_catalogueItemId_fkey";

-- DropForeignKey
ALTER TABLE "CatalogueItemPhoto" DROP CONSTRAINT "CatalogueItemPhoto_catalogueItemId_fkey";

-- DropForeignKey
ALTER TABLE "Faq" DROP CONSTRAINT "Faq_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "LegalPageHistory" DROP CONSTRAINT "LegalPageHistory_legalPageId_fkey";

-- DropForeignKey
ALTER TABLE "LoyaltyAccount" DROP CONSTRAINT "LoyaltyAccount_userId_fkey";

-- DropForeignKey
ALTER TABLE "LoyaltyTransaction" DROP CONSTRAINT "LoyaltyTransaction_accountId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_catalogueItemId_fkey";

-- DropForeignKey
ALTER TABLE "OrderTrackingEvent" DROP CONSTRAINT "OrderTrackingEvent_orderId_fkey";

-- DropForeignKey
ALTER TABLE "ReferralCode" DROP CONSTRAINT "ReferralCode_userId_fkey";

-- DropForeignKey
ALTER TABLE "SavedAddress" DROP CONSTRAINT "SavedAddress_userId_fkey";

-- DropForeignKey
ALTER TABLE "ThreeDConsumableMovement" DROP CONSTRAINT "ThreeDConsumableMovement_consumableId_fkey";

-- DropForeignKey
ALTER TABLE "ThreeDConsumableMovement" DROP CONSTRAINT "ThreeDConsumableMovement_performedById_fkey";

-- DropForeignKey
ALTER TABLE "UploadedFile" DROP CONSTRAINT "UploadedFile_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserNotificationPrefs" DROP CONSTRAINT "UserNotificationPrefs_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserPermission" DROP CONSTRAINT "UserPermission_userId_fkey";

-- DropIndex
DROP INDEX "AuditLog_category_idx";

-- DropIndex
DROP INDEX "AuditLog_timestamp_idx";

-- DropIndex
DROP INDEX "OrderItem_catalogueItemId_idx";

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "category",
DROP COLUMN "details",
DROP COLUMN "target",
DROP COLUMN "targetId",
DROP COLUMN "userAgent";

-- AlterTable
ALTER TABLE "JobApplication" DROP COLUMN "interviewDate",
DROP COLUMN "interviewNotes",
DROP COLUMN "rejectionReason",
DROP COLUMN "reviewedAt",
DROP COLUMN "reviewedBy",
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "coverLetter" DROP NOT NULL,
ALTER COLUMN "cvFileUrl" DROP NOT NULL,
ALTER COLUMN "cvFileName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "JobListing" DROP COLUMN "createdBy",
DROP COLUMN "benefits",
ADD COLUMN     "benefits" JSONB;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "manualPaymentBy" TEXT,
ADD COLUMN     "manualPaymentNotes" TEXT,
ADD COLUMN     "manualPaymentRef" TEXT,
ADD COLUMN     "mpesaFailureReason" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentLinkExpiresAt" TIMESTAMP(3),
ADD COLUMN     "paymentLinkToken" TEXT,
ADD COLUMN     "shippedAt" TIMESTAMP(3),
ADD COLUMN     "trackingNumber" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "catalogueItemId";

-- AlterTable
ALTER TABLE "ThreeDConsumable" DROP COLUMN "colourHex",
DROP COLUMN "weightPerSpoolKg";

-- AlterTable
ALTER TABLE "UploadedFile" ADD COLUMN     "bucket" TEXT,
ADD COLUMN     "ext" TEXT,
ADD COLUMN     "folder" TEXT,
ADD COLUMN     "quoteId" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "storageKey" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "uploadContext" "UploadContext",
ADD COLUMN     "uploadedByAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "virusScanAt" TIMESTAMP(3),
ADD COLUMN     "virusScanStatus" TEXT,
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "url" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "anonymisedAt",
DROP COLUMN "dateOfBirth",
DROP COLUMN "isAnonymised",
DROP COLUMN "totpSecret";

-- DropTable
DROP TABLE "BusinessSettings";

-- DropTable
DROP TABLE "CatalogueCategory";

-- DropTable
DROP TABLE "CatalogueDesigner";

-- DropTable
DROP TABLE "CatalogueImportQueue";

-- DropTable
DROP TABLE "CatalogueItem";

-- DropTable
DROP TABLE "CatalogueItemMaterial";

-- DropTable
DROP TABLE "CatalogueItemPhoto";

-- DropTable
DROP TABLE "Courier";

-- DropTable
DROP TABLE "DeliveryZone";

-- DropTable
DROP TABLE "DiscountSettings";

-- DropTable
DROP TABLE "Faq";

-- DropTable
DROP TABLE "FaqCategory";

-- DropTable
DROP TABLE "LegalPage";

-- DropTable
DROP TABLE "LegalPageHistory";

-- DropTable
DROP TABLE "LoyaltyAccount";

-- DropTable
DROP TABLE "LoyaltySettings";

-- DropTable
DROP TABLE "LoyaltyTransaction";

-- DropTable
DROP TABLE "OrderTrackingEvent";

-- DropTable
DROP TABLE "ReferralCode";

-- DropTable
DROP TABLE "ReferralSettings";

-- DropTable
DROP TABLE "SavedAddress";

-- DropTable
DROP TABLE "SeoSettings";

-- DropTable
DROP TABLE "ShippingSettings";

-- DropTable
DROP TABLE "SystemSettings";

-- DropTable
DROP TABLE "ThreeDConsumableMovement";

-- DropTable
DROP TABLE "UserNotificationPrefs";

-- DropTable
DROP TABLE "UserPermission";

-- DropEnum
DROP TYPE "CatalogueLicense";

-- DropEnum
DROP TYPE "CatalogueSourceType";

-- DropEnum
DROP TYPE "CatalogueStatus";

-- DropEnum
DROP TYPE "ImportStatus";

-- DropEnum
DROP TYPE "PrintDifficulty";

-- CreateIndex
CREATE INDEX "JobApplication_email_idx" ON "JobApplication"("email");

-- AddForeignKey
ALTER TABLE "UploadedFile" ADD CONSTRAINT "UploadedFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadedFile" ADD CONSTRAINT "UploadedFile_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
