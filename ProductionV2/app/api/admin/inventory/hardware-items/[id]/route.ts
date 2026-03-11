import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];
const HARDWARE_TYPES = ["LARGE_FORMAT_PRINTER", "THREE_D_PRINTER"] as const;

/** PATCH: Update an inventory hardware item */
export async function PATCH(
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
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.name != null) data.name = String(body.name).trim();
    if (body.category != null) data.category = body.category;
    if (body.priceKes != null) data.priceKes = Math.max(0, Number(body.priceKes));
    if (body.hardwareType != null)
      data.hardwareType = HARDWARE_TYPES.includes(body.hardwareType) ? body.hardwareType : null;
    if (body.printerSubType !== undefined) data.printerSubType = body.printerSubType != null ? String(body.printerSubType).trim() || null : null;
    if (body.model !== undefined) data.model = body.model != null ? String(body.model) : null;
    if (body.maxPrintWidthM !== undefined) data.maxPrintWidthM = body.maxPrintWidthM != null ? Number(body.maxPrintWidthM) : null;
    if (body.printSpeedSqmPerHour !== undefined) data.printSpeedSqmPerHour = body.printSpeedSqmPerHour != null ? Number(body.printSpeedSqmPerHour) : null;
    if (body.setupTimeHours !== undefined) data.setupTimeHours = body.setupTimeHours != null ? Number(body.setupTimeHours) : null;
    if (body.lifespanHours !== undefined) data.lifespanHours = body.lifespanHours != null ? Number(body.lifespanHours) : null;
    if (body.annualMaintenanceKes !== undefined) data.annualMaintenanceKes = body.annualMaintenanceKes != null ? Number(body.annualMaintenanceKes) : null;
    if (body.powerWatts !== undefined) data.powerWatts = body.powerWatts != null ? Number(body.powerWatts) : null;
    if (body.electricityRateKesKwh !== undefined) data.electricityRateKesKwh = body.electricityRateKesKwh != null ? Number(body.electricityRateKesKwh) : null;
    if (body.maintenancePerYearKes !== undefined) data.maintenancePerYearKes = body.maintenancePerYearKes != null ? Number(body.maintenancePerYearKes) : null;
    if (body.postProcessingTimeHours !== undefined) data.postProcessingTimeHours = body.postProcessingTimeHours != null ? Number(body.postProcessingTimeHours) : null;
    if (body.location !== undefined) data.location = body.location != null ? String(body.location).trim() || null : null;
    if (body.linkedPrinterId !== undefined) data.linkedPrinterId = body.linkedPrinterId != null ? String(body.linkedPrinterId).trim() || null : null;
    if (body.timeHours !== undefined) data.timeHours = body.timeHours != null ? Number(body.timeHours) : null;
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    const item = await prisma.inventoryHardwareItem.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch (e) {
    console.error("Hardware item PATCH error:", e);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

/** DELETE: Soft-deactivate or delete */
export async function DELETE(
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
    await prisma.inventoryHardwareItem.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Hardware item DELETE error:", e);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
