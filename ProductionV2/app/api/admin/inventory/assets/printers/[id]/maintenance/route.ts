import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];
const MAINTENANCE_TYPES = ["SCHEDULED_SERVICE", "BREAKDOWN_REPAIR", "CLEANING", "CALIBRATION", "PART_REPLACEMENT", "FIRMWARE_UPDATE", "INSPECTION"] as const;

/** GET: List maintenance logs for this printer */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const asset = await prisma.printerAsset.findUnique({ where: { id } });
    if (!asset) return NextResponse.json({ error: "Printer not found" }, { status: 404 });

    const logs = await prisma.maintenanceLog.findMany({
      where: { printerAssetId: id },
      orderBy: { date: "desc" },
      include: {
        partsUsed: true,
      },
    });

    return NextResponse.json(
      logs.map((log) => ({
        id: log.id,
        type: log.type,
        date: log.date.toISOString(),
        performedBy: log.performedBy,
        isExternal: log.isExternal,
        technicianCompany: log.technicianCompany,
        description: log.description,
        labourHours: log.labourHours,
        labourCostKes: log.labourCostKes,
        totalCostKes: log.totalCostKes,
        nextServiceDate: log.nextServiceDate?.toISOString() ?? null,
        nextServiceHours: log.nextServiceHours,
        notes: log.notes,
        createdAt: log.createdAt.toISOString(),
        partsUsed: log.partsUsed,
      }))
    );
  } catch (e) {
    console.error("Maintenance GET error:", e);
    return NextResponse.json({ error: "Failed to load maintenance" }, { status: 500 });
  }
}

/** POST: Log a maintenance event */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const asset = await prisma.printerAsset.findUnique({ where: { id } });
    if (!asset) return NextResponse.json({ error: "Printer not found" }, { status: 404 });

    const body = await req.json();
    const type = MAINTENANCE_TYPES.includes(body.type) ? body.type : "INSPECTION";
    const labourHours = Number(body.labourHours) || 0;
    const labourCostKes = Number(body.labourCostKes) || 0;
    const partsUsed = Array.isArray(body.partsUsed) ? body.partsUsed : [];
    let partsTotal = 0;
    for (const p of partsUsed) {
      const qty = Number(p.quantityUsed) || 0;
      const unitCost = Number(p.unitCostKes) || 0;
      partsTotal += qty * unitCost;
    }
    const totalCostKes = labourCostKes + partsTotal;

    const log = await prisma.maintenanceLog.create({
      data: {
        printerAssetId: id,
        type,
        date: body.date ? new Date(body.date) : new Date(),
        performedBy: String(body.performedBy ?? (session.user as { name?: string })?.name ?? "Staff").trim(),
        isExternal: Boolean(body.isExternal),
        technicianCompany: body.technicianCompany ? String(body.technicianCompany).trim() : null,
        description: String(body.description ?? "").trim() || "Maintenance",
        labourHours,
        labourCostKes,
        totalCostKes,
        nextServiceDate: body.nextServiceDate ? new Date(body.nextServiceDate) : null,
        nextServiceHours: body.nextServiceHours != null ? Number(body.nextServiceHours) : null,
        notes: body.notes ? String(body.notes).trim() : null,
      },
    });

    for (const p of partsUsed) {
      const quantityUsed = Number(p.quantityUsed) || 0;
      const unitCostKes = Number(p.unitCostKes) || 0;
      if (quantityUsed <= 0 || !p.lfStockItemId) continue;
      await prisma.maintenancePartUsed.create({
        data: {
          maintenanceLogId: log.id,
          lfStockItemId: p.lfStockItemId,
          quantityUsed,
          unitCostKes,
          totalCostKes: quantityUsed * unitCostKes,
        },
      });
    }

    if (body.nextServiceDate) {
      await prisma.printerAsset.update({
        where: { id },
        data: { nextScheduledMaintDate: new Date(body.nextServiceDate) },
      });
    }

    const created = await prisma.maintenanceLog.findUnique({
      where: { id: log.id },
      include: { partsUsed: true },
    });
    return NextResponse.json(created ?? log);
  } catch (e) {
    console.error("Maintenance POST error:", e);
    return NextResponse.json({ error: "Failed to log maintenance" }, { status: 500 });
  }
}
