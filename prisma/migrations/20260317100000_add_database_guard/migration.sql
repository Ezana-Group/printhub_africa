-- CreateTable
CREATE TABLE "DatabaseGuard" (
    "id" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatabaseGuard_pkey" PRIMARY KEY ("id")
);

-- Insert PrintHub sentinel row so seed/clean scripts only run against this project's DB
INSERT INTO "DatabaseGuard" ("id", "project", "updatedAt") VALUES ('default', 'printhub_africa', NOW());
