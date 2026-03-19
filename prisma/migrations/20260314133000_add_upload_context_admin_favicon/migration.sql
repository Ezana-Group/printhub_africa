-- AlterEnum: Add ADMIN_FAVICON to UploadContext (required for Admin → Business Profile → Favicon upload)
ALTER TYPE "UploadContext" ADD VALUE IF NOT EXISTS 'ADMIN_FAVICON';
