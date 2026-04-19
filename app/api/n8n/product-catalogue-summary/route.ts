import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-n8n-secret") ?? "";
  if (secret !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const products = await prisma.product.findMany({
      where: { 
        isActive: true,
        OR: [
          { exportToMeta: true },
          { exportToTiktok: true },
          { exportToLinkedin: true },
          { exportToX: true },
          { exportToTelegram: true },
          { exportToYoutube: true }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        basePrice: true,
        category: { select: { name: true } },
        shortDescription: true,
        availability: true,
        exportToMeta: true,
        exportToTiktok: true,
        exportToLinkedin: true,
        exportToX: true,
        exportToTelegram: true,
        exportToYoutube: true,
        productImages: {
          where: { isPrimary: true },
          select: { storageKey: true },
          take: 1
        },
        videos: {
          where: { status: "APPROVED" },
          select: { videoUrl: true },
          take: 1
        }
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category.name,
        basePriceKes: Number(p.basePrice),
        availability: p.availability,
        shortDescription: p.shortDescription ?? "",
        exportFlags: {
          meta: p.exportToMeta,
          tiktok: p.exportToTiktok,
          linkedin: p.exportToLinkedin,
          twitter: p.exportToX,
          telegram: p.exportToTelegram,
          youtube: p.exportToYoutube
        },
        image_key: p.productImages[0]?.storageKey ?? null,
        video_url: p.videos[0]?.videoUrl ?? null
      })),
      total: products.length,
    });
  } catch (err) {
    console.error("[product-catalogue-summary]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

// Also accept POST (n8n Execute Workflow style) — just delegates to GET
export async function POST(req: NextRequest) {
  return GET(req);
}

