-- AlterTable
ALTER TABLE "UploadedFile" ADD COLUMN IF NOT EXISTS "guestEmail" TEXT;
ALTER TABLE "UploadedFile" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
