import { prisma } from "../lib/prisma";

async function main() {
  console.log("Starting backfill for Catalogue Items...");

  // Find all LIVE catalogue items without a linked Product
  const items = await (prisma.catalogueItem as unknown as { findMany: (args?: unknown) => Promise<unknown[]> }).findMany({
    where: {
      status: "LIVE",
      productId: null,
    },
    include: {
      photos: {
        where: { isPrimary: true },
        take: 1
      }
    }
  });

  console.log(`Found ${items.length} LIVE catalogue items to process.`);

  type ItemType = {
    id: string;
    name: string;
    slug: string;
    description: string;
    shortDescription: string;
    categoryId: string;
    priceOverrideKes: number | null;
    basePriceKes: number | null;
    tags: string[];
    photos: { url: string }[];
  };

  let createdCount = 0;
  for (const rawItem of items) {
    const item = rawItem as ItemType;
    try {
      // Create Product
      const product = await prisma.product.create({
        data: {
          name: item.name,
          slug: item.slug, // Assumes slug is unique across products and catalogue items, if it conflicts, could append -pod
          description: item.description,
          shortDescription: item.shortDescription,
          categoryId: item.categoryId,
          productType: "READYMADE_3D",
          images: item.photos.length > 0 ? item.photos.map((p) => p.url) : [],
          basePrice: item.priceOverrideKes ?? item.basePriceKes ?? 0,
          comparePrice: item.priceOverrideKes && item.basePriceKes ? item.basePriceKes : null,
          stock: 0, // Print on demand has theoretically unlimited stock, but maybe managed differently
          isActive: true,
          tags: item.tags,
        },
      });

      // Link it back
      await (prisma.catalogueItem as unknown as { update: (args?: unknown) => Promise<unknown> }).update({
        where: { id: item.id },
        data: { productId: product.id },
      });

      console.log(`Created product for catalogue item: ${item.name} (${item.slug})`);
      createdCount++;
    } catch (e) {
      console.error(`Failed to process item ${item.id} (${item.name}):`, e);
    }
  }

  console.log(`Backfill complete. Created ${createdCount} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
