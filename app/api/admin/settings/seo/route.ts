import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";
import { revalidateSitemap } from "@/lib/settings-api";

export async function GET(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;
  
  const s = await prisma.businessSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
    select: {
      seoSiteName: true,
      seoTagline: true,
      seoDefaultTitle: true,
      seoDefaultDescription: true,
      googleSiteVerification: true,
      canonicalDomain: true,
      sitemapIncludePages: true,
      sitemapIncludeProducts: true,
      sitemapIncludeCategories: true,
      robotsTxt: true,
      twitterCardType: true,
      twitterHandle: true,
      defaultOgImage: true,
    },
  });
  return NextResponse.json(s);
}

export async function PATCH(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;
  
  const body = await req.json().catch(() => ({}));
  
  const oldSettings = await prisma.businessSettings.findUnique({
    where: { id: "default" },
  });

  const updated = await prisma.businessSettings.update({
    where: { id: "default" },
    data: {
      seoSiteName: body.seoSiteName,
      seoTagline: body.seoTagline,
      seoDefaultTitle: body.seoDefaultTitle,
      seoDefaultDescription: body.seoDefaultDescription,
      googleSiteVerification: body.googleSiteVerification,
      canonicalDomain: body.canonicalDomain,
      sitemapIncludePages: body.sitemapIncludePages,
      sitemapIncludeProducts: body.sitemapIncludeProducts,
      sitemapIncludeCategories: body.sitemapIncludeCategories,
      robotsTxt: body.robotsTxt,
      twitterCardType: body.twitterCardType,
      twitterHandle: body.twitterHandle,
      defaultOgImage: body.defaultOgImage,
    },
  });

  revalidateSitemap();
  
  await writeAudit({
    userId: auth.userId,
    action: "SEO_SETTINGS_UPDATED",
    category: "SETTINGS",
    request: req,
    before: oldSettings,
    after: updated,
  });

  return NextResponse.json({ success: true, settings: updated });
}
