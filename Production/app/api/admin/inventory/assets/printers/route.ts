import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

function computePrinterAssetCosts(
  asset: {
    purchasePriceKes: number;
    expectedLifespanHours: number;
    annualMaintenanceKes: number;
    powerWatts: number;
    electricityRateKesKwh: number;
    hoursUsedTotal?: number;
  },
  workingHoursPerMonth: number
) {
  const hoursUsed = asset.hoursUsedTotal ?? 0;
  const depreciationPerHourKes = asset.expectedLifespanHours > 0
    ? asset.purchasePriceKes / asset.expectedLifespanHours
    : 0;
  const maintenancePerHourKes = workingHoursPerMonth * 12 > 0
    ? asset.annualMaintenanceKes / (workingHoursPerMonth * 12)
    : 0;
  const electricityPerHourKes = (asset.powerWatts / 1000) * asset.electricityRateKesKwh;
  const remainingLifespanHours = Math.max(0, asset.expectedLifespanHours - hoursUsed);
  return {
    depreciationPerHourKes,
    maintenancePerHourKes,
    electricityPerHourKes,
    totalMachinePerHourKes: depreciationPerHourKes + maintenancePerHourKes + electricityPerHourKes,
    remainingLifespanHours,
  };
}

/** GET: List all printers for dropdowns and hardware UI. Returns PrinterAsset + InventoryHardwareItem (printers) for backward compat. */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // LARGE_FORMAT | THREE_D (or both)

    const [business, assets, inventoryPrinters] = await Promise.all([
      prisma.lFBusinessSettings.findFirst().catch(() => null),
      prisma.printerAsset.findMany({
        where: {
          isActive: true,
          ...(type === "LARGE_FORMAT" ? { printerType: "LARGE_FORMAT" } : type === "THREE_D" ? { printerType: { in: ["FDM", "RESIN", "HYBRID"] } } : {}),
        },
        orderBy: [{ printerType: "asc" }, { assetTag: "asc" }],
      }),
      prisma.inventoryHardwareItem.findMany({
        where: {
          isActive: true,
          category: "HARDWARE",
          hardwareType: type === "LARGE_FORMAT" ? "LARGE_FORMAT_PRINTER" : type === "THREE_D" ? "THREE_D_PRINTER" : { in: ["LARGE_FORMAT_PRINTER", "THREE_D_PRINTER"] },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    const workingHoursPerMonth = (business?.workingDaysPerMonth ?? 26) * (business?.workingHoursPerDay ?? 8);

    const toListItem = (a: (typeof assets)[0]) => {
      const costs = computePrinterAssetCosts(
        {
          purchasePriceKes: a.purchasePriceKes,
          expectedLifespanHours: a.expectedLifespanHours,
          annualMaintenanceKes: a.annualMaintenanceKes,
          powerWatts: a.powerWatts,
          electricityRateKesKwh: a.electricityRateKesKwh,
          hoursUsedTotal: a.hoursUsedTotal,
        },
        workingHoursPerMonth
      );
      return {
        id: a.id,
        name: a.name,
        source: "PrinterAsset" as const,
        assetTag: a.assetTag,
        printerType: a.printerType,
        status: a.status,
        location: a.location,
        hoursUsedTotal: a.hoursUsedTotal,
        remainingLifespanHours: a.remainingLifespanHours ?? costs.remainingLifespanHours,
        depreciationPerHourKes: a.depreciationPerHourKes ?? costs.depreciationPerHourKes,
        maintenancePerHourKes: a.maintenancePerHourKes ?? costs.maintenancePerHourKes,
        electricityPerHourKes: costs.electricityPerHourKes,
        totalMachinePerHourKes: costs.totalMachinePerHourKes,
        nextScheduledMaintDate: a.nextScheduledMaintDate?.toISOString() ?? null,
        isDefault: a.isDefault,
      };
    };

    const largeFormatAssets = assets.filter((a) => a.printerType === "LARGE_FORMAT").map(toListItem);
    const threeDAssets = assets.filter((a) => ["FDM", "RESIN", "HYBRID"].includes(a.printerType)).map(toListItem);
    const largeFormatInventory = (type === "THREE_D" ? [] : inventoryPrinters.filter((p) => p.hardwareType === "LARGE_FORMAT_PRINTER")).map((p) => ({
      id: p.id,
      name: p.name,
      source: "InventoryHardwareItem" as const,
      assetTag: null,
      printerType: "LARGE_FORMAT",
      status: "ACTIVE",
      location: p.location,
      hoursUsedTotal: null,
      remainingLifespanHours: p.lifespanHours,
      depreciationPerHourKes: p.lifespanHours && p.lifespanHours > 0 ? p.priceKes / p.lifespanHours : null,
      maintenancePerHourKes: null,
      electricityPerHourKes: null,
      totalMachinePerHourKes: null,
      nextScheduledMaintDate: null,
      isDefault: false,
    }));
    const threeDInventory = (type === "LARGE_FORMAT" ? [] : inventoryPrinters.filter((p) => p.hardwareType === "THREE_D_PRINTER")).map((p) => ({
      id: p.id,
      name: p.name,
      source: "InventoryHardwareItem" as const,
      assetTag: null,
      printerType: "FDM",
      location: p.location,
      status: "ACTIVE",
      hoursUsedTotal: null,
      remainingLifespanHours: p.lifespanHours,
      depreciationPerHourKes: null,
      maintenancePerHourKes: null,
      electricityPerHourKes: null,
      totalMachinePerHourKes: null,
      nextScheduledMaintDate: null,
      isDefault: false,
    }));

    return NextResponse.json({
      largeFormatPrinters: [...largeFormatAssets, ...largeFormatInventory],
      threeDPrinters: [...threeDAssets, ...threeDInventory],
      // Flat list for calculator dropdown when type is specified
      ...(type === "LARGE_FORMAT" ? { printers: [...largeFormatAssets, ...largeFormatInventory] } : {}),
      ...(type === "THREE_D" ? { printers: [...threeDAssets, ...threeDInventory] } : {}),
    });
  } catch (e) {
    console.error("Assets printers GET error:", e);
    return NextResponse.json({ error: "Failed to load printers" }, { status: 500 });
  }
}

/** POST: Register a new printer asset */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const printerType = body.printerType ?? "LARGE_FORMAT";
    if (!["LARGE_FORMAT", "FDM", "RESIN", "HYBRID"].includes(printerType)) {
      return NextResponse.json({ error: "Invalid printerType" }, { status: 400 });
    }

    const count = await prisma.printerAsset.count();
    const prefix = printerType === "LARGE_FORMAT" ? "ASSET-LF" : "ASSET-3D";
    const assetTag = body.assetTag ?? `${prefix}-${String(count + 1).padStart(3, "0")}`;

    const existingTag = await prisma.printerAsset.findUnique({ where: { assetTag } }).catch(() => null);
    const finalTag = existingTag ? `${prefix}-${String(Date.now()).slice(-6)}` : assetTag;

    const expectedLifespanHours = Number(body.expectedLifespanHours) || (printerType === "LARGE_FORMAT" ? 20_000 : 5_000);
    const hoursUsedTotal = Number(body.hoursUsedTotal) || 0;
    const purchasePriceKes = Number(body.purchasePriceKes) ?? 0;
    const annualMaintenanceKes = Number(body.annualMaintenanceKes) || 0;
    const workingHoursPerMonth = 26 * 8;

    const asset = await prisma.printerAsset.create({
      data: {
        assetTag: finalTag,
        name: String(body.name ?? "Unnamed printer").trim(),
        manufacturer: body.manufacturer ? String(body.manufacturer).trim() : null,
        model: body.model ? String(body.model).trim() : null,
        serialNumber: body.serialNumber ? String(body.serialNumber).trim() : null,
        printerType: printerType as "LARGE_FORMAT" | "FDM" | "RESIN" | "HYBRID",
        location: body.location ? String(body.location).trim() : null,
        notes: body.notes ? String(body.notes).trim() : null,
        isDefault: Boolean(body.isDefault),
        maxPrintWidthM: body.maxPrintWidthM != null ? Number(body.maxPrintWidthM) : null,
        buildVolumeX: body.buildVolumeX != null ? Number(body.buildVolumeX) : null,
        buildVolumeY: body.buildVolumeY != null ? Number(body.buildVolumeY) : null,
        buildVolumeZ: body.buildVolumeZ != null ? Number(body.buildVolumeZ) : null,
        powerWatts: Number(body.powerWatts) || 0,
        electricityRateKesKwh: Number(body.electricityRateKesKwh) || 24,
        productionSpeed: Number(body.productionSpeed) || (printerType === "LARGE_FORMAT" ? 15 : 18),
        highQualitySpeed: body.highQualitySpeed != null ? Number(body.highQualitySpeed) : null,
        setupTimeHours: Number(body.setupTimeHours) ?? 0.25,
        postProcessingTimeHours: body.postProcessingTimeHours != null ? Number(body.postProcessingTimeHours) : null,
        compatibleMaterials: Array.isArray(body.compatibleMaterials) ? body.compatibleMaterials : [],
        purchasePriceKes,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        supplierName: body.supplierName ? String(body.supplierName).trim() : null,
        expectedLifespanHours,
        annualMaintenanceKes,
        warrantyExpiryDate: body.warrantyExpiryDate ? new Date(body.warrantyExpiryDate) : null,
        insurancePolicyRef: body.insurancePolicyRef ? String(body.insurancePolicyRef).trim() : null,
        hoursUsedTotal,
        hoursUsedThisMonth: Number(body.hoursUsedThisMonth) || 0,
        status: (body.status as "ACTIVE" | "IDLE" | "IN_MAINTENANCE" | "AWAITING_PARTS" | "RETIRED") ?? "ACTIVE",
        nextScheduledMaintDate: body.nextScheduledMaintDate ? new Date(body.nextScheduledMaintDate) : null,
        maintenanceIntervalHours: body.maintenanceIntervalHours != null ? Number(body.maintenanceIntervalHours) : null,
        remainingLifespanHours: Math.max(0, expectedLifespanHours - hoursUsedTotal),
        depreciationPerHourKes: expectedLifespanHours > 0 ? purchasePriceKes / expectedLifespanHours : 0,
        maintenancePerHourKes: workingHoursPerMonth * 12 > 0 ? annualMaintenanceKes / (workingHoursPerMonth * 12) : 0,
      },
    });

    return NextResponse.json(asset);
  } catch (e) {
    console.error("Assets printers POST error:", e);
    return NextResponse.json({ error: "Failed to create printer asset" }, { status: 500 });
  }
}
