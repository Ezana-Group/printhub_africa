import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { LFPrinterSettings, LFBusinessSettings } from "@/lib/lf-calculator-engine";

export const dynamic = "force-dynamic";
export const revalidate = 300;

const DEFAULT_PRINTER: LFPrinterSettings = {
  printerName: "Roland VG3-540",
  printerModel: "VG3-540",
  maxPrintWidthM: 1.52,
  printSpeedSqmPerHour: 15,
  setupTimeHours: 0.25,
  purchasePriceKes: 1_200_000,
  lifespanHours: 20_000,
  annualMaintenanceKes: 120_000,
  powerWatts: 600,
  electricityRateKesKwh: 24,
};

const DEFAULT_BUSINESS: LFBusinessSettings = {
  labourRateKesPerHour: 200,
  finishingTimeEyeletStd: 0.1,
  finishingTimeEyeletHeavy: 0.2,
  finishingTimeHemAll4: 0.25,
  finishingTimeHemTop2: 0.15,
  finishingTimePole: 0.2,
  finishingTimeRope: 0.1,
  monthlyRentKes: 35_000,
  monthlyUtilitiesKes: 8_000,
  monthlyInsuranceKes: 4_000,
  monthlyOtherKes: 3_000,
  workingDaysPerMonth: 26,
  workingHoursPerDay: 8,
  wastageBufferPercent: 3,
  substrateWasteFactor: 1.05,
  rigidSheetWasteFactor: 1.1,
  defaultProfitMarginPct: 40,
  vatRatePct: 16,
  minOrderValueKes: 500,
};

/** GET: Full rates for LF cost engine — printer (from inventory hardware if printerId given), business, materials, laminations, ink, finishing. */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const printerId = searchParams.get("printerId") ?? undefined;

    const [printerAsset, inventoryPrinter, linkedItems, printerRow, businessRow, lfStock, printingMediums, laminationTypes, , designOptions, turnaroundOptions] =
      await Promise.all([
        printerId ? prisma.printerAsset.findFirst({ where: { id: printerId, isActive: true, printerType: "LARGE_FORMAT" } }).catch(() => null) : Promise.resolve(null),
        printerId ? prisma.inventoryHardwareItem.findFirst({ where: { id: printerId, isActive: true, hardwareType: "LARGE_FORMAT_PRINTER" } }).catch(() => null) : Promise.resolve(null),
        printerId
          ? prisma.inventoryHardwareItem.findMany({
              where: { isActive: true, linkedPrinterId: printerId, category: { in: ["MAINTENANCE", "PRINTER_ACCESSORIES"] } },
            }).catch(() => [])
          : Promise.resolve([]),
        prisma.lFPrinterSettings.findFirst({ where: { isDefault: true } }).catch(() => null),
        prisma.lFBusinessSettings.findFirst().catch(() => null),
        prisma.lFStockItem.findMany({ orderBy: { code: "asc" } }).catch(() => []),
        prisma.printingMedium.findMany({
          where: { isActive: true, slug: { not: null } },
          orderBy: { sortOrder: "asc" },
        }),
        prisma.laminationType.findMany({ orderBy: { id: "asc" } }),
        prisma.largeFormatFinishing.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        }),
        prisma.designServiceOption.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        }),
        prisma.turnaroundOption.findMany({
          where: { serviceType: "LARGE_FORMAT", isActive: true },
          orderBy: { sortOrder: "asc" },
        }),
      ]);

    const linkedMaintenanceKes = (linkedItems as Array<{ priceKes: number; timeHours: number | null }>).reduce((s, i) => s + i.priceKes, 0);
    const linkedTimeHours = (linkedItems as Array<{ timeHours: number | null }>).reduce((s, i) => s + (i.timeHours ?? 0), 0);

    const printer: LFPrinterSettings = printerAsset
      ? {
          printerName: printerAsset.name,
          printerModel: printerAsset.model ?? printerAsset.name,
          maxPrintWidthM: printerAsset.maxPrintWidthM ?? DEFAULT_PRINTER.maxPrintWidthM,
          printSpeedSqmPerHour: printerAsset.productionSpeed,
          setupTimeHours: printerAsset.setupTimeHours + linkedTimeHours,
          purchasePriceKes: printerAsset.purchasePriceKes,
          lifespanHours: printerAsset.expectedLifespanHours,
          annualMaintenanceKes: printerAsset.annualMaintenanceKes + linkedMaintenanceKes,
          powerWatts: printerAsset.powerWatts,
          electricityRateKesKwh: printerAsset.electricityRateKesKwh,
        }
      : inventoryPrinter
        ? {
            printerName: inventoryPrinter.name,
            printerModel: inventoryPrinter.model ?? inventoryPrinter.name,
            maxPrintWidthM: inventoryPrinter.maxPrintWidthM ?? DEFAULT_PRINTER.maxPrintWidthM,
            printSpeedSqmPerHour: inventoryPrinter.printSpeedSqmPerHour ?? DEFAULT_PRINTER.printSpeedSqmPerHour,
            setupTimeHours: (inventoryPrinter.setupTimeHours ?? DEFAULT_PRINTER.setupTimeHours) + linkedTimeHours,
            purchasePriceKes: inventoryPrinter.priceKes,
            lifespanHours: inventoryPrinter.lifespanHours ?? DEFAULT_PRINTER.lifespanHours,
            annualMaintenanceKes: (inventoryPrinter.annualMaintenanceKes ?? DEFAULT_PRINTER.annualMaintenanceKes) + linkedMaintenanceKes,
            powerWatts: inventoryPrinter.powerWatts ?? DEFAULT_PRINTER.powerWatts,
            electricityRateKesKwh: inventoryPrinter.electricityRateKesKwh ?? DEFAULT_PRINTER.electricityRateKesKwh,
          }
        : printerRow
        ? {
            printerName: printerRow.name,
            printerModel: printerRow.model,
            maxPrintWidthM: printerRow.maxPrintWidthM,
            printSpeedSqmPerHour: printerRow.printSpeedSqmPerHour,
            setupTimeHours: printerRow.setupTimeHours,
            purchasePriceKes: printerRow.purchasePriceKes,
            lifespanHours: printerRow.lifespanHours,
            annualMaintenanceKes: printerRow.annualMaintenanceKes,
            powerWatts: printerRow.powerWatts,
            electricityRateKesKwh: printerRow.electricityRateKesKwh,
          }
      : DEFAULT_PRINTER;

    const business: LFBusinessSettings = businessRow
      ? {
          labourRateKesPerHour: businessRow.labourRateKesPerHour,
          finishingTimeEyeletStd: businessRow.finishingTimeEyeletStd,
          finishingTimeEyeletHeavy: businessRow.finishingTimeEyeletHeavy,
          finishingTimeHemAll4: businessRow.finishingTimeHemAll4,
          finishingTimeHemTop2: businessRow.finishingTimeHemTop2,
          finishingTimePole: businessRow.finishingTimePole,
          finishingTimeRope: businessRow.finishingTimeRope,
          monthlyRentKes: businessRow.monthlyRentKes,
          monthlyUtilitiesKes: businessRow.monthlyUtilitiesKes,
          monthlyInsuranceKes: businessRow.monthlyInsuranceKes,
          monthlyOtherKes: businessRow.monthlyOtherKes,
          workingDaysPerMonth: businessRow.workingDaysPerMonth,
          workingHoursPerDay: businessRow.workingHoursPerDay,
          wastageBufferPercent: businessRow.wastageBufferPercent,
          substrateWasteFactor: businessRow.substrateWasteFactor,
          rigidSheetWasteFactor: businessRow.rigidSheetWasteFactor,
          defaultProfitMarginPct: businessRow.defaultProfitMarginPct,
          vatRatePct: businessRow.vatRatePct,
          minOrderValueKes: businessRow.minOrderValueKes,
        }
      : DEFAULT_BUSINESS;

    const substrates = lfStock.filter((s) => s.category === "SUBSTRATE_ROLL");
    const laminations = lfStock.filter((s) => s.category === "LAMINATION");
    const finishingItems = lfStock.filter((s) => s.category === "FINISHING");

    const materials =
      substrates.length > 0
        ? substrates.map((s) => ({
            code: s.code,
            name: s.name,
            rollWidthM: s.rollWidthM ?? 1.52,
            averageCostKes: s.averageCostKes,
            lastPurchasePriceKes: s.lastPurchasePriceKes ?? undefined,
            stockAvailableLm: s.unitType === "ROLL_LM" ? s.quantityOnHand : 0,
            lowStockThreshold: s.lowStockThreshold,
            isLowStock: s.quantityOnHand <= s.lowStockThreshold && s.lowStockThreshold > 0,
            isOutOfStock: s.quantityOnHand <= 0,
          }))
        : printingMediums.map((m) => ({
            code: m.slug ?? m.id,
            name: m.name,
            rollWidthM: 1.52,
            averageCostKes: Number(m.pricePerSqMeter) * 1.52,
            lastPurchasePriceKes: undefined as number | undefined,
            stockAvailableLm: 0,
            lowStockThreshold: 0,
            isLowStock: false,
            isOutOfStock: false,
          }));

    const laminationsList =
      laminations.length > 0
        ? laminations.map((l) => ({
            code: l.code,
            name: l.name,
            averageCostKes: l.averageCostKes,
            stockAvailableLm: l.unitType === "ROLL_LM" ? l.quantityOnHand : 0,
          }))
        : laminationTypes.map((l) => ({
            code: l.slug ?? l.id,
            name: l.name,
            averageCostKes: Number(l.pricePerSqm) * 1.52,
            stockAvailableLm: 0,
          }));

    const eyelet = finishingItems.find((f) => f.code.toLowerCase().includes("eyelets") || f.code === "EYELET_STD");
    const hemTape = finishingItems.find((f) => f.code.toLowerCase().includes("hem") || f.code === "HEM_TAPE");
    const rope = finishingItems.find((f) => f.code.toLowerCase().includes("rope"));
    const polePocket = finishingItems.find((f) => f.code.toLowerCase().includes("pole"));
    const packaging = finishingItems.find((f) => f.code.toLowerCase().includes("packaging") || f.code === "PACKAGING");

    const finishingHardware = {
      eyeletCostPerUnit: eyelet ? eyelet.averageCostKes : 3.5,
      hemTapeCostPerM: hemTape ? hemTape.averageCostKes : 12,
      ropeCostPerM: rope ? rope.averageCostKes : 8,
      polePocketCostPerM: polePocket ? polePocket.averageCostKes : 50,
      packagingCostKes: packaging ? packaging.averageCostKes : 100,
    };

    const inkChannelSettings =
      printerRow && printerRow.inkChannelSettings && typeof printerRow.inkChannelSettings === "object"
        ? (printerRow.inkChannelSettings as Record<string, { costKes?: number; sqmPerBottle?: number }>)
        : null;
    const inkCostPerChannel =
      inkChannelSettings && Object.keys(inkChannelSettings).length > 0
        ? Object.values(inkChannelSettings).reduce((sum, ch) => {
            const cost = ch?.costKes ?? 2200;
            const sqm = ch?.sqmPerBottle ?? 15;
            return sum + cost / sqm;
          }, 0) / Math.max(1, Object.keys(inkChannelSettings).length)
        : 147;
    const inkCosts = {
      CMYK: inkCostPerChannel * 4,
      PHOTO: inkCostPerChannel * 6,
      WHITE_INK: inkCostPerChannel * 5,
      BLACK_ONLY: inkCostPerChannel * 1,
    };

    const inkCostsFromInventory = !!(inkChannelSettings && Object.keys(inkChannelSettings).length > 0);
    const finishingFromInventory = {
      eyelet: !!eyelet,
      hemTape: !!hemTape,
      rope: !!rope,
      polePocket: !!polePocket,
      packaging: !!packaging,
    };

    return NextResponse.json({
      printerSettings: printer,
      businessSettings: business,
      materials,
      laminations: laminationsList,
      inkCosts,
      finishingHardware,
      costSources: {
        inkCosts: inkCostsFromInventory ? "inventory" : "default",
        finishing: finishingFromInventory,
      },
      rushOptions: turnaroundOptions.map((t) => ({
        code: t.code,
        name: t.name,
        surchargePercent: Number(t.surchargePercent),
        multiplier: 1 + Number(t.surchargePercent) / 100,
      })),
      designServiceOptions: designOptions.map((d) => ({
        code: d.code,
        name: d.name,
        flatFee: Number(d.flatFee),
      })),
      vatRatePct: business.vatRatePct,
      minOrderValueKes: business.minOrderValueKes,
    });
  } catch (e) {
    console.error("Large format rates error:", e);
    return NextResponse.json(
      {
        printerSettings: DEFAULT_PRINTER,
        businessSettings: DEFAULT_BUSINESS,
        materials: [],
        laminations: [],
        inkCosts: { CMYK: 588, PHOTO: 882, WHITE_INK: 735, BLACK_ONLY: 147 },
        finishingHardware: {
          eyeletCostPerUnit: 3.5,
          hemTapeCostPerM: 12,
          ropeCostPerM: 8,
          polePocketCostPerM: 50,
          packagingCostKes: 100,
        },
        costSources: {
          inkCosts: "default",
          finishing: { eyelet: false, hemTape: false, rope: false, polePocket: false, packaging: false },
        },
        rushOptions: [],
        designServiceOptions: [],
        vatRatePct: 16,
        minOrderValueKes: 500,
      },
      { status: 200 }
    );
  }
}
