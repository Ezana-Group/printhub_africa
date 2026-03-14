-- AlterTable
ALTER TABLE "CorporateApplication" ADD COLUMN     "acceptedCorporateTermsAt" TIMESTAMP(3),
ADD COLUMN     "corporateTermsVersion" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "acceptedTermsAt" TIMESTAMP(3),
ADD COLUMN     "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "marketingConsentAt" TIMESTAMP(3),
ADD COLUMN     "termsVersion" TEXT;
