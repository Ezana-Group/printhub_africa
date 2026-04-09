/**
 * GET /api/cron/backup
 * Automated system backup job. 
 * Checks frequency settings and creates a full ZIP (DB + R2) if due.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createFullBackup } from "@/lib/backup-utils";

function checkCronAuth(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = req.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const headerSecret = req.headers.get("x-cron-secret");
  return bearer === secret || headerSecret === secret;
}

export async function GET(req: Request) {
  if (!checkCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await prisma.systemSettings.findFirst();
    const frequency = settings?.backupFrequencyHours ?? 24;
    const lastBackup = settings?.lastBackupAt ? new Date(settings.lastBackupAt) : new Date(0);
    
    const now = new Date();
    const hoursSinceLast = (now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLast < frequency) {
      return NextResponse.json({ 
        ok: true, 
        message: "Backup not due yet", 
        hoursSinceLast: hoursSinceLast.toFixed(1),
        frequencyHours: frequency 
      });
    }

    // Trigger backup
    console.log(`Cron: Starting automated backup (Due after ${frequency}h, last was ${hoursSinceLast.toFixed(1)}h ago)`);
    
    // We attribute cron backups to a "System" user or a specific admin ID if we want,
    // but here we mark it as automated.
    const backupData = await createFullBackup("SYSTEM_CRON", "system@printhub.africa");

    // Persist backup record
    await prisma.$transaction([
      prisma.backupRecord.create({
        data: {
          createdById: "SYSTEM", // Special marker or skip relation
          filename: backupData.filename,
          status: "COMPLETED",
          sizeBytes: backupData.sizeBytes,
          r2Key: backupData.r2Key,
        },
      }),
      prisma.systemSettings.update({
        where: { id: settings?.id || "SYSTEM" }, // Handle case where settings might not exist yet
        data: { lastBackupAt: new Date() }
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      filename: backupData.filename,
      size: backupData.sizeBytes.toString()
    });
  } catch (error: any) {
    console.error("Cron Backup Failed:", error);
    return NextResponse.json({ 
      error: error.message || "Backup failed" 
    }, { status: 500 });
  }
}
