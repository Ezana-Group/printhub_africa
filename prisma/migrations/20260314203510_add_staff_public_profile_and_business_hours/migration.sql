-- AlterTable
ALTER TABLE "BusinessSettings" ADD COLUMN     "hoursHolidays" TEXT,
ADD COLUMN     "hoursSaturday" TEXT,
ADD COLUMN     "hoursSunday" TEXT,
ADD COLUMN     "hoursWeekdays" TEXT;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "aboutPageOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "profilePhotoUrl" TEXT,
ADD COLUMN     "publicBio" TEXT,
ADD COLUMN     "publicName" TEXT,
ADD COLUMN     "publicRole" TEXT,
ADD COLUMN     "showOnAboutPage" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Staff_showOnAboutPage_idx" ON "Staff"("showOnAboutPage");
