import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { createPresignedDownloadUrl } from "@/lib/r2";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;

  try {
    const record = await prisma.backupRecord.findUnique({
      where: { id },
    });

    if (!record?.r2Key) {
      return NextResponse.json({ error: "Backup not found or no file associated" }, { status: 404 });
    }

    if (record.status !== "COMPLETED" && record.status !== "COMPLETE") {
      return NextResponse.json({ error: "Backup is not ready for download" }, { status: 400 });
    }

    const url = await createPresignedDownloadUrl(record.r2Key, 900); // 15 minutes
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Download failed:", error);
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 });
  }
}
