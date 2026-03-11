/**
 * PrintHub pricing calculation logic.
 * All prices in KES. VAT 16%. Estimates only — final price confirmed by team.
 */

export const MIN_AREA_SQM_LARGE_FORMAT = 0.5;
export const MIN_ORDER_LARGE_FORMAT = 500;
export const MIN_ORDER_3D = 800;
export const VAT_RATE = 0.16;

/** Quantity discount on base material cost only (large format) */
export function getQuantityDiscountPercent(quantity: number): number {
  if (quantity >= 50) return 0.25;
  if (quantity >= 20) return 0.2;
  if (quantity >= 10) return 0.15;
  if (quantity >= 5) return 0.1;
  if (quantity >= 2) return 0.05;
  return 0;
}

/** Round final estimate up to nearest KES 10 */
export function roundToNearest10(value: number): number {
  return Math.ceil(value / 10) * 10;
}

/** Apply minimum area (sqm) for large format */
export function applyMinArea(areaSqm: number): number {
  return Math.max(areaSqm, MIN_AREA_SQM_LARGE_FORMAT);
}

/** Apply minimum order value */
export function applyMinOrder(total: number, service: "large_format" | "3d"): number {
  const min = service === "large_format" ? MIN_ORDER_LARGE_FORMAT : MIN_ORDER_3D;
  return Math.max(total, min);
}

export interface LargeFormatEstimateInput {
  widthCm: number;
  heightCm: number;
  materialRatePerSqm: number;
  laminationRatePerSqm: number;
  finishingTotalPerUnit: number;
  designFee: number;
  rushSurchargePercent: number;
  quantity: number;
}

export interface LargeFormatEstimateResult {
  areaSqm: number;
  areaChargedSqm: number;
  baseCost: number;
  volumeDiscountPercent: number;
  volumeDiscountAmount: number;
  discountedBase: number;
  laminationCost: number;
  finishingCost: number;
  printSubtotal: number;
  rushSurchargeAmount: number;
  designFee: number;
  subtotalExVat: number;
  vat: number;
  totalEstimate: number;
  totalRounded: number;
  totalFinal: number;
}

export function calculateLargeFormatEstimate(input: LargeFormatEstimateInput): LargeFormatEstimateResult {
  const areaSqm = (input.widthCm / 100) * (input.heightCm / 100);
  const areaChargedSqm = applyMinArea(areaSqm) * input.quantity;

  const baseCost = areaChargedSqm * input.materialRatePerSqm;
  const discountPct = getQuantityDiscountPercent(input.quantity);
  const volumeDiscountAmount = baseCost * discountPct;
  const discountedBase = baseCost - volumeDiscountAmount;

  const laminationCost = areaChargedSqm * input.laminationRatePerSqm;
  const finishingCost = input.finishingTotalPerUnit * input.quantity;

  const printSubtotal = discountedBase + laminationCost + finishingCost;
  const rushSurchargeAmount = printSubtotal * (input.rushSurchargePercent / 100);
  const designFee = input.designFee;

  const subtotalExVat = printSubtotal + rushSurchargeAmount + designFee;
  const vat = subtotalExVat * VAT_RATE;
  const totalEstimate = subtotalExVat + vat;
  const totalRounded = roundToNearest10(totalEstimate);
  const totalFinal = applyMinOrder(totalRounded, "large_format");

  return {
    areaSqm,
    areaChargedSqm,
    baseCost,
    volumeDiscountPercent: discountPct * 100,
    volumeDiscountAmount,
    discountedBase,
    laminationCost,
    finishingCost,
    printSubtotal,
    rushSurchargeAmount,
    designFee,
    subtotalExVat,
    vat,
    totalEstimate,
    totalRounded,
    totalFinal,
  };
}

// ============== 3D PRINTING ==============
/** Material density g/cm³ — doc 2.7 */
export const MATERIAL_DENSITY: Record<string, number> = {
  PLA: 1.24,
  "PLA+": 1.24,
  PLA_STD: 1.24,
  PLA_PLUS: 1.24,
  PETG: 1.27,
  ABS: 1.05,
  TPU: 1.2,
  ASA: 1.07,
  RESIN: 1.1,
  RESIN_STD: 1.1,
  RESIN_ABS: 1.1,
  NYLON: 1.01,
  CF_PLA: 1.3,
};

/** Infill weight multiplier — doc 2.4 */
export const INFILL_WEIGHT_MULT: Record<number, number> = {
  10: 0.3,
  15: 0.35,
  20: 0.45,
  30: 0.55,
  40: 0.65,
  50: 0.75,
  75: 0.88,
  100: 1.0,
};

/** Infill time multiplier — doc 2.4 */
export const INFILL_TIME_MULT: Record<number, number> = {
  10: 0.7,
  15: 0.75,
  20: 0.85,
  30: 0.95,
  40: 1.05,
  50: 1.15,
  75: 1.3,
  100: 1.5,
};

/** Layer height time multiplier — doc 2.5 (0.20mm = 1.0 baseline) */
export const LAYER_HEIGHT_TIME_MULT: Record<number, number> = {
  0.05: 2.5,
  0.1: 2.0,
  0.15: 1.5,
  0.2: 1.0,
  0.25: 0.8,
  0.3: 0.65,
};

/** Support time/material multiplier — doc 2.6 */
export const SUPPORT_MULT = { NONE: { material: 1, time: 1 }, SUP_STD: { material: 1.15, time: 1.15 }, SUP_HVY: { material: 1.3, time: 1.25 } };

/** Shape factor for bounding box → print volume — doc 2.7 */
export const SHAPE_FACTOR = { simple: 0.3, moderate: 0.45, complex: 0.6, dense: 0.75 };

/** Base print speed cm³/hour for FDM 0.20mm 20% infill — doc 2.7 */
export const BASE_SPEED_CM3_PER_HR = 18;

export interface ThreeDEstimateInput {
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  shapeComplexity: keyof typeof SHAPE_FACTOR;
  materialSlug: string;
  materialRatePerGram: number;
  materialDensity: number;
  minChargeGrams: number;
  machineRatePerHour: number;
  infillPercent: number;
  layerHeightMm: number;
  supportCode: keyof typeof SUPPORT_MULT;
  supportRemovalFee: number;
  finishingFee: number;
  rushSurchargePercent: number;
  designFee: number;
  quantity: number;
}

export interface ThreeDEstimateResult {
  boundingBoxCm3: number;
  printVolumeCm3: number;
  rawWeightG: number;
  adjWeightG: number;
  materialCost: number;
  basePrintTimeHrs: number;
  adjPrintTimeHrs: number;
  machineTimeCost: number;
  postProcessingCost: number;
  printSubtotal: number;
  rushSurchargeAmount: number;
  designFee: number;
  subtotalExVat: number;
  vat: number;
  totalEstimate: number;
  totalRounded: number;
  totalFinal: number;
  estimateRangeLow: number;
  estimateRangeHigh: number;
}

export function calculate3DEstimate(input: ThreeDEstimateInput): ThreeDEstimateResult {
  const volumeCm3 = (input.lengthMm / 10) * (input.widthMm / 10) * (input.heightMm / 10);
  const shapeFactor = SHAPE_FACTOR[input.shapeComplexity] ?? 0.45;
  const printVolumeCm3 = volumeCm3 * shapeFactor;

  const rawWeightG = printVolumeCm3 * input.materialDensity;
  const infillWeightMult = INFILL_WEIGHT_MULT[input.infillPercent] ?? 0.45;
  const supportMult = SUPPORT_MULT[input.supportCode] ?? SUPPORT_MULT.NONE;
  let adjWeightG = rawWeightG * infillWeightMult * supportMult.material;
  adjWeightG = Math.max(adjWeightG, input.minChargeGrams || 0);

  const materialCost = adjWeightG * input.materialRatePerGram * input.quantity;

  const basePrintTimeHrs = (printVolumeCm3 * 0.8) / BASE_SPEED_CM3_PER_HR;
  const infillTimeMult = INFILL_TIME_MULT[input.infillPercent] ?? 0.85;
  const layerTimeMult = LAYER_HEIGHT_TIME_MULT[input.layerHeightMm] ?? 1;
  let adjPrintTimeHrs = basePrintTimeHrs * layerTimeMult * infillTimeMult * supportMult.time;
  adjPrintTimeHrs = Math.max(0.5, Math.ceil(adjPrintTimeHrs * 2) / 2);
  const machineTimeCost = adjPrintTimeHrs * input.machineRatePerHour * input.quantity;

  const postProcessingCost = (input.supportRemovalFee + input.finishingFee) * input.quantity;
  const printSubtotal = materialCost + machineTimeCost + postProcessingCost;
  const rushSurchargeAmount = printSubtotal * (input.rushSurchargePercent / 100);
  const designFee = input.designFee;
  const subtotalExVat = printSubtotal + rushSurchargeAmount + designFee;
  const vat = subtotalExVat * VAT_RATE;
  const totalEstimate = subtotalExVat + vat;
  const totalRounded = roundToNearest10(totalEstimate);
  const totalFinal = applyMinOrder(totalRounded, "3d");

  const estimateRangeLow = roundToNearest10(totalFinal * 0.85);
  const estimateRangeHigh = roundToNearest10(totalFinal * 1.25);

  return {
    boundingBoxCm3: volumeCm3,
    printVolumeCm3,
    rawWeightG,
    adjWeightG,
    materialCost,
    basePrintTimeHrs,
    adjPrintTimeHrs,
    machineTimeCost,
    postProcessingCost,
    printSubtotal,
    rushSurchargeAmount,
    designFee,
    subtotalExVat,
    vat,
    totalEstimate,
    totalRounded,
    totalFinal,
    estimateRangeLow,
    estimateRangeHigh,
  };
}
