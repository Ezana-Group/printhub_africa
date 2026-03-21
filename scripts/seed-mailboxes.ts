/**
 * Seed default email mailboxes into the EmailAddress table.
 * Run: npx tsx scripts/seed-mailboxes.ts
 *
 * This creates DB records only. Cloudflare Email Routing rules
 * must be configured separately via the admin UI or Cloudflare dashboard.
 */

if (process.env.PRINTHUB_SEED_ALLOW !== "1") {
  console.error("❌ Seeding blocked. PRINTHUB_SEED_ALLOW is not set to 1.");
  process.exit(1);
}

import path from "node:path";
import { config } from "dotenv";

// Load env from project root (same approach as prisma/seed.ts)
const root = path.resolve(__dirname, "..");
config({ path: path.join(root, ".env.local") });
config({ path: path.join(root, ".env") });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to .env or .env.local.");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter, log: ["error", "warn"] });

const DEFAULT_MAILBOXES = [
  { address: "admin@printhub.africa", label: "Admin" },
  { address: "hello@printhub.africa", label: "General Enquiries" },
  { address: "support@printhub.africa", label: "Support" },
  { address: "careers@printhub.africa", label: "Careers" },
  { address: "dpo@printhub.africa", label: "Data Protection" },
  { address: "welcome@printhub.africa", label: "Welcome" },
];

async function main() {
  console.log("Seeding default email mailboxes...\n");

  for (const mb of DEFAULT_MAILBOXES) {
    const existing = await prisma.emailAddress.findUnique({
      where: { address: mb.address },
    });

    if (existing) {
      console.log(`  ✓ ${mb.address} — already exists (${existing.label})`);
    } else {
      await prisma.emailAddress.create({
        data: {
          address: mb.address,
          label: mb.label,
          isActive: true,
        },
      });
      console.log(`  + ${mb.address} — created as "${mb.label}"`);
    }
  }

  console.log("\nDone. Mailboxes seeded.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
