-- CreateEnum
CREATE TYPE "CatalogueStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'LIVE', 'PAUSED', 'RETIRED');

-- CreateEnum
CREATE TYPE "CatalogueSourceType" AS ENUM ('MANUAL', 'PRINTABLES', 'THINGIVERSE', 'PARTNER', 'ORIGINAL');

-- CreateEnum
CREATE TYPE "CatalogueLicense" AS ENUM ('CC0', 'CC_BY', 'CC_BY_SA', 'PARTNERSHIP', 'ORIGINAL');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'READY_FOR_COLLECTION';

-- CreateTable
CREATE TABLE "OrderTrackingEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "location" TEXT,
    "courierRef" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderTrackingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessSettings" (
    "id" TEXT NOT NULL,
    "businessName" TEXT,
    "tradingName" TEXT,
    "tagline" TEXT,
    "website" TEXT,
    "favicon" TEXT,
    "primaryPhone" TEXT,
    "whatsapp" TEXT,
    "primaryEmail" TEXT,
    "supportEmail" TEXT,
    "financeEmail" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "county" TEXT,
    "country" TEXT,
    "googleMapsUrl" TEXT,
    "businessHours" TEXT,
    "socialFacebook" TEXT,
    "socialInstagram" TEXT,
    "socialTwitter" TEXT,
    "socialLinkedIn" TEXT,
    "socialTikTok" TEXT,
    "socialYouTube" TEXT,
    "invoicePrefix" TEXT,
    "invoiceNotes" TEXT,
    "invoiceFooter" TEXT,
    "vatOnInvoices" BOOLEAN,
    "paymentTermsDays" INTEGER,
    "mpesaEnabled" BOOLEAN,
    "pesapalEnabled" BOOLEAN,
    "flutterwaveEnabled" BOOLEAN,
    "stripeEnabled" BOOLEAN,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoSettings" (
    "id" TEXT NOT NULL,
    "siteName" TEXT,
    "titleTemplate" TEXT,
    "defaultTitle" TEXT,
    "defaultDescription" TEXT,
    "ogImageUrl" TEXT,
    "twitterHandle" TEXT,
    "sitemapGeneratedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingSettings" (
    "id" TEXT NOT NULL,
    "freeShippingEnabled" BOOLEAN DEFAULT false,
    "freeShippingThresholdKes" INTEGER,
    "expressEnabled" BOOLEAN DEFAULT false,
    "clickCollectEnabled" BOOLEAN DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltySettings" (
    "id" TEXT NOT NULL,
    "bonusRules" JSONB,
    "tiers" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralSettings" (
    "id" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountSettings" (
    "id" TEXT NOT NULL,
    "volumeDiscountTiers" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "pendingFactoryReset" BOOLEAN DEFAULT false,
    "factoryResetExecuteAt" TIMESTAMP(3),
    "factoryResetInitiatedBy" TEXT,
    "quoteCounter" INTEGER DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaqCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FaqCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastUpdated" TIMESTAMP(3),
    "updatedBy" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LegalPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalPageHistory" (
    "id" TEXT NOT NULL,
    "legalPageId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "savedBy" TEXT,
    "changeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalPageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogueCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CatalogueCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogueDesigner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,

    CONSTRAINT "CatalogueDesigner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogueItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "designerId" TEXT,
    "tags" TEXT[],
    "sourceUrl" TEXT,
    "licenseType" "CatalogueLicense" NOT NULL DEFAULT 'CC_BY',
    "designerCredit" TEXT,
    "sourceType" "CatalogueSourceType" NOT NULL DEFAULT 'MANUAL',
    "status" "CatalogueStatus" NOT NULL DEFAULT 'DRAFT',
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "maxQuantity" INTEGER NOT NULL DEFAULT 50,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isNewArrival" BOOLEAN NOT NULL DEFAULT false,
    "isStaffPick" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogueItemPhoto" (
    "id" TEXT NOT NULL,
    "catalogueItemId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CatalogueItemPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogueItemMaterial" (
    "id" TEXT NOT NULL,
    "catalogueItemId" TEXT NOT NULL,
    "materialCode" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "priceModifierKes" DOUBLE PRECISION DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CatalogueItemMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderTrackingEvent_orderId_idx" ON "OrderTrackingEvent"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "FaqCategory_slug_key" ON "FaqCategory"("slug");

-- CreateIndex
CREATE INDEX "FaqCategory_slug_idx" ON "FaqCategory"("slug");

-- CreateIndex
CREATE INDEX "Faq_categoryId_idx" ON "Faq"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "LegalPage_slug_key" ON "LegalPage"("slug");

-- CreateIndex
CREATE INDEX "LegalPage_slug_idx" ON "LegalPage"("slug");

-- CreateIndex
CREATE INDEX "LegalPageHistory_legalPageId_idx" ON "LegalPageHistory"("legalPageId");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogueCategory_slug_key" ON "CatalogueCategory"("slug");

-- CreateIndex
CREATE INDEX "CatalogueCategory_slug_idx" ON "CatalogueCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogueDesigner_slug_key" ON "CatalogueDesigner"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogueItem_slug_key" ON "CatalogueItem"("slug");

-- CreateIndex
CREATE INDEX "CatalogueItem_categoryId_idx" ON "CatalogueItem"("categoryId");

-- CreateIndex
CREATE INDEX "CatalogueItem_status_idx" ON "CatalogueItem"("status");

-- CreateIndex
CREATE INDEX "CatalogueItem_slug_idx" ON "CatalogueItem"("slug");

-- CreateIndex
CREATE INDEX "CatalogueItemPhoto_catalogueItemId_idx" ON "CatalogueItemPhoto"("catalogueItemId");

-- CreateIndex
CREATE INDEX "CatalogueItemMaterial_catalogueItemId_idx" ON "CatalogueItemMaterial"("catalogueItemId");

-- AddForeignKey
ALTER TABLE "OrderTrackingEvent" ADD CONSTRAINT "OrderTrackingEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faq" ADD CONSTRAINT "Faq_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FaqCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalPageHistory" ADD CONSTRAINT "LegalPageHistory_legalPageId_fkey" FOREIGN KEY ("legalPageId") REFERENCES "LegalPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogueItem" ADD CONSTRAINT "CatalogueItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CatalogueCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogueItem" ADD CONSTRAINT "CatalogueItem_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "CatalogueDesigner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogueItemPhoto" ADD CONSTRAINT "CatalogueItemPhoto_catalogueItemId_fkey" FOREIGN KEY ("catalogueItemId") REFERENCES "CatalogueItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogueItemMaterial" ADD CONSTRAINT "CatalogueItemMaterial_catalogueItemId_fkey" FOREIGN KEY ("catalogueItemId") REFERENCES "CatalogueItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
