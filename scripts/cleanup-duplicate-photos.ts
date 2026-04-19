import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupDuplicatePhotos() {
  console.log("Starting photo deduplication...");

  // Get all catalogue items that have photos
  const items = await prisma.catalogueItem.findMany({
    where: {
      photos: { some: {} }
    },
    select: {
      id: true,
      name: true
    }
  });

  let totalRemoved = 0;

  for (const item of items) {
    const photos = await prisma.catalogueItemPhoto.findMany({
      where: { catalogueItemId: item.id },
      orderBy: [
        { isPrimary: "desc" }, // Keep primary if it exists
        { sortOrder: "asc" },
        { createdAt: "asc" }
      ]
    });

    const seen = new Set<string>();
    const toDelete: string[] = [];

    for (const photo of photos) {
      // Create a unique key for the photo: either storageKey or URL
      const key = photo.storageKey || photo.url;
      if (seen.has(key)) {
        toDelete.push(photo.id);
      } else {
        seen.add(key);
      }
    }

    if (toDelete.length > 0) {
      console.log(`Item "${item.name}" (${item.id}): Removing ${toDelete.length} duplicates...`);
      await prisma.catalogueItemPhoto.deleteMany({
        where: { id: { in: toDelete } }
      });
      totalRemoved += toDelete.length;
    }
  }

  console.log(`Deduplication complete. Removed ${totalRemoved} redundant records.`);
}

cleanupDuplicatePhotos()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
