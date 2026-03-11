/**
 * PrintHub Large Format Printing Cost Engine
 * Real-cost calculator: materials, ink, labour, machine, overhead, waste, packaging.
 * All costs from database/inventory — no hardcoded rates.
 * printhub.africa | An Ezana Group Company
 */

// ─── SETTINGS TYPES ─────────────────────────────────────────────

export interface LFPrinterSettings {
  printerName: string;
  printerModel: string;
  maxPrintWidthM: number;
  printSpeedSqmPerHour: number;
  setupTimeHours: number;
  purchasePriceKes: number;
  lifespanHours: number;
  annualMaintenanceKes: number;
  powerWatts: number;
  electricityRateKesKwh: number;
}

export interface LFBusinessSettings {
  labourRateKesPerHour: number;
  finishingTimeEyeletStd: number;
  finishingTimeEyeletHeavy: number;
  finishingTimeHemAll4: number;
  finishingTimeHemTop2: number;
  finishingTimePole: number;
  finishingTimeRope: number;
  monthlyRentKes: number;
  monthlyUtilitiesKes: number;
  monthlyInsuranceKes: number;
  monthlyOtherKes: number;
  workingDaysPerMonth: number;
  workingHoursPerDay: number;
  wastageBufferPercent: number;
  substrateWasteFactor: number;
  rigidSheetWasteFactor: number;
  defaultProfitMarginPct: number;
  vatRatePct: number;
  minOrderValueKes: number;
}

export interface LFMaterialCosts {
  substrateCode: string;
  substrateCostPerLm: number;
  substrateRollWidthM: number;
  laminationCode: string | null;
  laminationCostPerLm: number;
  inkCostPerSqm: number;
  eyeletCostPerUnit: number;
  hemTapeCostPerM: number;
  ropeCostPerM: number;
  polePocketCostPerM: number;
  packagingCostKes: number;
}

export interface LFJobInputs {
  widthM: number;
  heightM: number;
  quantity: number;
  materialCode: string;
  laminationCode: string;
  finishing: {
    eyelets: "NONE" | "STANDARD" | "HEAVY";
    hemming: "NONE" | "ALL_4" | "TOP_BOTTOM";
    polePockets: "NONE" | "TOP_BOTTOM" | "TOP_ONLY";
    rope: boolean;
  };
  printType: "CMYK" | "PHOTO" | "WHITE_INK" | "BLACK_ONLY";
  designFeeKes: number;
  rushMultiplier: number;
}

export interface LFCostBreakdown {
  substrateMaterialCost: number;
  inkCost: number;
  laminationMaterialCost: number;
  finishingHardwareCost: number;
  labourCost: number;
  machineCost: number;
  overheadCost: number;
  wastageBuffer: number;
  packagingCost: number;
  totalDirectMaterialCost: number;
  totalProductionCost: number;
  rushSurcharge: number;
  designFee: number;
  profitMarginPct: number;
  profitAmount: number;
  subtotalExVat: number;
  vatAmount: number;
  totalIncVat: number;
  perUnitProductionCost: number;
  perUnitSellingPrice: number;
  quantity: number;
  grossMarginPct: number;
  breakEvenPrice: number;
  contributionMarginKes: number;
  printTimeHours: number;
  finishingTimeHours: number;
  setupTimeHours: number;
  totalJobTimeHours: number;
  substrateMetresRequired: number;
  laminationMetresRequired: number;
  eyeletsRequired: number;
  hemTapeMetresRequired: number;
}

/** Round to nearest KES 10 for customer-facing totals */
export function roundLFToNearest10(value: number): number {
  return Math.ceil(value / 10) * 10;
}

/**
 * Main calculation: 9 cost components + rush + design + profit + VAT.
 * Uses real costs from materials (inventory), printer and business settings.
 */
export function calculateLFPrintCost(
  job: LFJobInputs,
  printer: LFPrinterSettings,
  business: LFBusinessSettings,
  materials: LFMaterialCosts
): LFCostBreakdown {
  const area = job.widthM * job.heightM;
  const perimeter = 2 * (job.widthM + job.heightM);
  const qty = job.quantity;

  // ── 1. SUBSTRATE MATERIAL COST ──────────────────────────────
  const substrateMetresRequired = job.heightM * business.substrateWasteFactor * qty;
  const substrateMaterialCost = substrateMetresRequired * materials.substrateCostPerLm;

  // ── 2. INK COST ─────────────────────────────────────────────
  const inkCost = area * materials.inkCostPerSqm * qty;

  // ── 3. LAMINATION MATERIAL COST ─────────────────────────────
  const laminationMetresRequired =
    materials.laminationCode && materials.laminationCode !== "NONE"
      ? job.heightM * business.substrateWasteFactor * qty
      : 0;
  const laminationMaterialCost = laminationMetresRequired * materials.laminationCostPerLm;

  // ── 4. FINISHING HARDWARE COST ──────────────────────────────
  let eyeletsRequired = 0;
  let hemTapeMetresRequired = 0;
  let finishingHardwareCost = 0;

  if (job.finishing.eyelets === "STANDARD") {
    eyeletsRequired = Math.ceil(perimeter / 0.5) * qty;
    finishingHardwareCost += eyeletsRequired * materials.eyeletCostPerUnit;
  } else if (job.finishing.eyelets === "HEAVY") {
    eyeletsRequired = Math.ceil(perimeter / 0.3) * qty;
    finishingHardwareCost += eyeletsRequired * materials.eyeletCostPerUnit;
  }

  if (job.finishing.hemming === "ALL_4") {
    hemTapeMetresRequired = perimeter * qty * 1.1;
    finishingHardwareCost += hemTapeMetresRequired * materials.hemTapeCostPerM;
  } else if (job.finishing.hemming === "TOP_BOTTOM") {
    hemTapeMetresRequired = job.widthM * 2 * qty * 1.1;
    finishingHardwareCost += hemTapeMetresRequired * materials.hemTapeCostPerM;
  }

  if (job.finishing.polePockets !== "NONE") {
    const webbingM =
      job.finishing.polePockets === "TOP_BOTTOM"
        ? job.widthM * 2 * qty * 1.1
        : job.widthM * qty * 1.1;
    finishingHardwareCost += webbingM * materials.polePocketCostPerM;
  }

  if (job.finishing.rope) {
    const ropeMetres = perimeter * 1.2 * qty;
    finishingHardwareCost += ropeMetres * materials.ropeCostPerM;
  }

  const packagingCost = materials.packagingCostKes;

  // ── 5. LABOUR COST ─────────────────────────────────────────
  const printTimeHours = (area / printer.printSpeedSqmPerHour) * qty;
  const setupTimeHours = printer.setupTimeHours;

  const finishingTimePerUnit =
    (job.finishing.eyelets !== "NONE"
      ? job.finishing.eyelets === "STANDARD"
        ? business.finishingTimeEyeletStd
        : business.finishingTimeEyeletHeavy
      : 0) +
    (job.finishing.hemming !== "NONE"
      ? job.finishing.hemming === "ALL_4"
        ? business.finishingTimeHemAll4
        : business.finishingTimeHemTop2
      : 0) +
    (job.finishing.polePockets !== "NONE" ? business.finishingTimePole : 0) +
    (job.finishing.rope ? business.finishingTimeRope : 0);
  const finishingTimeHours = finishingTimePerUnit * qty;

  const totalJobTimeHours = printTimeHours + finishingTimeHours + setupTimeHours;
  const labourCost = totalJobTimeHours * business.labourRateKesPerHour;

  // ── 6. MACHINE COST ─────────────────────────────────────────
  const depreciationCost =
    (printer.purchasePriceKes / printer.lifespanHours) * printTimeHours;
  const electricityCost =
    (printer.powerWatts / 1000) *
    printTimeHours *
    printer.electricityRateKesKwh;
  const monthlyMachineHours =
    business.workingDaysPerMonth * business.workingHoursPerDay;
  const maintenanceCost =
    (printer.annualMaintenanceKes / (monthlyMachineHours * 12)) * printTimeHours;
  const machineCost = depreciationCost + electricityCost + maintenanceCost;

  // ── 7. OVERHEAD COST ───────────────────────────────────────
  const monthlyOverhead =
    business.monthlyRentKes +
    business.monthlyUtilitiesKes +
    business.monthlyInsuranceKes +
    business.monthlyOtherKes;
  const overheadCost =
    (monthlyOverhead / monthlyMachineHours) * totalJobTimeHours;

  // ── 8. WASTAGE BUFFER ──────────────────────────────────────
  const totalDirectMaterialCost =
    substrateMaterialCost +
    inkCost +
    laminationMaterialCost +
    finishingHardwareCost;
  const wastageBuffer =
    totalDirectMaterialCost * (business.wastageBufferPercent / 100);

  // ── 9. TOTAL PRODUCTION COST ───────────────────────────────
  const totalProductionCost =
    substrateMaterialCost +
    inkCost +
    laminationMaterialCost +
    finishingHardwareCost +
    labourCost +
    machineCost +
    overheadCost +
    wastageBuffer +
    packagingCost;

  const rushSurcharge = (job.rushMultiplier - 1) * totalProductionCost;
  const designFee = job.designFeeKes;

  const subtotalBeforeProfit = totalProductionCost + rushSurcharge + designFee;
  const profitMarginPct = business.defaultProfitMarginPct;
  const profitAmount = subtotalBeforeProfit * (profitMarginPct / 100);
  const subtotalExVat = subtotalBeforeProfit + profitAmount;
  const vatAmount = subtotalExVat * (business.vatRatePct / 100);
  let totalIncVat = subtotalExVat + vatAmount;
  totalIncVat = Math.max(
    roundLFToNearest10(totalIncVat),
    business.minOrderValueKes
  );

  return {
    substrateMaterialCost,
    inkCost,
    laminationMaterialCost,
    finishingHardwareCost,
    labourCost,
    machineCost,
    overheadCost,
    wastageBuffer,
    packagingCost,
    totalDirectMaterialCost,
    totalProductionCost,
    rushSurcharge,
    designFee,
    profitMarginPct,
    profitAmount,
    subtotalExVat,
    vatAmount,
    totalIncVat,
    perUnitProductionCost: totalProductionCost / qty,
    perUnitSellingPrice: totalIncVat / qty,
    quantity: qty,
    grossMarginPct: profitMarginPct,
    breakEvenPrice: subtotalBeforeProfit,
    contributionMarginKes: area * qty > 0 ? profitAmount / (area * qty) : 0,
    printTimeHours,
    finishingTimeHours,
    setupTimeHours,
    totalJobTimeHours,
    substrateMetresRequired,
    laminationMetresRequired,
    eyeletsRequired,
    hemTapeMetresRequired,
  };
}
