import { NextRequest, NextResponse } from "next/server";
import { n8nGuard } from "@/lib/n8n-verify";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const guard = await n8nGuard(req);
  if (guard) return guard;

  try {
    const body = await req.json();
    const { productId, descriptions, adCopyVariations, socialPosts, seoData } = body;

    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    const updates: any = {};
    if (descriptions) {
      if (descriptions.description) updates.description = descriptions.description;
      if (descriptions.shortDescription) updates.shortDescription = descriptions.shortDescription;
      if (descriptions.keyFeatures) updates.keyFeatures = descriptions.keyFeatures;
      updates.aiDescriptionGenerated = true;
      updates.aiGeneratedAt = new Date();
    }

    if (seoData) {
      if (seoData.metaTitle) updates.metaTitle = seoData.metaTitle;
      if (seoData.metaDescription) updates.metaDescription = seoData.metaDescription;
    }

    await prisma.product.update({
      where: { id: productId },
      data: updates,
    });

    const variations = adCopyVariations || (socialPosts ? Object.entries(socialPosts).map(([platform, body]) => ({
      platform,
      body
    })) : null);

    if (variations && Array.isArray(variations)) {
      await (prisma as any).adCopyVariation.deleteMany({ where: { productId } });
      await (prisma as any).adCopyVariation.createMany({
        data: variations.map((v: any, i: number) => ({
          productId,
          platform: v.platform,
          variationIndex: i + 1,
          headline: v.headline,
          body: v.body,
          description: v.description,
          cta: v.cta,
          script: v.script,
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[save-ai-content]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
