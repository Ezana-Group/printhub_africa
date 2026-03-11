/**
 * Update seed product images to use local WebP assets.
 * Run: npx tsx scripts/update-product-images.ts
 */
import path from "node:path";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const root = path.resolve(__dirname, "..");
config({ path: path.join(root, ".env.local") });
config({ path: path.join(root, ".env") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Add it to .env or .env.local.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const updates = [
    { slug: "sample-banner-1m", images: ["/images/products/vinyl-banner.webp"] },
    { slug: "3d-printed-keyholder", images: ["/images/products/3d-keyholder.webp"] },
  ];

  try {
    for (const { slug, images } of updates) {
      const result = await prisma.product.updateMany({
        where: { slug },
        data: { images },
      });
      console.log(
        result.count > 0
          ? `✓ Updated images for product: ${slug}`
          : `  No product found with slug: ${slug}`
      );
    }
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === "P2021" || err.message?.includes("does not exist")) {
      console.error("\nThe Product table was not found in the database.");
      console.error("Run migrations and seed first:");
      console.error("  npx prisma migrate deploy   # or: npx prisma db push");
      console.error("  npm run db:seed");
      console.error("\nThen run this script again to set product images.");
      process.exit(1);
    }
    throw e;
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
