-- AlterTable Quote: add cancellation fields
ALTER TABLE "Quote" ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "cancelledBy" TEXT,
ADD COLUMN "cancellationReason" TEXT,
ADD COLUMN "cancellationNotes" TEXT,
ADD COLUMN "cancelledByAdminId" TEXT;

-- CreateTable QuoteCancellation (audit log)
CREATE TABLE "QuoteCancellation" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "cancelledBy" TEXT NOT NULL,
    "cancelledByUserId" TEXT,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteCancellation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QuoteCancellation_quoteId_idx" ON "QuoteCancellation"("quoteId");

ALTER TABLE "Quote" ADD CONSTRAINT "Quote_cancelledByAdminId_fkey" FOREIGN KEY ("cancelledByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QuoteCancellation" ADD CONSTRAINT "QuoteCancellation_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuoteCancellation" ADD CONSTRAINT "QuoteCancellation_cancelledByUserId_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
