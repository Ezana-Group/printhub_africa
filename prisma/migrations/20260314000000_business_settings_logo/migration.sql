-- Add logo URL to BusinessSettings (favicon already exists)
ALTER TABLE "BusinessSettings" ADD COLUMN IF NOT EXISTS "logo" TEXT;
