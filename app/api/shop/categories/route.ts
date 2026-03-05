import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Default card images by slug when category has no image (theme-appropriate Unsplash) */
const DEFAULT_IMAGES: Record<string, string> = {
  "large-format":
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80&auto=format",
  "3d-printing":
    "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800&q=80&auto=format",
  merchandise:
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&auto=format",
};

/**
 * Public API: active top-level categories for shop landing.
 * Returns name, slug, description, image (or default), productCount.
 */
export async function GET() {
  const categories = await prisma.category.findMany({
    where: {
    isActive: true,
    OR: [{ parentId: null }, { slug: "merchandise" }],
  },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      _count: { select: { products: true } },
    },
  });

  const list = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    imageUrl: c.image ?? DEFAULT_IMAGES[c.slug] ?? null,
    productCount: c._count.products,
  }));

  return NextResponse.json(list);
}
