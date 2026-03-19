-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "CatalogueImportQueue" (
    "id" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "sourceUrl" TEXT,
    "stlStorageKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogueImportQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CatalogueImportQueue_status_idx" ON "CatalogueImportQueue"("status");
