import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import {
  calculatePrintCost,
  roundUpToTen,
  DEFAULT_PRINTER_SETTINGS,
  type PrinterSettings,
  type MaterialRate,
  type CostBreakdown,
} from "@/lib/3d-calculator-engine";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_view" });
  if (auth instanceof NextResponse) return auth;
  const { id: itemId } = await params;

  const item = await prisma.catalogueItem.findUnique({
    where: { id: itemId },
    select: {
      weightGrams: true,
      printTimeHours: true,
      supportsRequired: true,
      availableMaterials: {
        orderBy: { isDefault: "desc" },
        take: 1,
        select: { materialCode: true, materialName: true },
      },
    },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const weightGrams = item.weightGrams ?? 0;
  const printTimeHours = item.printTimeHours ?? 0;
  if (!weightGrams || !printTimeHours) {
    return NextResponse.json(
      { error: "Set weight (g) and print time (hours) on the item first." },
      { status: 400 }
    );
  }

  const [filament, config] = await Promise.all([
    prisma.threeDConsumable.findMany({
      where: { kind: "FILAMENT", costPerKgKes: { not: null } },
      orderBy: [{ name: "asc" }, { specification: "asc" }],
    }),
    prisma.pricingConfig.findUnique({ where: { key: "3dPrinterSettings" } }),
  ]);

  let printerSettings: PrinterSettings = { ...DEFAULT_PRINTER_SETTINGS };
  if (config?.valueJson) {
    try {
      const parsed = JSON.parse(config.valueJson) as Partial<PrinterSettings>;
      printerSettings = { ...DEFAULT_PRINTER_SETTINGS, ...parsed };
    } catch {
      // use defaults
    }
  }

  const materials: MaterialRate[] = filament.map((m) => ({
    name: (m.specification ? `${m.name ?? ""} (${m.specification})` : (m.name ?? "")).trim() || m.id,
    code: m.id,
    costPerKgKes: Number(m.costPerKgKes),
  }));

  const preferredCode = item.availableMaterials[0]?.materialCode;
  const materialMatch = preferredCode
    ? materials.find(
        (m) =>
          m.code === preferredCode ||
          m.name.toUpperCase().includes(preferredCode.toUpperCase())
      )
    : null;
  const materialCode = materialMatch?.code ?? materials[0]?.code;
  if (!materialCode) {
    return NextResponse.json(
      { error: "No filament with cost configured in Inventory → 3D printing." },
      { status: 400 }
    );
  }

  const breakdown: CostBreakdown = calculatePrintCost(
    {
      name: itemId,
      material: materialCode,
      weightGrams,
      printTimeHours,
      postProcessing: item.supportsRequired ?? false,
      quantity: 1,
    },
    printerSettings,
    materials,
    40
  );

  const suggestedPrice = roundUpToTen(breakdown.perUnitSellingPrice);

  return NextResponse.json({
    breakdown: {
      materialCost: Math.round(breakdown.materialCost),
      electricityCost: Math.round(breakdown.electricityCost),
      depreciationCost: Math.round(breakdown.depreciationCost),
      maintenanceCost: Math.round(breakdown.maintenanceCost),
      laborCost: Math.round(breakdown.laborCost),
      overheadCost: Math.round(breakdown.overheadCost),
      failedPrintBuffer: Math.round(breakdown.failedPrintBuffer),
      packagingCost: Math.round(breakdown.packagingCost),
      totalCost: Math.round(breakdown.totalProductionCost),
      profitAmount: Math.round(breakdown.profitAmount),
      suggestedPriceExVat: Math.round(breakdown.sellingPriceExVat),
      vatAmount: Math.round(breakdown.vatAmount),
      suggestedPriceIncVat: Math.round(breakdown.sellingPriceIncVat),
    },
    suggestedPriceRounded: suggestedPrice,
    materialUsed: materialMatch?.name ?? materials.find((m) => m.code === materialCode)?.name ?? materialCode,
  });
}
