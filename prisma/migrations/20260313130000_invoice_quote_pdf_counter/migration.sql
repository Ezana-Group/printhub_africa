-- Invoice: add pdfKey, subtotal, sentAt, sentBy
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "pdfKey" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "subtotal" DECIMAL(12,2);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "sentBy" TEXT;

-- Counter table for INV-/QUO- sequences
CREATE TABLE IF NOT EXISTS "Counter" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Counter_pkey" PRIMARY KEY ("id")
);

-- QuotePdf table
CREATE TABLE IF NOT EXISTS "QuotePdf" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "pdfKey" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    CONSTRAINT "QuotePdf_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "QuotePdf_quoteId_idx" ON "QuotePdf"("quoteId");
ALTER TABLE "QuotePdf" ADD CONSTRAINT "QuotePdf_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
