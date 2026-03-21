import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { deleteFile } from "@/lib/r2";
import { writeAudit } from "@/lib/audit";

export async function DELETE(
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

    if (!record) {
      return NextResponse.json({ error: "Backup record not found" }, { status: 404 });
    }

    if (record.r2Key) {
      try {
        await deleteFile("private", record.r2Key);
      } catch (e) {
        console.warn("Failed to delete R2 file, proceeding with record deletion:", e);
      }
    }

    await prisma.backupRecord.delete({
      where: { id },
    });

    await writeAudit({
      userId: auth.userId,
      action: "BACKUP_DELETED",
      entity: "BACKUP",
      entityId: id,
      details: `Backup deleted: ${record.filename}`,
      request: req,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete failed:", error);
    return NextResponse.json({ error: "Failed to delete backup" }, { status: 500 });
  }
}
