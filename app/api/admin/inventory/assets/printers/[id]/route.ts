import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

function computeCosts(asset: {
  purchasePriceKes: number;
  expectedLifespanHours: number;
  annualMaintenanceKes: number;
  powerWatts: number;
  electricityRateKesKwh: number;
  hoursUsedTotal: number;
}, workingHoursPerMonth: number) {
  const dep = asset.expectedLifespanHours > 0 ? asset.purchasePriceKes / asset.expectedLifespanHours : 0;
  const maint = workingHoursPerMonth * 12 > 0 ? asset.annualMaintenanceKes / (workingHoursPerMonth * 12) : 0;
  const electricityPerHourKes = (asset.powerWatts / 1000) * asset.electricityRateKesKwh;
  return {
    depreciationPerHourKes: dep,
    maintenancePerHourKes: maint,
    electricityPerHourKes,
    remainingLifespanHours: Math.max(0, asset.expectedLifespanHours - asset.hoursUsedTotal),
  };
}

/** GET: Single printer asset with computed costs */
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
    const [business, asset] = await Promise.all([
      prisma.lFBusinessSettings.findFirst().catch(() => null),
      prisma.printerAsset.findUnique({ where: { id } }),
    ]);
    if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const wh = (business?.workingDaysPerMonth ?? 26) * (business?.workingHoursPerDay ?? 8);
    const costs = computeCosts(
      {
        purchasePriceKes: asset.purchasePriceKes,
        expectedLifespanHours: asset.expectedLifespanHours,
        annualMaintenanceKes: asset.annualMaintenanceKes,
        powerWatts: asset.powerWatts,
        electricityRateKesKwh: asset.electricityRateKesKwh,
        hoursUsedTotal: asset.hoursUsedTotal,
      },
      wh
    );
    const electricityPerHourKes = costs.electricityPerHourKes;
    return NextResponse.json({
      ...asset,
      purchaseDate: asset.purchaseDate?.toISOString() ?? null,
      warrantyExpiryDate: asset.warrantyExpiryDate?.toISOString() ?? null,
      nextScheduledMaintDate: asset.nextScheduledMaintDate?.toISOString() ?? null,
      depreciationPerHourKes: asset.depreciationPerHourKes ?? costs.depreciationPerHourKes,
      maintenancePerHourKes: asset.maintenancePerHourKes ?? costs.maintenancePerHourKes,
      remainingLifespanHours: asset.remainingLifespanHours ?? costs.remainingLifespanHours,
      electricityPerHourKes,
      totalMachinePerHourKes: (asset.depreciationPerHourKes ?? costs.depreciationPerHourKes) + (asset.maintenancePerHourKes ?? costs.maintenancePerHourKes) + electricityPerHourKes,
    });
  } catch (e) {
    console.error("Printer asset GET error:", e);
    return NextResponse.json({ error: "Failed to load asset" }, { status: 500 });
  }
}

/** PATCH: Update printer asset */
export async function PATCH(
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
    const body = await req.json();
    const existing = await prisma.printerAsset.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data: Record<string, unknown> = {};
    const str = (v: unknown) => (v != null ? String(v).trim() : undefined);
    const num = (v: unknown) => (v != null ? Number(v) : undefined);
    const date = (v: unknown) => (v != null ? new Date(v as string) : undefined);

    if (body.name !== undefined) data.name = str(body.name) ?? existing.name;
    if (body.manufacturer !== undefined) data.manufacturer = str(body.manufacturer);
    if (body.model !== undefined) data.model = str(body.model);
    if (body.serialNumber !== undefined) data.serialNumber = str(body.serialNumber);
    if (body.location !== undefined) data.location = str(body.location);
    if (body.notes !== undefined) data.notes = str(body.notes);
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
    if (body.isDefault !== undefined) data.isDefault = Boolean(body.isDefault);
    if (body.status !== undefined) data.status = body.status;
    if (body.maxPrintWidthM !== undefined) data.maxPrintWidthM = num(body.maxPrintWidthM);
    if (body.powerWatts !== undefined) data.powerWatts = num(body.powerWatts) ?? existing.powerWatts;
    if (body.electricityRateKesKwh !== undefined) data.electricityRateKesKwh = num(body.electricityRateKesKwh) ?? existing.electricityRateKesKwh;
    if (body.productionSpeed !== undefined) data.productionSpeed = num(body.productionSpeed) ?? existing.productionSpeed;
    if (body.highQualitySpeed !== undefined) data.highQualitySpeed = num(body.highQualitySpeed);
    if (body.setupTimeHours !== undefined) data.setupTimeHours = num(body.setupTimeHours) ?? existing.setupTimeHours;
    if (body.postProcessingTimeHours !== undefined) data.postProcessingTimeHours = num(body.postProcessingTimeHours);
    if (body.purchasePriceKes !== undefined) data.purchasePriceKes = num(body.purchasePriceKes) ?? existing.purchasePriceKes;
    if (body.purchaseDate !== undefined) data.purchaseDate = date(body.purchaseDate);
    if (body.supplierName !== undefined) data.supplierName = str(body.supplierName);
    if (body.expectedLifespanHours !== undefined) data.expectedLifespanHours = num(body.expectedLifespanHours) ?? existing.expectedLifespanHours;
    if (body.annualMaintenanceKes !== undefined) data.annualMaintenanceKes = num(body.annualMaintenanceKes) ?? existing.annualMaintenanceKes;
    if (body.warrantyExpiryDate !== undefined) data.warrantyExpiryDate = date(body.warrantyExpiryDate);
    if (body.insurancePolicyRef !== undefined) data.insurancePolicyRef = str(body.insurancePolicyRef);
    if (body.hoursUsedTotal !== undefined) data.hoursUsedTotal = num(body.hoursUsedTotal) ?? existing.hoursUsedTotal;
    if (body.nextScheduledMaintDate !== undefined) data.nextScheduledMaintDate = date(body.nextScheduledMaintDate);
    if (body.maintenanceIntervalHours !== undefined) data.maintenanceIntervalHours = num(body.maintenanceIntervalHours);
    if (body.compatibleMaterials !== undefined) data.compatibleMaterials = Array.isArray(body.compatibleMaterials) ? body.compatibleMaterials : existing.compatibleMaterials;

    const updated = await prisma.printerAsset.update({
      where: { id },
      data: data as Parameters<typeof prisma.printerAsset.update>[0]["data"],
    });

    const business = await prisma.lFBusinessSettings.findFirst().catch(() => null);
    const wh = (business?.workingDaysPerMonth ?? 26) * (business?.workingHoursPerDay ?? 8);
    const costs = computeCosts(
      {
        purchasePriceKes: updated.purchasePriceKes,
        expectedLifespanHours: updated.expectedLifespanHours,
        annualMaintenanceKes: updated.annualMaintenanceKes,
        powerWatts: updated.powerWatts,
        electricityRateKesKwh: updated.electricityRateKesKwh,
        hoursUsedTotal: updated.hoursUsedTotal,
      },
      wh
    );
    const remainingLifespanHours = Math.max(0, updated.expectedLifespanHours - updated.hoursUsedTotal);
    await prisma.printerAsset.update({
      where: { id },
      data: {
        remainingLifespanHours,
        depreciationPerHourKes: costs.depreciationPerHourKes,
        maintenancePerHourKes: costs.maintenancePerHourKes,
      },
    });

    const refetched = await prisma.printerAsset.findUnique({ where: { id } });
    return NextResponse.json({ success: true, machine: refetched ?? updated });
  } catch (e) {
    console.error("Printer asset PATCH error:", e);
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 });
  }
}

/** DELETE: Soft delete (set inactive) or hard delete if no production history */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const asset = await prisma.printerAsset.findUnique({
      where: { id },
      include: {
        _count: { select: { maintenanceLogs: true } },
      },
    });
    if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Check production queue for any jobs assigned to this asset (machineId may reference printer)
    const productionCount = await (prisma as unknown as { productionQueue: { count: (args: { where: { machineId: string } }) => Promise<number> } }).productionQueue?.count?.({ where: { machineId: id } }).catch(() => 0) ?? 0;
    if (productionCount > 0) {
      return NextResponse.json({
        error: "Cannot delete printer with production history. Set status to RETIRED instead.",
        code: "HAS_PRODUCTION_HISTORY",
        productionJobs: productionCount,
      }, { status: 400 });
    }

    await prisma.maintenanceLog.deleteMany({ where: { printerAssetId: id } });
    await prisma.printerAsset.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Printer asset DELETE error:", e);
    return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 });
  }
}
