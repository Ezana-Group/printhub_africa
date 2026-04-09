import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PRINTER_SETTINGS,
  type PrinterSettings,
  type MaterialRate,
} from "@/lib/3d-calculator-engine";

export const dynamic = "force-dynamic";
export const revalidate = 300; // 5 min cache hint for ISR/fetch

/** GET: Printer settings + material rates for 3D calculators. Public, cached.
 *  If printerId is provided, printer settings are taken from Inventory → Hardware (3D printer).
 *  Material costs come only from Inventory → 3D printing → Filament (cost per kg). No PrintMaterial fallback.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const printerId = searchParams.get("printerId") ?? undefined;

    const [printerAsset, inventoryPrinter, linkedItems, inventoryFilament, config, business, supportRemovalAddons, finishingAddons] = await Promise.all([
      printerId ? prisma.printerAsset.findFirst({ where: { id: printerId, isActive: true, printerType: { in: ["FDM", "RESIN", "HYBRID"] } } }).catch(() => null) : Promise.resolve(null),
      printerId ? prisma.inventoryHardwareItem.findFirst({ where: { id: printerId, isActive: true, hardwareType: "THREE_D_PRINTER" } }).catch(() => null) : Promise.resolve(null),
      printerId
        ? prisma.inventoryHardwareItem.findMany({
            where: { isActive: true, linkedPrinterId: printerId, category: { in: ["MAINTENANCE", "PRINTER_ACCESSORIES"] } },
          }).catch(() => [])
        : Promise.resolve([]),
      prisma.threeDConsumable.findMany({
        where: { kind: "FILAMENT", costPerKgKes: { not: null } },
        orderBy: [{ name: "asc" }, { specification: "asc" }],
      }),
      prisma.pricingConfig.findUnique({
        where: { key: "3dPrinterSettings" },
      }),
      prisma.lFBusinessSettings.findFirst().catch(() => null),
      prisma.threeDAddon.findMany({ where: { category: "SUPPORT_REMOVAL", isActive: true } }),
      prisma.threeDAddon.findMany({ where: { category: "FINISHING", isActive: true } }),
    ]);

    let printerSettings: PrinterSettings = { ...DEFAULT_PRINTER_SETTINGS };
    
    // 1. Start with the "Pricing Config" overrides if they exist
    if (config?.valueJson) {
      try {
        const parsed = JSON.parse(config.valueJson) as Partial<PrinterSettings>;
        printerSettings = { ...printerSettings, ...parsed };
      } catch {
        // use defaults
      }
    }

    // 2. Map verified Business Settings (Labour, Rent, VAT) - these take precedence for consistency
    if (business) {
      printerSettings = {
        ...printerSettings,
        // Use the new separate 3D labor rate
        laborRateKesPerHour: (business as any).threeDLabourRateKesPerHour ?? business.labourRateKesPerHour ?? printerSettings.laborRateKesPerHour,
        monthlyRentKes: business.monthlyRentKes ?? printerSettings.monthlyRentKes,
        monthlyUtilitiesKes: business.monthlyUtilitiesKes ?? printerSettings.monthlyUtilitiesKes,
        monthlyInsuranceKes: business.monthlyInsuranceKes ?? printerSettings.monthlyInsuranceKes,
        vatRatePercent: business.vatRatePct ?? printerSettings.vatRatePercent,
        profitMarginPercent: business.defaultProfitMarginPct ?? printerSettings.profitMarginPercent,
        // Unified 3D-specific settings
        failedPrintRatePercent: (business as any).threeDFailedPrintBufferPct ?? printerSettings.failedPrintRatePercent,
        packagingCostKes: (business as any).threeDPackagingFeeKes ?? printerSettings.packagingCostKes,
      };
    }
    const linkedMaintenanceKes = (linkedItems as Array<{ priceKes: number }>).reduce((s, i) => s + i.priceKes, 0);
    const linkedTimeHours = (linkedItems as Array<{ timeHours: number | null }>).reduce((s, i) => s + (i.timeHours ?? 0), 0);

    if (printerAsset) {
      printerSettings = {
        ...printerSettings,
        printerModel: printerAsset.name,
        powerWatts: printerAsset.powerWatts,
        electricityRateKesKwh: printerAsset.electricityRateKesKwh,
        printerPurchasePriceKes: printerAsset.purchasePriceKes,
        lifespanHours: printerAsset.expectedLifespanHours,
        maintenancePerYearKes: printerAsset.annualMaintenanceKes + linkedMaintenanceKes,
        postProcessingTimeHours: (printerAsset.postProcessingTimeHours ?? printerSettings.postProcessingTimeHours) + linkedTimeHours,
        // Printer-level overrides
        failedPrintRatePercent: (printerAsset as any).failedPrintBufferPct ?? printerSettings.failedPrintRatePercent,
        packagingCostKes: (printerAsset as any).packagingFeeKes ?? printerSettings.packagingCostKes,
      };
    } else if (inventoryPrinter) {
      printerSettings = {
        ...printerSettings,
        printerModel: inventoryPrinter.name,
        powerWatts: inventoryPrinter.powerWatts ?? printerSettings.powerWatts,
        electricityRateKesKwh: inventoryPrinter.electricityRateKesKwh ?? printerSettings.electricityRateKesKwh,
        printerPurchasePriceKes: inventoryPrinter.priceKes,
        lifespanHours: inventoryPrinter.lifespanHours ?? printerSettings.lifespanHours,
        maintenancePerYearKes: (inventoryPrinter.maintenancePerYearKes ?? printerSettings.maintenancePerYearKes) + linkedMaintenanceKes,
        postProcessingTimeHours: (inventoryPrinter.postProcessingTimeHours ?? printerSettings.postProcessingTimeHours) + linkedTimeHours,
      };
    }

    // Material costs from Inventory → 3D printing → Filament (cost per kg). Price per gram = costPerKgKes / 1000.
    // Expose baseMaterial (e.g. "PLA+") and color (e.g. "Black") so UI can show material dropdown + colour pills separately.
    type MaterialWithColors = MaterialRate & { colorOptions?: string[]; baseMaterial?: string; color?: string; quantity?: number };
    const materialsList: MaterialWithColors[] = inventoryFilament.map((m) => {
      const base = (m.name ?? "").trim();
      const colorPart = (m.specification ?? "").trim();
      const displayName = colorPart ? `${base} (${colorPart})` : base;
      return {
        name: displayName,
        code: m.id,
        costPerKgKes: Number(m.costPerKgKes),
        colorOptions: [] as string[],
        baseMaterial: base || undefined,
        color: colorPart || undefined,
        quantity: m.quantity ?? 0,
      };
    });

    const postProcessingFeePerUnit = (business as any)?.postProcessingFeePerUnit ?? 200;

    const printerSettingsWithFee = {
      ...printerSettings,
      postProcessingFeePerUnit,
    };

    return NextResponse.json({
      printerSettings: printerSettingsWithFee,
      materials: materialsList,
      postProcessingOptions: [
        { code: "NONE", name: "None" },
        { code: "SUPPORT_REMOVAL", name: "Post-processing / support removal" },
        { code: "PAINT", name: "Painting / finishing" },
      ],
      rushOptions: [
        { code: "STD", name: "Standard", surchargePercent: 0 },
        { code: "EXPRESS", name: "Express turnaround", surchargePercent: 40 },
      ],
    });
  } catch (e) {
    console.error("3D rates error:", e);
    return NextResponse.json(
      {
        printerSettings: DEFAULT_PRINTER_SETTINGS,
        materials: [],
        postProcessingOptions: [],
        rushOptions: [],
      },
      { status: 200 }
    );
  }
}
