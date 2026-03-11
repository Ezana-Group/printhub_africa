-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "category" TEXT,
ADD COLUMN     "details" TEXT,
ADD COLUMN     "target" TEXT,
ADD COLUMN     "targetId" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "anonymisedAt" TIMESTAMP(3),
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "inviteToken" TEXT,
ADD COLUMN     "inviteTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "isAnonymised" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" TEXT DEFAULT 'ACTIVE',
ADD COLUMN     "totpSecret" TEXT;

-- CreateTable
CREATE TABLE "SeoSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "siteName" TEXT NOT NULL DEFAULT 'PrintHub',
    "siteTagline" TEXT,
    "metaTitleTemplate" TEXT NOT NULL DEFAULT '{page_title} | PrintHub Kenya',
    "defaultMetaDescription" TEXT,
    "googleVerification" TEXT,
    "bingVerification" TEXT,
    "canonicalDomain" TEXT NOT NULL DEFAULT 'https://printhub.africa',
    "twitterHandle" TEXT,
    "twitterCardType" TEXT NOT NULL DEFAULT 'summary_large_image',
    "defaultOgImageUrl" TEXT,
    "robotsTxt" TEXT,
    "sitemapIncludePages" BOOLEAN NOT NULL DEFAULT true,
    "sitemapIncludeProducts" BOOLEAN NOT NULL DEFAULT true,
    "sitemapIncludeBlog" BOOLEAN NOT NULL DEFAULT true,
    "sitemapIncludeCategories" BOOLEAN NOT NULL DEFAULT true,
    "sitemapLastGenerated" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltySettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "programmeName" TEXT NOT NULL DEFAULT 'PrintHub Points',
    "pointsCurrencyPlural" TEXT NOT NULL DEFAULT 'Points',
    "pointsCurrencySingular" TEXT NOT NULL DEFAULT 'Point',
    "pointsPerKesSpent" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "kesPerPointSpent" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "pointsRounding" TEXT NOT NULL DEFAULT 'down',
    "pointsValueKes" DOUBLE PRECISION NOT NULL DEFAULT 0.50,
    "minRedemptionPoints" INTEGER NOT NULL DEFAULT 200,
    "maxDiscountPct" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "pointsExpiryMonths" INTEGER NOT NULL DEFAULT 24,
    "tiersEnabled" BOOLEAN NOT NULL DEFAULT false,
    "bonusRules" JSONB NOT NULL DEFAULT '[]',
    "tiers" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pointsBalance" INTEGER NOT NULL DEFAULT 0,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "pointsRedeemed" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'BRONZE',
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyTransaction" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "referrerRewardType" TEXT NOT NULL DEFAULT 'CREDIT',
    "referrerRewardKes" DOUBLE PRECISION NOT NULL DEFAULT 300,
    "referrerRewardPoints" INTEGER NOT NULL DEFAULT 100,
    "refereeRewardType" TEXT NOT NULL DEFAULT 'PERCENT',
    "refereeRewardPct" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "refereeRewardKes" DOUBLE PRECISION NOT NULL DEFAULT 200,
    "minRefereeOrderKes" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "maxReferralsPerMonth" INTEGER NOT NULL DEFAULT 20,
    "rewardGrantedOn" TEXT NOT NULL DEFAULT 'PAYMENT_CLEARED',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "earnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "allowCouponStacking" BOOLEAN NOT NULL DEFAULT false,
    "allowCouponOnSale" BOOLEAN NOT NULL DEFAULT false,
    "maxDiscountPct" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "maxDiscountKes" DOUBLE PRECISION NOT NULL DEFAULT 5000,
    "autoApplyBestCoupon" BOOLEAN NOT NULL DEFAULT false,
    "saleBadgeMinPct" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "hotBadgeOrdersPerWeek" INTEGER NOT NULL DEFAULT 10,
    "newBadgeDays" INTEGER NOT NULL DEFAULT 30,
    "volumeDiscountTiers" JSONB NOT NULL DEFAULT '[]',
    "applyVolumeToShop" BOOLEAN NOT NULL DEFAULT true,
    "applyVolumeToLF" BOOLEAN NOT NULL DEFAULT true,
    "applyVolumeTo3D" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotificationPrefs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailOrderConfirmed" BOOLEAN NOT NULL DEFAULT true,
    "emailOrderShipped" BOOLEAN NOT NULL DEFAULT true,
    "emailOrderDelivered" BOOLEAN NOT NULL DEFAULT true,
    "emailOrderCancelled" BOOLEAN NOT NULL DEFAULT true,
    "smsOrderConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "smsOrderShipped" BOOLEAN NOT NULL DEFAULT true,
    "whatsappOrderUpdates" BOOLEAN NOT NULL DEFAULT false,
    "emailQuoteReady" BOOLEAN NOT NULL DEFAULT true,
    "emailQuoteExpiring" BOOLEAN NOT NULL DEFAULT true,
    "emailMarketing" BOOLEAN NOT NULL DEFAULT false,
    "emailLoyaltyUpdates" BOOLEAN NOT NULL DEFAULT true,
    "emailNewsletterWkly" BOOLEAN NOT NULL DEFAULT false,
    "emailLowStock" BOOLEAN NOT NULL DEFAULT true,
    "emailNewApplication" BOOLEAN NOT NULL DEFAULT true,
    "emailDailyDigest" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserNotificationPrefs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Home',
    "recipientName" TEXT,
    "phone" TEXT,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "quoteCounter" INTEGER NOT NULL DEFAULT 0,
    "pendingFactoryReset" BOOLEAN NOT NULL DEFAULT false,
    "factoryResetExecuteAt" TIMESTAMP(3),
    "factoryResetInitiatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "mpesaEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pesapalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "flutterwaveEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stripeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "invoicePrefix" TEXT NOT NULL DEFAULT 'INV',
    "invoiceNotes" TEXT,
    "invoiceFooter" TEXT,
    "vatOnInvoices" BOOLEAN NOT NULL DEFAULT true,
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 30,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "freeShippingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "freeShippingThresholdKes" DOUBLE PRECISION,
    "expressEnabled" BOOLEAN NOT NULL DEFAULT false,
    "clickCollectEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "counties" TEXT[],
    "feeKes" DOUBLE PRECISION NOT NULL,
    "minDays" INTEGER NOT NULL DEFAULT 3,
    "maxDays" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryZone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyAccount_userId_key" ON "LoyaltyAccount"("userId");

-- CreateIndex
CREATE INDEX "LoyaltyAccount_userId_idx" ON "LoyaltyAccount"("userId");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_accountId_idx" ON "LoyaltyTransaction"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_userId_key" ON "ReferralCode"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_code_key" ON "ReferralCode"("code");

-- CreateIndex
CREATE INDEX "ReferralCode_userId_idx" ON "ReferralCode"("userId");

-- CreateIndex
CREATE INDEX "UserPermission_userId_idx" ON "UserPermission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_permission_key" ON "UserPermission"("userId", "permission");

-- CreateIndex
CREATE UNIQUE INDEX "UserNotificationPrefs_userId_key" ON "UserNotificationPrefs"("userId");

-- CreateIndex
CREATE INDEX "SavedAddress_userId_idx" ON "SavedAddress"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_category_idx" ON "AuditLog"("category");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- AddForeignKey
ALTER TABLE "LoyaltyAccount" ADD CONSTRAINT "LoyaltyAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LoyaltyAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCode" ADD CONSTRAINT "ReferralCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotificationPrefs" ADD CONSTRAINT "UserNotificationPrefs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedAddress" ADD CONSTRAINT "SavedAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
