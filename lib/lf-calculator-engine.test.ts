/**
 * Unit tests for Large Format cost engine.
 * Run: npx tsx lib/lf-calculator-engine.test.ts
 */
import {
  calculateLFPrintCost,
  roundLFToNearest10,
  type LFJobInputs,
  type LFPrinterSettings,
  type LFBusinessSettings,
  type LFMaterialCosts,
} from "./lf-calculator-engine";

const printer: LFPrinterSettings = {
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

const business: LFBusinessSettings = {
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

const materials: LFMaterialCosts = {
  substrateCode: "VINYL_OUT",
  substrateCostPerLm: 178.5,
  substrateRollWidthM: 1.52,
  laminationCode: "LAM_GLOSS",
  laminationCostPerLm: 90,
  inkCostPerSqm: 147,
  eyeletCostPerUnit: 3.5,
  hemTapeCostPerM: 12,
  ropeCostPerM: 8,
  polePocketCostPerM: 50,
  packagingCostKes: 100,
};

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertApprox(actual: number, expected: number, tolerance: number, msg: string) {
  const ok = Math.abs(actual - expected) <= tolerance;
  if (!ok) throw new Error(`${msg}: expected ~${expected}, got ${actual}`);
}

// Example from spec: 2m × 1m, outdoor vinyl, gloss lam, std eyelets + hemming all 4, CMYK, qty 3
const job: LFJobInputs = {
  widthM: 2,
  heightM: 1,
  quantity: 3,
  materialCode: "VINYL_OUT",
  laminationCode: "LAM_GLOSS",
  finishing: { eyelets: "STANDARD", hemming: "ALL_4", polePockets: "NONE", rope: false },
  printType: "CMYK",
  designFeeKes: 0,
  rushMultiplier: 1,
};

const result = calculateLFPrintCost(job, printer, business, materials);

// Spec numbers (approximate)
assert(result.quantity === 3, "quantity");
assertApprox(result.substrateMetresRequired, 3.15, 0.1, "substrate metres");
assertApprox(result.substrateMaterialCost, 562.28, 5, "substrate cost");
assertApprox(result.inkCost, 882, 5, "ink cost");
assertApprox(result.laminationMetresRequired, 3.15, 0.1, "lamination metres");
assertApprox(result.laminationMaterialCost, 283.5, 5, "lamination cost");
assert(result.eyeletsRequired === 36, "eyelets required");
assertApprox(result.hemTapeMetresRequired, 19.8, 0.5, "hem tape metres");
assertApprox(result.finishingHardwareCost, 363.6, 10, "finishing hardware");
assertApprox(result.totalJobTimeHours, 1.7, 0.1, "total job time");
assertApprox(result.labourCost, 340, 10, "labour cost");
assertApprox(result.totalProductionCost, 3051.76, 50, "total production cost");
assertApprox(result.profitAmount, 1220.7, 30, "profit amount");
assertApprox(result.totalIncVat, 4960, 100, "total inc VAT");
assertApprox(result.perUnitSellingPrice, 1654, 50, "per unit selling price");

assert(roundLFToNearest10(4960) === 4960, "roundLFToNearest10");
assert(roundLFToNearest10(4955) === 4960, "roundLFToNearest10 up");

// No lamination
const jobNoLam: LFJobInputs = { ...job, laminationCode: "NONE" };
const materialsNoLam: LFMaterialCosts = { ...materials, laminationCode: null, laminationCostPerLm: 0 };
const resultNoLam = calculateLFPrintCost(jobNoLam, printer, business, materialsNoLam);
assert(resultNoLam.laminationMaterialCost === 0, "no lamination cost");
assert(resultNoLam.laminationMetresRequired === 0, "no lamination metres");

console.log("All LF cost engine tests passed.");
console.log("  Total production cost:", result.totalProductionCost.toFixed(2));
console.log("  Total inc VAT:", result.totalIncVat.toFixed(2));
console.log("  Per unit:", result.perUnitSellingPrice.toFixed(2));
