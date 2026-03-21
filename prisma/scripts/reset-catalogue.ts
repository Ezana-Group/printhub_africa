/**
 * Reset Catalogue Data: Deletes all items, photos, and designers.
 * Run: PRINTHUB_SEED_ALLOW=1 npx tsx prisma/scripts/reset-catalogue.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (process.env.PRINTHUB_SEED_ALLOW !== "1") {
    console.error("❌ Action blocked. PRINTHUB_SEED_ALLOW=1 must be set to run this script.");
    console.log("Usage: PRINTHUB_SEED_ALLOW=1 npm run db:reset-catalogue");
    process.exit(1);
  }

  console.log("Starting catalogue reset...");

  try {
    // Delete in dependency order
    console.log("- Deleting Catalogue Item Photos...");
    await prisma.catalogueItemPhoto.deleteMany();
    
    console.log("- Deleting Catalogue Item Materials...");
    await prisma.catalogueItemMaterial.deleteMany();
    
    console.log("- Deleting Catalogue Items...");
    await prisma.catalogueItem.deleteMany();
    
    console.log("- Deleting Catalogue Designers...");
    await prisma.catalogueDesigner.deleteMany();

    console.log("✅ Catalogue data has been completely reset.");
  } catch (error) {
    console.error("❌ Error resetting catalogue:", error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
