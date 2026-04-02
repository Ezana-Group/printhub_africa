import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];
const CATEGORIES = ["HARDWARE", "MAINTENANCE", "PRINTER_ACCESSORIES"] as const;
const HARDWARE_TYPES = ["LARGE_FORMAT_PRINTER", "THREE_D_PRINTER"] as const;

/** GET: List inventory hardware items, optional filter by category */
export async function GET(req: Request) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const hardwareType = searchParams.get("hardwareType"); // for calculator dropdowns

    const where: { category?: string; hardwareType?: string; isActive?: boolean } = {};
    if (category && CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
      where.category = category;
    }
    if (hardwareType && HARDWARE_TYPES.includes(hardwareType as (typeof HARDWARE_TYPES)[number])) {
      where.hardwareType = hardwareType;
    }
    where.isActive = true;

    const items = await prisma.inventoryHardwareItem.findMany({
      where,
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(
      items.map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        priceKes: i.priceKes,
        location: i.location ?? null,
        linkedPrinterId: i.linkedPrinterId ?? null,
        timeHours: i.timeHours ?? null,
        hardwareType: i.hardwareType ?? null,
        printerSubType: i.printerSubType ?? null,
        model: i.model ?? null,
        maxPrintWidthM: i.maxPrintWidthM ?? null,
        printSpeedSqmPerHour: i.printSpeedSqmPerHour ?? null,
        setupTimeHours: i.setupTimeHours ?? null,
        lifespanHours: i.lifespanHours ?? null,
        annualMaintenanceKes: i.annualMaintenanceKes ?? null,
        powerWatts: i.powerWatts ?? null,
        electricityRateKesKwh: i.electricityRateKesKwh ?? null,
        maintenancePerYearKes: i.maintenancePerYearKes ?? null,
        postProcessingTimeHours: i.postProcessingTimeHours ?? null,
        isActive: i.isActive,
        sortOrder: i.sortOrder,
      }))
    );
  } catch (e) {
    console.error("Hardware items GET error:", e);
    return NextResponse.json({ error: "Failed to load items" }, { status: 500 });
  }
}

/** POST: Create a new inventory hardware/maintenance/accessory item */
export async function POST(req: Request) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const category = CATEGORIES.includes(body.category) ? body.category : "HARDWARE";
    const priceKes = Math.max(0, Number(body.priceKes) ?? 0);
    const hardwareType =
      body.hardwareType && HARDWARE_TYPES.includes(body.hardwareType) ? body.hardwareType : null;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const item = await prisma.inventoryHardwareItem.create({
      data: {
        name,
        category,
        priceKes,
        location: body.location != null ? String(body.location).trim() || null : null,
        linkedPrinterId: body.linkedPrinterId != null ? String(body.linkedPrinterId).trim() || null : null,
        timeHours: body.timeHours != null ? Number(body.timeHours) : null,
        hardwareType,
        printerSubType: body.printerSubType != null ? String(body.printerSubType).trim() || null : null,
        model: body.model != null ? String(body.model) : null,
        maxPrintWidthM: body.maxPrintWidthM != null ? Number(body.maxPrintWidthM) : null,
        printSpeedSqmPerHour: body.printSpeedSqmPerHour != null ? Number(body.printSpeedSqmPerHour) : null,
        setupTimeHours: body.setupTimeHours != null ? Number(body.setupTimeHours) : null,
        lifespanHours: body.lifespanHours != null ? Number(body.lifespanHours) : null,
        annualMaintenanceKes: body.annualMaintenanceKes != null ? Number(body.annualMaintenanceKes) : null,
        powerWatts: body.powerWatts != null ? Number(body.powerWatts) : null,
        electricityRateKesKwh: body.electricityRateKesKwh != null ? Number(body.electricityRateKesKwh) : null,
        maintenancePerYearKes: body.maintenancePerYearKes != null ? Number(body.maintenancePerYearKes) : null,
        postProcessingTimeHours: body.postProcessingTimeHours != null ? Number(body.postProcessingTimeHours) : null,
      },
    });

    return NextResponse.json(item);
  } catch (e) {
    console.error("Hardware items POST error:", e);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
