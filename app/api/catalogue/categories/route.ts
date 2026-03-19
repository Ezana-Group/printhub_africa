import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSiteImageSlots } from "@/lib/site-images";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [categories, counts, siteImages] = await Promise.all([
      prisma.catalogueCategory.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.catalogueItem.groupBy({
        by: ["categoryId"],
        where: { status: "LIVE" },
        _count: { id: true },
      }),
      getSiteImageSlots(prisma),
    ]);
    const countByCategory = Object.fromEntries(counts.map((c) => [c.categoryId, c._count.id]));
    const list = categories.map((c) => {
      const slug = c.slug;
      let slotImage: string | undefined;
      switch (slug) {
        case "home-decor":
          slotImage = siteImages.catalogue_category_home_decor;
          break;
        case "phone-tech":
          slotImage = siteImages.catalogue_category_phone_tech;
          break;
        case "toys-games":
          slotImage = siteImages.catalogue_category_toys_games;
          break;
        case "tools":
          slotImage = siteImages.catalogue_category_tools;
          break;
        case "jewellery":
          slotImage = siteImages.catalogue_category_jewellery;
          break;
        case "education":
          slotImage = siteImages.catalogue_category_education;
          break;
        case "office-desk":
          slotImage = siteImages.catalogue_category_office_desk;
          break;
        case "kenya-collection":
          slotImage = siteImages.catalogue_category_kenya_collection;
          break;
        default:
          slotImage = undefined;
      }
      return {
        id: c.id,
        name: c.name,
        slug,
        description: c.description,
        imageUrl: c.imageUrl || slotImage || null,
        icon: c.icon,
        sortOrder: c.sortOrder,
        itemCount: countByCategory[c.id] ?? 0,
      };
    });
    return NextResponse.json(list);
  } catch (e) {
    console.error("Catalogue categories error:", e);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
