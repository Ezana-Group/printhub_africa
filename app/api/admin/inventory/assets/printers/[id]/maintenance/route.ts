import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];
const MAINTENANCE_TYPES = [
  "SCHEDULED_SERVICE", "BREAKDOWN_REPAIR", "CLEANING", "CALIBRATION", "PART_REPLACEMENT",
  "FIRMWARE_UPDATE", "INSPECTION",
  "SCHEDULED", "PREVENTIVE", "CORRECTIVE", "EMERGENCY", "UPGRADE",
] as const;

/** GET: List maintenance logs for this printer */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsAdmin);
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
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const asset = await prisma.printerAsset.findUnique({ where: { id } });
    if (!asset) return NextResponse.json({ error: "Printer not found" }, { status: 404 });

    const body = await req.json();
    const performedBy = String(body.performedBy ?? (session.user as { name?: string })?.name ?? "Staff").trim();
    const description = String(body.description ?? "").trim() || "Maintenance";
    if (!performedBy) return NextResponse.json({ error: "Performed by is required" }, { status: 400 });
    if (!description) return NextResponse.json({ error: "Description is required" }, { status: 400 });

    const type = MAINTENANCE_TYPES.includes(body.type as (typeof MAINTENANCE_TYPES)[number]) ? body.type : "INSPECTION";
    const labourHours = Number(body.labourHours) || 0;
    const labourCostKes = Number(body.labourCostKes) ?? 0;
    const parts = Array.isArray(body.parts) ? body.parts : Array.isArray(body.partsUsed) ? body.partsUsed : [];
    const partsToCreate: { partName?: string; quantity: number; unitCostKes: number; totalCostKes: number; lfStockItemId?: string }[] = [];
    for (const p of parts) {
      const qty = Number(p.quantity ?? p.quantityUsed) || 0;
      const unitCost = Number(p.unitCostKes) || 0;
      const totalCostKes = p.totalCostKes != null ? Number(p.totalCostKes) : qty * unitCost;
      const partName = p.partName != null ? String(p.partName).trim() || undefined : undefined;
      if (qty <= 0 && !partName) continue;
      partsToCreate.push({
        partName: partName ?? (p.lfStockItemId ? undefined : "Part"),
        quantity: qty,
        unitCostKes: unitCost,
        totalCostKes,
        lfStockItemId: p.lfStockItemId || undefined,
      });
    }
    const partsCostKes = partsToCreate.reduce((sum, p) => sum + p.totalCostKes, 0);
    const totalCostKes = labourCostKes + partsCostKes;

    const log = await prisma.maintenanceLog.create({
      data: {
        printerAssetId: id,
        type,
        date: body.date ?? body.performedAt ? new Date(body.date ?? body.performedAt) : new Date(),
        performedBy,
        isExternal: Boolean(body.isExternal),
        technicianCompany: body.technicianCompany ? String(body.technicianCompany).trim() : null,
        description,
        labourHours,
        labourCostKes,
        partsCostKes,
        totalCostKes,
        nextServiceDate: body.nextServiceDate ? new Date(body.nextServiceDate) : null,
        nextServiceHours: body.nextServiceHours != null ? Number(body.nextServiceHours) : null,
        notes: body.notes ? String(body.notes).trim() : null,
        hoursAtService: body.hoursAtService != null ? Number(body.hoursAtService) : null,
        createdBy: (session.user as { id?: string })?.id ?? null,
      },
    });

    for (const p of partsToCreate) {
      await prisma.maintenancePartUsed.create({
        data: {
          maintenanceLogId: log.id,
          partName: p.partName,
          lfStockItemId: p.lfStockItemId || null,
          quantityUsed: p.quantity,
          unitCostKes: p.unitCostKes,
          totalCostKes: p.totalCostKes,
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
    return NextResponse.json({ success: true, log: created ?? log });
  } catch (e) {
    console.error("Maintenance POST error:", e);
    return NextResponse.json({ error: "Failed to log maintenance" }, { status: 500 });
  }
}
