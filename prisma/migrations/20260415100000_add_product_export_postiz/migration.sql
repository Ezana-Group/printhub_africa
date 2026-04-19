-- Add exportToPostiz flag to Product model.
-- Defaults true so existing products are included in Postiz scheduling.
ALTER TABLE "Product" ADD COLUMN "exportToPostiz" BOOLEAN NOT NULL DEFAULT true;
