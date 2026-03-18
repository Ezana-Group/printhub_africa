-- CreateTable: Login/Register left panel config (background, carousel interval)
CREATE TABLE "AuthPanelConfig" (
    "id" TEXT NOT NULL,
    "backgroundColor" TEXT,
    "backgroundImagePath" TEXT,
    "carouselIntervalSeconds" INTEGER DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthPanelConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Login/Register left panel slides (subtitle, headline, body, image)
CREATE TABLE "AuthPanelSlide" (
    "id" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "subtitle" TEXT,
    "headline" TEXT,
    "body" TEXT,
    "imagePath" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthPanelSlide_pkey" PRIMARY KEY ("id")
);

-- Seed default config and one slide so login page works out of the box
INSERT INTO "AuthPanelConfig" ("id", "backgroundColor", "backgroundImagePath", "carouselIntervalSeconds", "updatedAt")
VALUES ('default', '#E84A0C', NULL, 5, NOW());

INSERT INTO "AuthPanelSlide" ("id", "sortOrder", "subtitle", "headline", "body", "imagePath", "updatedAt")
VALUES (
  'default-slide-1',
  0,
  'PrintHub for teams & creators',
  'Print experiences that get noticed.',
  'Upload artwork, approve proofs, and track production in one place.',
  NULL,
  NOW()
);
