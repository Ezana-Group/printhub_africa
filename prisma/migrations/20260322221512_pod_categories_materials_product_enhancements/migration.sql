/*
  Warnings:

  - You are about to drop the column `approvedBy` on the `CatalogueItem` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedBy` on the `CatalogueItem` table. All the data in the column will be lost.
  - You are about to drop the `CatalogueCategory` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[productId]` on the table `CatalogueItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[catalogueItemId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ImportPlatform" AS ENUM ('THINGIVERSE', 'MYMINIFACTORY', 'CGTRADER', 'PRINTABLES', 'CULTS3D', 'CREAZILLA', 'THANGS', 'OTHER');

-- CreateEnum
CREATE TYPE "ProductAvailability" AS ENUM ('IN_STOCK', 'ON_ORDER', 'PRE_ORDER', 'IMPORT_ON_REQUEST', 'PRINT_ON_DEMAND');

-- CreateEnum
CREATE TYPE "CartItemType" AS ENUM ('PRINT_SERVICE', 'HARDWARE', 'HARDWARE_DEPOSIT', 'BUNDLE');

-- CreateEnum
CREATE TYPE "DemoStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HardwareProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED', 'COMING_SOON');

-- CreateEnum
CREATE TYPE "ImportMethod" AS ENUM ('EXCEL', 'CSV', 'API', 'MANUAL');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT', 'RESERVED', 'UNRESERVED', 'ADJUSTMENT', 'RETURN', 'DAMAGED', 'SOLD');

-- CreateEnum
CREATE TYPE "SupplierApiType" AS ENUM ('REST', 'EDI', 'FTP_CSV', 'FTP_XML', 'NONE');

-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('MANUFACTURER', 'DISTRIBUTOR', 'IMPORTER', 'DEALER');

-- CreateEnum
CREATE TYPE "WarrantyStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CLAIMED', 'VOID');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CatalogueSourceType" ADD VALUE 'MYMINIFACTORY';
ALTER TYPE "CatalogueSourceType" ADD VALUE 'CGTRADER';
ALTER TYPE "CatalogueSourceType" ADD VALUE 'CULTS3D';
ALTER TYPE "CatalogueSourceType" ADD VALUE 'CREAZILLA';
ALTER TYPE "CatalogueSourceType" ADD VALUE 'THANGS';
ALTER TYPE "CatalogueSourceType" ADD VALUE 'OTHER';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CatalogueStatus" ADD VALUE 'REJECTED';
ALTER TYPE "CatalogueStatus" ADD VALUE 'ARCHIVED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ImportStatus" ADD VALUE 'PENDING_REVIEW';
ALTER TYPE "ImportStatus" ADD VALUE 'APPROVED';
ALTER TYPE "ImportStatus" ADD VALUE 'REJECTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProductType" ADD VALUE 'PRINT_ON_DEMAND';
ALTER TYPE "ProductType" ADD VALUE 'SERVICE';
ALTER TYPE "ProductType" ADD VALUE 'POD';

-- DropForeignKey
ALTER TABLE "CatalogueItem" DROP CONSTRAINT "CatalogueItem_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "EmailThread" DROP CONSTRAINT "EmailThread_createdById_fkey";

-- AlterTable
ALTER TABLE "BusinessSettings" ADD COLUMN     "foundingDate" TIMESTAMP(3),
ADD COLUMN     "showStatsClients" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showStatsExperience" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showStatsMachines" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showStatsOrders" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showStatsStaff" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "statsClientsThreshold" INTEGER DEFAULT 500,
ADD COLUMN     "statsOrdersThreshold" INTEGER DEFAULT 1000;

-- AlterTable
ALTER TABLE "CatalogueItem" DROP COLUMN "approvedBy",
DROP COLUMN "rejectedBy",
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "archivedById" TEXT,
ADD COLUMN     "importedById" TEXT,
ADD COLUMN     "modelStorageKey" TEXT,
ADD COLUMN     "modelUrl" TEXT,
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "rejectedById" TEXT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "showInNav" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "DeliveryZone" ADD COLUMN     "hardwareRatePerKg" DOUBLE PRECISION DEFAULT 50;

-- AlterTable
ALTER TABLE "EmailThread" ALTER COLUMN "createdById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN     "reservedQuantity" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "isDepositPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "outstandingBalance" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "addInstallation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "depositAmount" DECIMAL(10,2),
ADD COLUMN     "hardwareProductId" TEXT,
ADD COLUMN     "hardwareVariantId" TEXT,
ADD COLUMN     "isDeposit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "itemType" "CartItemType" NOT NULL DEFAULT 'PRINT_SERVICE';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "availability" "ProductAvailability" NOT NULL DEFAULT 'IN_STOCK',
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "catalogueItemId" TEXT,
ADD COLUMN     "compatibility" TEXT,
ADD COLUMN     "dimensionDiagramUrl" TEXT,
ADD COLUMN     "filamentWeightGrams" DOUBLE PRECISION,
ADD COLUMN     "isPOD" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "materialType" TEXT,
ADD COLUMN     "printTimeEstimate" TEXT,
ADD COLUMN     "soldThisMonth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "specifications" JSONB,
ALTER COLUMN "stock" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Refund" ADD COLUMN     "providerRefReference" TEXT;

-- AlterTable
ALTER TABLE "ShippingSettings" ADD COLUMN     "hardwareBaseFee" INTEGER DEFAULT 500,
ADD COLUMN     "hardwareFreeThreshold" INTEGER DEFAULT 500000;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "displayName" TEXT;

-- DropTable
DROP TABLE "CatalogueCategory";

-- CreateTable
CREATE TABLE "ProductPrintMaterial" (
    "productId" TEXT NOT NULL,
    "consumableId" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProductPrintMaterial_pkey" PRIMARY KEY ("productId","consumableId")
);

-- CreateTable
CREATE TABLE "FilamentColor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hexCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FilamentColor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductFilamentColor" (
    "productId" TEXT NOT NULL,
    "filamentColorId" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProductFilamentColor_pkey" PRIMARY KEY ("productId","filamentColorId")
);

-- CreateTable
CREATE TABLE "PrinterMaterialType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrinterMaterialType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalModel" (
    "id" TEXT NOT NULL,
    "platform" "ImportPlatform" NOT NULL,
    "externalId" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "printInfo" TEXT,
    "imageUrls" TEXT[],
    "thumbnailUrl" TEXT,
    "licenceType" TEXT NOT NULL,
    "licenceVerified" BOOLEAN NOT NULL DEFAULT false,
    "designerName" TEXT,
    "designerUrl" TEXT,
    "tags" TEXT[],
    "category" TEXT,
    "categoryId" TEXT,
    "rawData" JSONB,
    "importedBy" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "notes" TEXT,
    "productId" TEXT,

    CONSTRAINT "ExternalModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportLog" (
    "id" TEXT NOT NULL,
    "platform" "ImportPlatform" NOT NULL,
    "trigger" TEXT NOT NULL,
    "searchTerm" TEXT,
    "sourceUrl" TEXT,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triggeredBy" TEXT NOT NULL,

    CONSTRAINT "ImportLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupRecord" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "sizeBytes" BIGINT,
    "status" TEXT NOT NULL,
    "r2Key" TEXT,
    "filename" TEXT NOT NULL,
    "errorMsg" TEXT,

    CONSTRAINT "BackupRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoBooking" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "company" TEXT,
    "preferredDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "status" "DemoStatus" NOT NULL DEFAULT 'PENDING',
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemoBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HardwareBundle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "retailPrice" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HardwareBundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HardwareBundleItem" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "HardwareBundleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HardwareCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HardwareCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HardwareProduct" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "supplierId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sku" TEXT,
    "barcode" TEXT,
    "mpn" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "shortDescription" TEXT,
    "description" TEXT,
    "specifications" JSONB,
    "imageUrls" TEXT[],
    "thumbnailUrl" TEXT,
    "videoUrl" TEXT,
    "brochureUrl" TEXT,
    "costPrice" DECIMAL(12,2),
    "retailPrice" DECIMAL(12,2) NOT NULL,
    "salePrice" DECIMAL(12,2),
    "vatIncluded" BOOLEAN NOT NULL DEFAULT true,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "stockQty" INTEGER NOT NULL DEFAULT 0,
    "reservedQty" INTEGER NOT NULL DEFAULT 0,
    "reorderPoint" INTEGER NOT NULL DEFAULT 1,
    "reorderQty" INTEGER NOT NULL DEFAULT 1,
    "warehouseLocation" TEXT,
    "weightKg" DECIMAL(8,2),
    "dimensionsCm" JSONB,
    "requiresFreight" BOOLEAN NOT NULL DEFAULT false,
    "installationAvailable" BOOLEAN NOT NULL DEFAULT false,
    "installationPriceKES" DECIMAL(10,2),
    "warrantyMonths" INTEGER,
    "warrantyProvider" TEXT,
    "warrantyNotes" TEXT,
    "allowDeposit" BOOLEAN NOT NULL DEFAULT false,
    "depositPercent" DECIMAL(5,2),
    "allowInstalment" BOOLEAN NOT NULL DEFAULT false,
    "instalmentNote" TEXT,
    "allowBookDemo" BOOLEAN NOT NULL DEFAULT false,
    "demoNote" TEXT,
    "tags" TEXT[],
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "status" "HardwareProductStatus" NOT NULL DEFAULT 'DRAFT',
    "importLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HardwareProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HardwareVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "priceDiff" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "stockQty" INTEGER NOT NULL DEFAULT 0,
    "attributes" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "reservedQty" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "HardwareVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavigationItem" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NavigationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "qty" INTEGER NOT NULL,
    "reason" TEXT,
    "reference" TEXT,
    "performedBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "SupplierType" NOT NULL,
    "country" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "website" TEXT,
    "apiType" "SupplierApiType",
    "apiEndpoint" TEXT,
    "apiKeyEncrypted" TEXT,
    "apiNotes" TEXT,
    "importTemplate" JSONB,
    "leadTimeDays" INTEGER,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAuthorised" BOOLEAN NOT NULL DEFAULT false,
    "dealerAgreementUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierImportLog" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "method" "ImportMethod" NOT NULL,
    "fileName" TEXT,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "imported" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "columnMapping" JSONB,
    "triggeredBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierImportLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarrantyRecord" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "orderId" TEXT,
    "customerId" TEXT NOT NULL,
    "serialNumber" TEXT,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "warrantyEndsAt" TIMESTAMP(3) NOT NULL,
    "status" "WarrantyStatus" NOT NULL DEFAULT 'ACTIVE',
    "claimHistory" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarrantyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductPrintMaterial_consumableId_idx" ON "ProductPrintMaterial"("consumableId");

-- CreateIndex
CREATE INDEX "ProductFilamentColor_filamentColorId_idx" ON "ProductFilamentColor"("filamentColorId");

-- CreateIndex
CREATE UNIQUE INDEX "PrinterMaterialType_slug_key" ON "PrinterMaterialType"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalModel_productId_key" ON "ExternalModel"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalModel_platform_externalId_key" ON "ExternalModel"("platform", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalModel_platform_sourceUrl_key" ON "ExternalModel"("platform", "sourceUrl");

-- CreateIndex
CREATE UNIQUE INDEX "HardwareBundle_slug_key" ON "HardwareBundle"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "HardwareCategory_slug_key" ON "HardwareCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "HardwareProduct_slug_key" ON "HardwareProduct"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "HardwareProduct_sku_key" ON "HardwareProduct"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "HardwareVariant_sku_key" ON "HardwareVariant"("sku");

-- CreateIndex
CREATE INDEX "NavigationItem_parentId_idx" ON "NavigationItem"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_slug_key" ON "Supplier"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogueItem_productId_key" ON "CatalogueItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_catalogueItemId_key" ON "Product"("catalogueItemId");

-- CreateIndex
CREATE INDEX "Product_isPOD_idx" ON "Product"("isPOD");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_catalogueItemId_fkey" FOREIGN KEY ("catalogueItemId") REFERENCES "CatalogueItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPrintMaterial" ADD CONSTRAINT "ProductPrintMaterial_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPrintMaterial" ADD CONSTRAINT "ProductPrintMaterial_consumableId_fkey" FOREIGN KEY ("consumableId") REFERENCES "ThreeDConsumable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFilamentColor" ADD CONSTRAINT "ProductFilamentColor_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFilamentColor" ADD CONSTRAINT "ProductFilamentColor_filamentColorId_fkey" FOREIGN KEY ("filamentColorId") REFERENCES "FilamentColor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_hardwareProductId_fkey" FOREIGN KEY ("hardwareProductId") REFERENCES "HardwareProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogueItem" ADD CONSTRAINT "CatalogueItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogueItem" ADD CONSTRAINT "CatalogueItem_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogueItem" ADD CONSTRAINT "CatalogueItem_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogueItem" ADD CONSTRAINT "CatalogueItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogueItem" ADD CONSTRAINT "CatalogueItem_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogueItem" ADD CONSTRAINT "CatalogueItem_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailThread" ADD CONSTRAINT "EmailThread_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalModel" ADD CONSTRAINT "ExternalModel_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalModel" ADD CONSTRAINT "ExternalModel_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupRecord" ADD CONSTRAINT "BackupRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwareBundleItem" ADD CONSTRAINT "HardwareBundleItem_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "HardwareBundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwareBundleItem" ADD CONSTRAINT "HardwareBundleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "HardwareProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwareCategory" ADD CONSTRAINT "HardwareCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "HardwareCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwareProduct" ADD CONSTRAINT "HardwareProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "HardwareCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwareProduct" ADD CONSTRAINT "HardwareProduct_importLogId_fkey" FOREIGN KEY ("importLogId") REFERENCES "SupplierImportLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwareProduct" ADD CONSTRAINT "HardwareProduct_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwareVariant" ADD CONSTRAINT "HardwareVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "HardwareProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NavigationItem" ADD CONSTRAINT "NavigationItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "NavigationItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "HardwareProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierImportLog" ADD CONSTRAINT "SupplierImportLog_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyRecord" ADD CONSTRAINT "WarrantyRecord_productId_fkey" FOREIGN KEY ("productId") REFERENCES "HardwareProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
