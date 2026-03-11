-- CreateEnum
CREATE TYPE "CatalogueLicense" AS ENUM ('CC0', 'CC_BY', 'CC_BY_SA', 'PARTNERSHIP', 'ORIGINAL');

-- CreateEnum
CREATE TYPE "CatalogueStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'LIVE', 'PAUSED', 'RETIRED');

-- CreateEnum
CREATE TYPE "PrintDifficulty" AS ENUM ('STANDARD', 'MODERATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "CatalogueSourceType" AS ENUM ('MANUAL', 'PRINTABLES', 'THINGIVERSE', 'PARTNER', 'ORIGINAL');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED');

-- AlterEnum
ALTER TYPE "OrderType" ADD VALUE 'POD';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "catalogueItemId" TEXT;

-- CreateTable
CREATE TABLE "CatalogueCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogueCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogueDesigner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT,
    "platform" TEXT,
    "profileUrl" TEXT,
    "licenseDefault" "CatalogueLicense" NOT NULL DEFAULT 'CC_BY',
    "isPartner" BOOLEAN NOT NULL DEFAULT false,
    "revenueSharePct" DOUBLE PRECISION,
    "paymentMethod" TEXT,
    "paymentDetails" TEXT,
    "totalEarnedKes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogueDesigner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogueItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortDescription" TEXT,
    "categoryId" TEXT NOT NULL,
    "tags" TEXT[],
    "designerId" TEXT,
    "sourceUrl" TEXT,
    "licenseType" "CatalogueLicense" NOT NULL,
    "designerCredit" TEXT,
    "stlFileUrl" TEXT,
    "stlFileName" TEXT,
    "stlFileSizeBytes" INTEGER,
    "weightGrams" DOUBLE PRECISION,
    "printTimeHours" DOUBLE PRECISION,
    "supportsRequired" BOOLEAN NOT NULL DEFAULT false,
    "printDifficulty" "PrintDifficulty" NOT NULL DEFAULT 'STANDARD',
    "buildVolumeX" DOUBLE PRECISION,
    "buildVolumeY" DOUBLE PRECISION,
    "buildVolumeZ" DOUBLE PRECISION,
    "basePriceKes" DOUBLE PRECISION,
    "priceOverrideKes" DOUBLE PRECISION,
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "maxQuantity" INTEGER NOT NULL DEFAULT 50,
    "status" "CatalogueStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isNewArrival" BOOLEAN NOT NULL DEFAULT false,
    "isStaffPick" BOOLEAN NOT NULL DEFAULT false,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "sourceType" "CatalogueSourceType" NOT NULL DEFAULT 'MANUAL',
    "externalId" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "addedBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectionReason" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogueItemMaterial" (
    "id" TEXT NOT NULL,
    "catalogueItemId" TEXT NOT NULL,
    "materialCode" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "availableColours" TEXT[],
    "priceModifierKes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CatalogueItemMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogueItemPhoto" (
    "id" TEXT NOT NULL,
    "catalogueItemId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CatalogueItemPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogueImportQueue" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designerName" TEXT,
    "licenseType" TEXT,
    "previewImageUrl" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "rawData" JSONB NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "importedItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogueImportQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogueCategory_slug_key" ON "CatalogueCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogueItem_slug_key" ON "CatalogueItem"("slug");

-- CreateIndex
CREATE INDEX "CatalogueItem_categoryId_idx" ON "CatalogueItem"("categoryId");

-- CreateIndex
CREATE INDEX "CatalogueItem_status_idx" ON "CatalogueItem"("status");

-- CreateIndex
CREATE INDEX "CatalogueItem_slug_idx" ON "CatalogueItem"("slug");

-- CreateIndex
CREATE INDEX "CatalogueItemMaterial_catalogueItemId_idx" ON "CatalogueItemMaterial"("catalogueItemId");

-- CreateIndex
CREATE INDEX "CatalogueItemPhoto_catalogueItemId_idx" ON "CatalogueItemPhoto"("catalogueItemId");

-- CreateIndex
CREATE INDEX "OrderItem_catalogueItemId_idx" ON "OrderItem"("catalogueItemId");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_catalogueItemId_fkey" FOREIGN KEY ("catalogueItemId") REFERENCES "CatalogueItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogueItem" ADD CONSTRAINT "CatalogueItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CatalogueCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogueItem" ADD CONSTRAINT "CatalogueItem_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "CatalogueDesigner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogueItemMaterial" ADD CONSTRAINT "CatalogueItemMaterial_catalogueItemId_fkey" FOREIGN KEY ("catalogueItemId") REFERENCES "CatalogueItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogueItemPhoto" ADD CONSTRAINT "CatalogueItemPhoto_catalogueItemId_fkey" FOREIGN KEY ("catalogueItemId") REFERENCES "CatalogueItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
