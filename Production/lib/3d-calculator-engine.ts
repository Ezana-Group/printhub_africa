// ============================================================
// PRINTHUB 3D PRINT PRICING ENGINE
// All three calculators (customer, admin, sales) use this.
// Rates come from DB via API. Fallback to defaults shown below.
// ============================================================

export interface PrinterSettings {
  printerModel: string;
  powerWatts: number;
  electricityRateKesKwh: number;
  printerPurchasePriceKes: number;
  lifespanHours: number;
  maintenancePerYearKes: number;
  laborRateKesPerHour: number;
  postProcessingTimeHours: number;
  monthlyRentKes: number;
  monthlyUtilitiesKes: number;
  monthlyInsuranceKes: number;
  workingDaysPerMonth: number;
  workingHoursPerDay: number;
  failedPrintRatePercent: number;
  packagingCostKes: number;
  profitMarginPercent: number;
  vatRatePercent: number;
}

export interface MaterialRate {
  name: string;
  code: string;
  costPerKgKes: number;
  stockKg?: number;
}

export interface PrintJob {
  name: string;
  material: string;
  weightGrams: number;
  printTimeHours: number;
  postProcessing: boolean;
  quantity: number;
}

export interface CostBreakdown {
  materialCost: number;
  electricityCost: number;
  depreciationCost: number;
  maintenanceCost: number;
  laborCost: number;
  overheadCost: number;
  failedPrintBuffer: number;
  packagingCost: number;
  totalProductionCost: number;
  profitAmount: number;
  sellingPriceExVat: number;
  vatAmount: number;
  sellingPriceIncVat: number;
  perUnitCost: number;
  perUnitSellingPrice: number;
  quantity: number;
  grossMarginPercent: number;
  breakEvenPrice: number;
}

export function calculatePrintCost(
  job: PrintJob,
  settings: PrinterSettings,
  materials: MaterialRate[],
  profitMarginPercentOverride?: number
): CostBreakdown {
  const material = materials.find((m) => m.code === job.material);
  if (!material) throw new Error(`Material ${job.material} not found`);

  const qty = job.quantity || 1;
  const marginPercent =
    profitMarginPercentOverride ?? settings.profitMarginPercent;

  const materialCost = (job.weightGrams / 1000) * material.costPerKgKes;

  const electricityCost =
    (settings.powerWatts / 1000) *
    job.printTimeHours *
    settings.electricityRateKesKwh;

  const depreciationCost =
    (settings.printerPurchasePriceKes / settings.lifespanHours) *
    job.printTimeHours;

  const hoursPerMonthPerMachine =
    settings.workingDaysPerMonth * settings.workingHoursPerDay;

  const maintenanceCost =
    (settings.maintenancePerYearKes / (hoursPerMonthPerMachine * 12)) *
    job.printTimeHours;

  const laborTimeHours = job.postProcessing
    ? job.printTimeHours + settings.postProcessingTimeHours
    : job.printTimeHours;
  const laborCost = laborTimeHours * settings.laborRateKesPerHour;

  const overheadCost =
    ((settings.monthlyRentKes +
      settings.monthlyUtilitiesKes +
      settings.monthlyInsuranceKes) /
      hoursPerMonthPerMachine) *
    job.printTimeHours;

  const failedPrintBuffer =
    (materialCost + electricityCost) *
    (settings.failedPrintRatePercent / 100);

  const packagingCost = settings.packagingCostKes;

  const totalProductionCostPerUnit =
    materialCost +
    electricityCost +
    depreciationCost +
    maintenanceCost +
    laborCost +
    overheadCost +
    failedPrintBuffer +
    packagingCost;

  const profitAmountPerUnit =
    totalProductionCostPerUnit * (marginPercent / 100);
  const sellingPriceExVatPerUnit =
    totalProductionCostPerUnit + profitAmountPerUnit;
  const vatAmountPerUnit =
    sellingPriceExVatPerUnit * (settings.vatRatePercent / 100);
  const sellingPriceIncVatPerUnit = sellingPriceExVatPerUnit + vatAmountPerUnit;

  return {
    materialCost: materialCost * qty,
    electricityCost: electricityCost * qty,
    depreciationCost: depreciationCost * qty,
    maintenanceCost: maintenanceCost * qty,
    laborCost: laborCost * qty,
    overheadCost: overheadCost * qty,
    failedPrintBuffer: failedPrintBuffer * qty,
    packagingCost: packagingCost * qty,
    totalProductionCost: totalProductionCostPerUnit * qty,
    profitAmount: profitAmountPerUnit * qty,
    sellingPriceExVat: sellingPriceExVatPerUnit * qty,
    vatAmount: vatAmountPerUnit * qty,
    sellingPriceIncVat: sellingPriceIncVatPerUnit * qty,
    perUnitCost: totalProductionCostPerUnit,
    perUnitSellingPrice: sellingPriceIncVatPerUnit,
    quantity: qty,
    grossMarginPercent: marginPercent,
    breakEvenPrice: totalProductionCostPerUnit * qty,
  };
}

export function formatKes(amount: number): string {
  return `KES ${Math.ceil(amount).toLocaleString("en-KE")}`;
}

export function roundUpToTen(amount: number): number {
  return Math.ceil(amount / 10) * 10;
}

/** Default printer settings (Kenya KPLC, typical FDM) */
export const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  printerModel: "FDM Standard",
  powerWatts: 270,
  electricityRateKesKwh: 24,
  printerPurchasePriceKes: 85000,
  lifespanHours: 5000,
  maintenancePerYearKes: 12000,
  laborRateKesPerHour: 200,
  postProcessingTimeHours: 0.5,
  monthlyRentKes: 25000,
  monthlyUtilitiesKes: 6000,
  monthlyInsuranceKes: 3000,
  workingDaysPerMonth: 26,
  workingHoursPerDay: 8,
  failedPrintRatePercent: 5,
  packagingCostKes: 50,
  profitMarginPercent: 40,
  vatRatePercent: 16,
};
