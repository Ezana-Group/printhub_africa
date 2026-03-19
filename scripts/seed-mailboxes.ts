/**
 * Seed default email mailboxes into the EmailAddress table.
 * Run: npx tsx scripts/seed-mailboxes.ts
 *
 * This creates DB records only. Cloudflare Email Routing rules
 * must be configured separately via the admin UI or Cloudflare dashboard.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_MAILBOXES = [
  { address: "admin@printhub.africa", label: "Admin" },
  { address: "hello@printhub.africa", label: "General Enquiries" },
  { address: "support@printhub.africa", label: "Support" },
  { address: "careers@printhub.africa", label: "Careers" },
  { address: "dpo@printhub.africa", label: "Data Protection" },
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
