import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;
  await prisma.seoSettings.update({
    where: { id: "default" },
    data: { sitemapGeneratedAt: new Date(), updatedAt: new Date() },
  });
  revalidatePath("/sitemap.xml");
  await writeAudit({
    userId: auth.userId,
    action: "SITEMAP_REGENERATED",
    category: "SETTINGS",
    request: req,
  });
  return NextResponse.json({
    success: true,
    generatedAt: new Date().toISOString(),
  });
}
