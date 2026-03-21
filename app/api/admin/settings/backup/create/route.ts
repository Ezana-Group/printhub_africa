import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { createFullBackup } from "@/lib/backup-utils";
import { writeAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;

  // Create record first
  const record = await prisma.backupRecord.create({
    data: {
      createdById: auth.userId,
      status: "PENDING",
      filename: `pending-${Date.now()}.zip`,
    },
  });

  // Run asynchronously
  (async () => {
    try {
      await prisma.backupRecord.update({
        where: { id: record.id },
        data: { status: "IN_PROGRESS" },
      });

      const user = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { email: true },
      });

      const { filename, r2Key, sizeBytes } = await createFullBackup(auth.userId, user?.email || "unknown");

      await prisma.backupRecord.update({
        where: { id: record.id },
        data: {
          status: "COMPLETE",
          filename,
          r2Key,
          sizeBytes,
        },
      });

      await writeAudit({
        userId: auth.userId,
        action: "BACKUP_CREATED",
        entity: "BACKUP",
        entityId: record.id,
        details: `Backup created: ${filename}`,
      });
    } catch (error) {
      console.error("Backup failed:", error);
      await prisma.backupRecord.update({
        where: { id: record.id },
        data: {
          status: "FAILED",
          errorMsg: error instanceof Error ? error.message : "Internal error",
        },
      });
    }
  })();

  return NextResponse.json({ id: record.id }, { status: 202 });
}
