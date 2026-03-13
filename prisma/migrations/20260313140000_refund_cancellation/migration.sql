-- Refund: add refundNumber, reviewedBy, rejectionReason, mpesaPhone, mpesaReceiptNo
ALTER TABLE "Refund" ADD COLUMN IF NOT EXISTS "refundNumber" TEXT;
ALTER TABLE "Refund" ADD COLUMN IF NOT EXISTS "reviewedBy" TEXT;
ALTER TABLE "Refund" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "Refund" ADD COLUMN IF NOT EXISTS "mpesaPhone" TEXT;
ALTER TABLE "Refund" ADD COLUMN IF NOT EXISTS "mpesaReceiptNo" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Refund_refundNumber_key" ON "Refund"("refundNumber") WHERE "refundNumber" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Refund_status_idx" ON "Refund"("status");

-- Cancellation table
CREATE TABLE IF NOT EXISTS "Cancellation" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "cancelledBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Cancellation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Cancellation_orderId_key" ON "Cancellation"("orderId");
CREATE INDEX IF NOT EXISTS "Cancellation_orderId_idx" ON "Cancellation"("orderId");
ALTER TABLE "Cancellation" ADD CONSTRAINT "Cancellation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
