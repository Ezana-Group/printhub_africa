import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CatalogueItemDetail } from "./catalogue-item-detail";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const resolved = await params;
    const slug = typeof resolved?.slug === "string" ? resolved.slug : "";
    if (!slug) return { title: "Catalogue | PrintHub Kenya" };
    const item = await prisma.catalogueItem.findFirst({
      where: { slug, status: "LIVE" },
      select: { name: true, shortDescription: true, metaTitle: true, metaDescription: true, photos: { where: { isPrimary: true }, take: 1 } },
    });
    if (!item) return { title: "Catalogue | PrintHub Kenya" };
    const primaryPhoto = Array.isArray(item.photos) ? item.photos[0] : undefined;
    return {
      title: item.metaTitle ?? `${item.name} — 3D Printed in Kenya | PrintHub`,
      description: item.metaDescription ?? item.shortDescription ?? undefined,
      openGraph: {
        title: item.metaTitle ?? `${item.name} | PrintHub Kenya`,
        images: primaryPhoto?.url ? [primaryPhoto.url] : undefined,
      },
    };
  } catch {
    return { title: "Catalogue | PrintHub Kenya" };
  }
}

export default async function CatalogueItemPage({ params }: Props) {
  const resolved = await params;
  const slug = typeof resolved?.slug === "string" ? resolved.slug : "";
  return <CatalogueItemDetail slug={slug} />;
}
