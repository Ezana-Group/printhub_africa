-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MaintenanceType" ADD VALUE 'SCHEDULED';
ALTER TYPE "MaintenanceType" ADD VALUE 'PREVENTIVE';
ALTER TYPE "MaintenanceType" ADD VALUE 'CORRECTIVE';
ALTER TYPE "MaintenanceType" ADD VALUE 'EMERGENCY';
ALTER TYPE "MaintenanceType" ADD VALUE 'UPGRADE';

-- AlterTable
ALTER TABLE "MaintenanceLog" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "hoursAtService" DOUBLE PRECISION,
ADD COLUMN     "partsCostKes" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "MaintenancePartUsed" ADD COLUMN     "partName" TEXT;
