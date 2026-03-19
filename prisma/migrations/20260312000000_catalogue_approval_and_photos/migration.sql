-- AlterTable CatalogueItem: add approval/rejection fields
ALTER TABLE "CatalogueItem" ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;
ALTER TABLE "CatalogueItem" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "CatalogueItem" ADD COLUMN IF NOT EXISTS "rejectedBy" TEXT;
ALTER TABLE "CatalogueItem" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

-- AlterTable CatalogueItemPhoto: add storageKey, altText, sourceUrl
ALTER TABLE "CatalogueItemPhoto" ADD COLUMN IF NOT EXISTS "storageKey" TEXT;
ALTER TABLE "CatalogueItemPhoto" ADD COLUMN IF NOT EXISTS "altText" TEXT;
ALTER TABLE "CatalogueItemPhoto" ADD COLUMN IF NOT EXISTS "sourceUrl" TEXT;
