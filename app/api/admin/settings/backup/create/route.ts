import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";
import { createFullBackup } from "@/lib/backup-utils";

/** POST: Create a new system backup record. 
 * Note: In a real app, this would trigger a background job to export DB to R2/S3.
 * For now, we simulate the metadata creation.
 */
export async function POST(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { email: true }
    });

    if (!user?.email) {
      throw new Error("User email not found");
    }

    const backupData = await createFullBackup(auth.userId, user.email);

    const backup = await prisma.backupRecord.create({
      data: {
        createdById: auth.userId,
        filename: backupData.filename,
        status: "COMPLETED",
        sizeBytes: backupData.sizeBytes,
        r2Key: backupData.r2Key,
      },
    });

    await writeAudit({
      userId: auth.userId,
      action: "BACKUP_CREATED",
      category: "MAINTENANCE",
      entity: "SYSTEM",
      entityId: backup.id,
      request: req,
      details: `Full system backup created: ${backup.filename} (${(Number(backup.sizeBytes) / (1024 * 1024)).toFixed(2)} MB)`,
    });

    return NextResponse.json({ success: true, backup });
  } catch (error: any) {
    console.error("Backup creation failed:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to create backup" 
    }, { status: 500 });
  }
}
