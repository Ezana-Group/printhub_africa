-- Internal email system: mailbox-level staff visibility

-- CreateTable
CREATE TABLE "EmailMailboxViewer" (
    "id" TEXT NOT NULL,
    "mailboxId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailMailboxViewer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailMailboxViewer_mailboxId_userId_key" ON "EmailMailboxViewer"("mailboxId", "userId");

-- CreateIndex
CREATE INDEX "EmailMailboxViewer_userId_idx" ON "EmailMailboxViewer"("userId");

-- CreateIndex
CREATE INDEX "EmailMailboxViewer_mailboxId_idx" ON "EmailMailboxViewer"("mailboxId");

-- AddForeignKey
ALTER TABLE "EmailMailboxViewer" ADD CONSTRAINT "EmailMailboxViewer_mailboxId_fkey"
  FOREIGN KEY ("mailboxId") REFERENCES "EmailAddress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMailboxViewer" ADD CONSTRAINT "EmailMailboxViewer_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

