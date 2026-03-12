-- AlterTable Courier: add address, city, county for "nearest location" selection
ALTER TABLE "Courier" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "Courier" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "Courier" ADD COLUMN IF NOT EXISTS "county" TEXT;

-- AlterTable Order: add courierId (preferred/assigned courier)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "courierId" TEXT;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Order_courierId_fkey') THEN
    ALTER TABLE "Order" ADD CONSTRAINT "Order_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "Courier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
