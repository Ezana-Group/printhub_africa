-- AlterEnum: Add ADMIN_SITE_IMAGE for admin-managed site images (Content > Site images)
ALTER TYPE "UploadContext" ADD VALUE IF NOT EXISTS 'ADMIN_SITE_IMAGE';

-- CreateTable: Slots for admin-managed site images
CREATE TABLE "SiteImageSlot" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "imagePath" TEXT,
    "alt" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteImageSlot_pkey" PRIMARY KEY ("id")
);

-- Unique constraint on key
CREATE UNIQUE INDEX "SiteImageSlot_key_key" ON "SiteImageSlot"("key");
