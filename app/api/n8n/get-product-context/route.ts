import { NextRequest, NextResponse } from "next/server";
import { n8nGuard } from "@/lib/n8n-verify";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const guard = await n8nGuard(req);
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        productImages: true,
        mockups: true,
        videos: true,
        adCopyVariations: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const captions: any = {
      instagram: "",
      linkedin: "",
      tiktok: "",
      youtube_community: "",
    };

    const p = product as any;

    p.adCopyVariations.forEach((v: any) => {
      if (v.platform === "instagram") captions.instagram = v.body || v.headline || "";
      if (v.platform === "linkedin") captions.linkedin = v.body || v.headline || "";
      if (v.platform === "tiktok") captions.tiktok = v.body || v.headline || "";
      if (v.platform === "youtube_community") captions.youtube_community = v.body || v.headline || "";
      // Handle "social" platform if it exists (fallback)
      if (v.platform === "social" && v.data) {
        Object.assign(captions, v.data);
      }
    });

    return NextResponse.json({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      shortDescription: p.shortDescription,
      category: p.category?.name || "Product",
      basePrice: p.basePrice,
      images: p.productImages.map((img: any) => img.url),
      mockups: p.mockups.map((m: any) => ({ platform: m.platform, imageUrl: m.imageUrl, status: m.status })),
      videos: p.videos.map((v: any) => ({ platform: v.platform, videoUrl: v.videoUrl, status: v.status })),
      captions,
      materials: p.materials,
      colors: p.colors,
      finishes: p.finishes,
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
      exportFlags: {
        googleDiscover: p.exportToGoogleDiscover,
        instagramReels: p.exportToInstagramReels,
        instagramStories: p.exportToInstagramStories,
        jiji: p.exportToJiji,
        telegram: p.exportToTelegram,
        whatsappChannel: p.exportToWhatsappChannel,
        whatsappStatus: p.exportToWhatsappStatus,
        youtubeShorts: p.exportToYoutubeShorts,
      },
    });
  } catch (err) {
    console.error("[get-product-context]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
