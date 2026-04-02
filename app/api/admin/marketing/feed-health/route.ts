import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api"; 

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const [
    totalProducts,
    googleCount,
    metaCount,
    tiktokCount,
    linkedinCount,
    pinterestCount,
    xCount,
    googleBizCount
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true, exportToGoogle: true } }),
    prisma.product.count({ where: { isActive: true, exportToMeta: true } }),
    prisma.product.count({ where: { isActive: true, exportToTiktok: true } }),
    prisma.product.count({ where: { isActive: true, exportToLinkedIn: true } }),
    prisma.product.count({ where: { isActive: true, exportToPinterest: true } }),
    prisma.product.count({ where: { isActive: true, exportToX: true } }),
    prisma.product.count({ where: { isActive: true, exportToGoogleBiz: true } }),
  ]);

  return NextResponse.json({
    totalProducts,
    feeds: {
      google: googleCount,
      meta: metaCount,
      tiktok: tiktokCount,
      linkedin: linkedinCount,
      pinterest: pinterestCount,
      x: xCount,
      "google-business": googleBizCount,
    }
  });
}
