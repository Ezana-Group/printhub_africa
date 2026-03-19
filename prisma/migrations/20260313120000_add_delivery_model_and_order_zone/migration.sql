-- AlterTable: Order - add deliveryZoneId and relation to Delivery
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryZoneId" TEXT;

-- CreateEnum: DeliveryStatus
DO $$ BEGIN
  CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable: Delivery
CREATE TABLE IF NOT EXISTS "Delivery" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "deliveryZoneId" TEXT,
    "method" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "estimatedDelivery" TIMESTAMP(3),
    "dispatchedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "assignedCourierId" TEXT,
    "trackingNumber" TEXT,
    "proofPhotoKey" TEXT,
    "failureReason" TEXT,
    "rescheduledTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Delivery_orderId_key" ON "Delivery"("orderId");
CREATE INDEX IF NOT EXISTS "Delivery_status_idx" ON "Delivery"("status");
CREATE INDEX IF NOT EXISTS "Delivery_deliveryZoneId_idx" ON "Delivery"("deliveryZoneId");

-- FKs
ALTER TABLE "Order" ADD CONSTRAINT "Order_deliveryZoneId_fkey" FOREIGN KEY ("deliveryZoneId") REFERENCES "DeliveryZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_deliveryZoneId_fkey" FOREIGN KEY ("deliveryZoneId") REFERENCES "DeliveryZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_assignedCourierId_fkey" FOREIGN KEY ("assignedCourierId") REFERENCES "Courier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
