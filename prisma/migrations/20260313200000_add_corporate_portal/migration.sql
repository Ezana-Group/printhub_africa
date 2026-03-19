-- AlterEnum: Add new values to PaymentTerms
ALTER TYPE "PaymentTerms" ADD VALUE IF NOT EXISTS 'ON_DELIVERY';
ALTER TYPE "PaymentTerms" ADD VALUE IF NOT EXISTS 'NET_14';

-- CreateEnum
CREATE TYPE "CorporateIndustry" AS ENUM ('ADVERTISING_MARKETING', 'ARCHITECTURE_CONSTRUCTION', 'EDUCATION', 'EVENTS_HOSPITALITY', 'FINANCIAL_SERVICES', 'GOVERNMENT', 'HEALTHCARE', 'LOGISTICS_TRANSPORT', 'MANUFACTURING', 'NGO_NONPROFIT', 'REAL_ESTATE', 'RETAIL_ECOMMERCE', 'TECHNOLOGY', 'MEDIA_PUBLISHING', 'OTHER');

CREATE TYPE "CompanySize" AS ENUM ('SOLO', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE');

CREATE TYPE "CorporateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'CLOSED');

CREATE TYPE "CorporateTier" AS ENUM ('STANDARD', 'SILVER', 'GOLD', 'PLATINUM');

CREATE TYPE "CorporateRole" AS ENUM ('OWNER', 'ADMIN', 'FINANCE', 'MEMBER');

CREATE TYPE "AssetCategory" AS ENUM ('LOGO', 'BRAND_GUIDELINES', 'LETTERHEAD', 'COLOUR_PALETTE', 'FONTS', 'PHOTOGRAPHY', 'ILLUSTRATIONS', 'TEMPLATES', 'OTHER');

CREATE TYPE "POStatus" AS ENUM ('OPEN', 'PARTIAL', 'FULFILLED', 'CANCELLED');

CREATE TYPE "CorporateInvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'VOID');

CREATE TYPE "CorporateApplicationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- Drop BulkQuote FK and CorporateAccount (recreate with new shape)
ALTER TABLE "BulkQuote" DROP CONSTRAINT IF EXISTS "BulkQuote_corporateId_fkey";
DROP TABLE IF EXISTS "CorporateAccount";

-- CreateTable CorporateAccount (new)
CREATE TABLE "CorporateAccount" (
    "id" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "tradingName" TEXT,
    "kraPin" TEXT NOT NULL,
    "vatNumber" TEXT,
    "industry" "CorporateIndustry" NOT NULL,
    "companySize" "CompanySize" NOT NULL,
    "website" TEXT,
    "primaryUserId" TEXT NOT NULL,
    "billingAddress" TEXT NOT NULL,
    "billingCity" TEXT NOT NULL,
    "billingCounty" TEXT NOT NULL,
    "billingPostalCode" TEXT,
    "physicalAddress" TEXT,
    "physicalCity" TEXT,
    "physicalCounty" TEXT,
    "paymentTerms" "PaymentTerms" NOT NULL DEFAULT 'PREPAID',
    "creditLimit" INTEGER NOT NULL DEFAULT 0,
    "creditUsed" INTEGER NOT NULL DEFAULT 0,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "taxExempt" BOOLEAN NOT NULL DEFAULT false,
    "status" "CorporateStatus" NOT NULL DEFAULT 'PENDING',
    "tier" "CorporateTier" NOT NULL DEFAULT 'STANDARD',
    "accountManagerId" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "suspendedAt" TIMESTAMP(3),
    "suspendedReason" TEXT,
    "estimatedMonthlySpend" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorporateAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CorporateAccount_accountNumber_key" ON "CorporateAccount"("accountNumber");
CREATE UNIQUE INDEX "CorporateAccount_kraPin_key" ON "CorporateAccount"("kraPin");
CREATE UNIQUE INDEX "CorporateAccount_primaryUserId_key" ON "CorporateAccount"("primaryUserId");
CREATE INDEX "CorporateAccount_status_idx" ON "CorporateAccount"("status");
CREATE INDEX "CorporateAccount_kraPin_idx" ON "CorporateAccount"("kraPin");

-- CreateTable CorporateTeamMember
CREATE TABLE "CorporateTeamMember" (
    "id" TEXT NOT NULL,
    "corporateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CorporateRole" NOT NULL DEFAULT 'MEMBER',
    "jobTitle" TEXT,
    "department" TEXT,
    "canPlaceOrders" BOOLEAN NOT NULL DEFAULT true,
    "canViewInvoices" BOOLEAN NOT NULL DEFAULT false,
    "canManageTeam" BOOLEAN NOT NULL DEFAULT false,
    "spendingLimit" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "invitedBy" TEXT,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "CorporateTeamMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CorporateTeamMember_corporateId_userId_key" ON "CorporateTeamMember"("corporateId", "userId");
CREATE INDEX "CorporateTeamMember_corporateId_idx" ON "CorporateTeamMember"("corporateId");

-- CreateTable CorporateBrandAsset
CREATE TABLE "CorporateBrandAsset" (
    "id" TEXT NOT NULL,
    "corporateId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "AssetCategory" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "tags" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorporateBrandAsset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CorporateBrandAsset_corporateId_idx" ON "CorporateBrandAsset"("corporateId");

-- CreateTable CorporatePO
CREATE TABLE "CorporatePO" (
    "id" TEXT NOT NULL,
    "corporateId" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "description" TEXT,
    "amount" INTEGER NOT NULL,
    "status" "POStatus" NOT NULL DEFAULT 'OPEN',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CorporatePO_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CorporatePO_corporateId_poNumber_key" ON "CorporatePO"("corporateId", "poNumber");
CREATE INDEX "CorporatePO_corporateId_idx" ON "CorporatePO"("corporateId");

-- CreateTable CorporateInvoice
CREATE TABLE "CorporateInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "corporateId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "vatAmount" INTEGER NOT NULL,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" "CorporateInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "pdfUrl" TEXT,
    "pdfKey" TEXT,
    "sentAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "paymentRef" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorporateInvoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CorporateInvoice_invoiceNumber_key" ON "CorporateInvoice"("invoiceNumber");
CREATE INDEX "CorporateInvoice_corporateId_idx" ON "CorporateInvoice"("corporateId");
CREATE INDEX "CorporateInvoice_status_idx" ON "CorporateInvoice"("status");

-- CreateTable CorporateApplication
CREATE TABLE "CorporateApplication" (
    "id" TEXT NOT NULL,
    "corporateId" TEXT,
    "applicantUserId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "tradingName" TEXT,
    "kraPin" TEXT NOT NULL,
    "vatNumber" TEXT,
    "industry" "CorporateIndustry" NOT NULL,
    "companySize" "CompanySize" NOT NULL,
    "website" TEXT,
    "contactPerson" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "billingAddress" TEXT NOT NULL,
    "billingCity" TEXT NOT NULL,
    "billingCounty" TEXT NOT NULL,
    "estimatedMonthlySpend" TEXT NOT NULL,
    "creditRequested" INTEGER,
    "paymentTermsRequested" "PaymentTerms",
    "additionalNotes" TEXT,
    "status" "CorporateApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorporateApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CorporateApplication_applicantUserId_idx" ON "CorporateApplication"("applicantUserId");
CREATE INDEX "CorporateApplication_status_idx" ON "CorporateApplication"("status");

-- CreateTable CorporateNote
CREATE TABLE "CorporateNote" (
    "id" TEXT NOT NULL,
    "corporateId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CorporateNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CorporateNote_corporateId_idx" ON "CorporateNote"("corporateId");

-- CreateTable CorporateInvite
CREATE TABLE "CorporateInvite" (
    "id" TEXT NOT NULL,
    "corporateId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "CorporateRole" NOT NULL,
    "jobTitle" TEXT,
    "invitedBy" TEXT NOT NULL,
    "token" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CorporateInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CorporateInvite_token_key" ON "CorporateInvite"("token");
CREATE INDEX "CorporateInvite_corporateId_idx" ON "CorporateInvite"("corporateId");
CREATE INDEX "CorporateInvite_email_idx" ON "CorporateInvite"("email");

-- AlterTable Order: add corporate fields
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "corporateId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "poReference" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "corporatePOId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "corporateInvoiceId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "placedBy" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "isNetTerms" BOOLEAN NOT NULL DEFAULT false;

-- Clear orphaned BulkQuote rows (old corporateId no longer valid), then add FK
TRUNCATE "BulkQuote";
ALTER TABLE "BulkQuote" ADD CONSTRAINT "BulkQuote_corporateId_fkey" FOREIGN KEY ("corporateId") REFERENCES "CorporateAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CorporateAccount" ADD CONSTRAINT "CorporateAccount_primaryUserId_fkey" FOREIGN KEY ("primaryUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CorporateTeamMember" ADD CONSTRAINT "CorporateTeamMember_corporateId_fkey" FOREIGN KEY ("corporateId") REFERENCES "CorporateAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CorporateTeamMember" ADD CONSTRAINT "CorporateTeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CorporateBrandAsset" ADD CONSTRAINT "CorporateBrandAsset_corporateId_fkey" FOREIGN KEY ("corporateId") REFERENCES "CorporateAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CorporatePO" ADD CONSTRAINT "CorporatePO_corporateId_fkey" FOREIGN KEY ("corporateId") REFERENCES "CorporateAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CorporateInvoice" ADD CONSTRAINT "CorporateInvoice_corporateId_fkey" FOREIGN KEY ("corporateId") REFERENCES "CorporateAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CorporateApplication" ADD CONSTRAINT "CorporateApplication_corporateId_fkey" FOREIGN KEY ("corporateId") REFERENCES "CorporateAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CorporateApplication" ADD CONSTRAINT "CorporateApplication_applicantUserId_fkey" FOREIGN KEY ("applicantUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CorporateNote" ADD CONSTRAINT "CorporateNote_corporateId_fkey" FOREIGN KEY ("corporateId") REFERENCES "CorporateAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Order" ADD CONSTRAINT "Order_corporateId_fkey" FOREIGN KEY ("corporateId") REFERENCES "CorporateAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_corporatePOId_fkey" FOREIGN KEY ("corporatePOId") REFERENCES "CorporatePO"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_corporateInvoiceId_fkey" FOREIGN KEY ("corporateInvoiceId") REFERENCES "CorporateInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
