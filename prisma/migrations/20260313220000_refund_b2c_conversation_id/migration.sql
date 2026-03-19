-- Add B2C conversation ID to Refund for callback matching
ALTER TABLE "Refund" ADD COLUMN IF NOT EXISTS "mpesaConversationId" TEXT;
