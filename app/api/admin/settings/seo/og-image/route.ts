import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";

// Placeholder: upload to R2 and return URL. Replace with your R2 upload logic.
async function uploadOgImage(formData: FormData): Promise<string> {
  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No file");
  // TODO: upload to R2, return public URL
  return `/uploads/og/${Date.now()}-${file.name}`;
}

export async function POST(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;
  try {
    const formData = await req.formData();
    const url = await uploadOgImage(formData);
    await prisma.seoSettings.update({
      where: { id: "default" },
      data: { defaultOgImageUrl: url, updatedAt: new Date() },
    });
    await writeAudit({
      userId: auth.userId,
      action: "SEO_OG_IMAGE_UPDATED",
      category: "SETTINGS",
      request: req,
    });
    return NextResponse.json({ success: true, url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 400 }
    );
  }
}
