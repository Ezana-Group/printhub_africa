/**
 * Seed legal pages (Privacy, Data Deletion, Terms, Refund, Cookie, Account Terms, Corporate Terms).
 * Run: npx tsx prisma/seeds/legal-pages.ts
 * Uses content from prisma/legal-content.ts. Safe to re-run (upserts).
 */

import path from "node:path";
import { config } from "dotenv";

const root = path.resolve(__dirname, "../..");
config({ path: path.join(root, ".env.local") });
config({ path: path.join(root, ".env") });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { assertPrinthubDatabase } from "../../lib/db-guard";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to .env or .env.local.");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

const LEGAL_PAGES = [
  { slug: "privacy-policy" as const, title: "Privacy Policy" },
  { slug: "data-deletion" as const, title: "Data Deletion Request" },
  { slug: "terms-of-service" as const, title: "Terms of Service" },
  { slug: "refund-policy" as const, title: "Refund and Returns Policy" },
  { slug: "cookie-policy" as const, title: "Cookie Policy" },
  { slug: "account-terms" as const, title: "Account Registration Terms" },
  { slug: "corporate-terms" as const, title: "Corporate Account Terms and Conditions" },
];

async function seedLegalPages() {
  await assertPrinthubDatabase(prisma);
  console.log("Seeding legal pages...");
  const { getLegalContent } = await import("../legal-content");
  for (const page of LEGAL_PAGES) {
    const content = getLegalContent(page.slug);
    await prisma.legalPage.upsert({
      where: { slug: page.slug },
      update: {
        title: page.title,
        content,
        lastUpdated: new Date(),
      },
      create: {
        slug: page.slug,
        title: page.title,
        content,
        lastUpdated: new Date(),
        isPublished: true,
        version: 1,
      },
    });
    console.log(`  ✓ ${page.slug}`);
  }
  console.log("Legal pages seeded.");
}

seedLegalPages()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
