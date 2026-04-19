import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

export async function POST() {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;

  try {
    console.log("Starting photo deduplication via API...");

    const items = await prisma.catalogueItem.findMany({
      where: { photos: { some: {} } },
      select: { id: true, name: true }
    });

    let totalRemoved = 0;
    const itemsFixed: string[] = [];

    for (const item of items) {
      const photos = await prisma.catalogueItemPhoto.findMany({
        where: { catalogueItemId: item.id },
        orderBy: [
          { isPrimary: "desc" },
          { sortOrder: "asc" },
          { createdAt: "asc" }
        ]
      });

      const seen = new Set<string>();
      const toDelete: string[] = [];

      for (const photo of photos) {
        const key = photo.storageKey || photo.url;
        if (seen.has(key)) {
          toDelete.push(photo.id);
        } else {
          seen.add(key);
        }
      }

      if (toDelete.length > 0) {
        await prisma.catalogueItemPhoto.deleteMany({
          where: { id: { in: toDelete } }
        });
        totalRemoved += toDelete.length;
        itemsFixed.push(item.name);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Removed ${totalRemoved} redundant records across ${itemsFixed.length} items.`,
      itemsFixed
    });
  } catch (err) {
    console.error("Deduplication API error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
