-- AlterTable
ALTER TABLE "ThreeDConsumable" ADD COLUMN "colourHex" TEXT;
ALTER TABLE "ThreeDConsumable" ADD COLUMN "weightPerSpoolKg" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "ThreeDConsumableMovement" (
    "id" TEXT NOT NULL,
    "consumableId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "costPerKgKes" DOUBLE PRECISION,
    "supplier" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreeDConsumableMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ThreeDConsumableMovement_consumableId_idx" ON "ThreeDConsumableMovement"("consumableId");
CREATE INDEX "ThreeDConsumableMovement_createdAt_idx" ON "ThreeDConsumableMovement"("createdAt");
CREATE INDEX "ThreeDConsumableMovement_performedById_idx" ON "ThreeDConsumableMovement"("performedById");

-- AddForeignKey
ALTER TABLE "ThreeDConsumableMovement" ADD CONSTRAINT "ThreeDConsumableMovement_consumableId_fkey" FOREIGN KEY ("consumableId") REFERENCES "ThreeDConsumable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ThreeDConsumableMovement" ADD CONSTRAINT "ThreeDConsumableMovement_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
