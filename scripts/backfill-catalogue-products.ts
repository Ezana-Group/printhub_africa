import { prisma } from "../lib/prisma";

async function main() {
  console.log("Starting backfill for Catalogue Items...");

  // Find all LIVE catalogue items without a linked Product
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = await (prisma.catalogueItem as any).findMany({
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

  let createdCount = 0;
  for (const item of items) {
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          images: (item as any).photos.length > 0 ? (item as any).photos.map((p: any) => p.url) : [],
          basePrice: item.priceOverrideKes ?? item.basePriceKes ?? 0,
          comparePrice: item.priceOverrideKes && item.basePriceKes ? item.basePriceKes : null,
          stock: 0, // Print on demand has theoretically unlimited stock, but maybe managed differently
          isActive: true,
          tags: item.tags,
        },
      });

      // Link it back
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma.catalogueItem as any).update({
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
