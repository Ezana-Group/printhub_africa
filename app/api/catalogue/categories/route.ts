import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [categories, counts] = await Promise.all([
      prisma.catalogueCategory.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.catalogueItem.groupBy({
        by: ["categoryId"],
        where: { status: "LIVE" },
        _count: { id: true },
      }),
    ]);
    const countByCategory = Object.fromEntries(counts.map((c) => [c.categoryId, c._count.id]));
    const list = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: c.imageUrl,
      icon: c.icon,
      sortOrder: c.sortOrder,
      itemCount: countByCategory[c.id] ?? 0,
    }));
    return NextResponse.json(list);
  } catch (e) {
    console.error("Catalogue categories error:", e);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
