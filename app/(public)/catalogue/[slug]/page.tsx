import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CatalogueItemDetail } from "./catalogue-item-detail";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await prisma.catalogueItem.findFirst({
    where: { slug, status: "LIVE" },
    select: { name: true, shortDescription: true, metaTitle: true, metaDescription: true, photos: { where: { isPrimary: true }, take: 1 } },
  });
  if (!item) return { title: "Catalogue | PrintHub Kenya" };
  const primaryPhoto = item.photos[0];
  return {
    title: item.metaTitle ?? `${item.name} — 3D Printed in Kenya | PrintHub`,
    description: item.metaDescription ?? item.shortDescription ?? undefined,
    openGraph: {
      title: item.metaTitle ?? `${item.name} | PrintHub Kenya`,
      images: primaryPhoto?.url ? [primaryPhoto.url] : undefined,
    },
  };
}

export default function CatalogueItemPage({ params }: Props) {
  return <CatalogueItemDetail slugPromise={params.then((p) => p.slug)} />;
}
