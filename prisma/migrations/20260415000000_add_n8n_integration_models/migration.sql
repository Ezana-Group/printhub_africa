-- Migration: add_n8n_integration_models
-- Adds four models that support the /api/n8n/* internal callback endpoints.

-- CreateTable: BlogPost
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "slug" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "source" TEXT,
    "metadata" JSONB,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AiUsageLog
CREATE TABLE "AiUsageLog" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "model" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "costUsd" DOUBLE PRECISION,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable: InsightReport
CREATE TABLE "InsightReport" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "month" INTEGER,
    "year" INTEGER,
    "week" INTEGER,
    "r2Key" TEXT,
    "reportUrl" TEXT,
    "htmlBody" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsightReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable: N8nGeneratedContent
CREATE TABLE "N8nGeneratedContent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "productId" TEXT,
    "title" TEXT,
    "body" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "source" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "N8nGeneratedContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_status_idx" ON "BlogPost"("status");

-- CreateIndex
CREATE INDEX "AiUsageLog_service_idx" ON "AiUsageLog"("service");

-- CreateIndex
CREATE INDEX "AiUsageLog_createdAt_idx" ON "AiUsageLog"("createdAt");

-- CreateIndex
CREATE INDEX "InsightReport_type_year_month_idx" ON "InsightReport"("type", "year", "month");

-- CreateIndex
CREATE INDEX "N8nGeneratedContent_type_status_idx" ON "N8nGeneratedContent"("type", "status");

-- CreateIndex
CREATE INDEX "N8nGeneratedContent_productId_idx" ON "N8nGeneratedContent"("productId");
