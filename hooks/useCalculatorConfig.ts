"use client";

import { useState, useEffect, useCallback } from "react";
import type { CalculatorConfig } from "@/lib/calculator-config";
import { CALCULATOR_CONFIG_INVALIDATE_EVENT } from "@/lib/calculator-config";
import { calculatePrintCost, type PrinterSettings, type MaterialRate, DEFAULT_PRINTER_SETTINGS } from "@/lib/3d-calculator-engine";
import { formatKes } from "@/lib/3d-calculator-engine";

export function useCalculatorConfig() {
  const [data, setData] = useState<CalculatorConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/finance/calculator-config");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json.errorMessage ?? json.error ?? `${res.status} ${res.statusText}`;
        setError(new Error(msg));
        setData(null);
        return;
      }
      setData({
        labourRate: json.labourRate ?? 50,
        profitMargin: json.profitMargin ?? 40,
        vatPercent: json.vatPercent ?? 16,
        monthlyOverhead: json.monthlyOverhead ?? 13500,
        monthlyCapacityHrs: json.monthlyCapacityHrs ?? 208,
        filaments: Array.isArray(json.filaments) ? json.filaments : [],
        postProcessingFeePerUnit: typeof json.postProcessingFeePerUnit === "number" ? json.postProcessingFeePerUnit : undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load calculator config"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    const onInvalidate = () => fetchConfig();
    window.addEventListener(CALCULATOR_CONFIG_INVALIDATE_EVENT, onInvalidate);
    return () => window.removeEventListener(CALCULATOR_CONFIG_INVALIDATE_EVENT, onInvalidate);
  }, [fetchConfig]);

  return { data, loading, error, refetch: fetchConfig };
}

/** Compute 3D estimate using business costs (Finance) formula. */
export function compute3DEstimateFromConfig(
  config: CalculatorConfig,
  params: {
    weightG: number;
    printTimeHrs: number;
    quantity: number;
    costPerKg: number;
    profitMarginOverride?: number;
    postProcessing?: boolean;
    postProcessingTimeHoursOverride?: number;
  }
): {
  materialCost: number;
  machineCost: number;
  labourCost: number;
  postProcessingCost: number;
  subtotal: number;
  profit: number;
  profitMarginPct: number;
  priceBeforeVAT: number;
  vat: number;
  vatPercent: number;
  finalPrice: number;
  rangeLow: number;
  rangeHigh: number;
} {
  const { weightG, printTimeHrs, quantity, costPerKg, profitMarginOverride, postProcessing, postProcessingTimeHoursOverride } = params;
  
  const settings: PrinterSettings = {
    ...DEFAULT_PRINTER_SETTINGS,
    laborRateKesPerHour: config.labourRate,
    profitMarginPercent: profitMarginOverride ?? config.profitMargin,
    vatRatePercent: config.vatPercent,
    // Map overhead to business rent/util/ins for consistency with engine math
    monthlyRentKes: config.monthlyOverhead,
    monthlyUtilitiesKes: 0,
    monthlyInsuranceKes: 0,
    workingDaysPerMonth: 26,
    workingHoursPerDay: 8, // 208 hrs/month
    postProcessingTimeHours: postProcessingTimeHoursOverride ?? 0.5,
    postProcessingFeePerUnit: config.postProcessingFeePerUnit ?? 200,
  };

  const material: MaterialRate = {
    name: "Material",
    code: "MAT",
    costPerKgKes: costPerKg,
  };

  const job = {
    name: "Estimate",
    material: "MAT",
    weightGrams: weightG,
    printTimeHours: printTimeHrs,
    postProcessing: postProcessing ?? false,
    postProcessingTimeHoursOverride,
    quantity,
  };

  const cost = calculatePrintCost(job, settings, [material]);

  return {
    materialCost: cost.materialCost,
    machineCost: (cost.electricityCost + cost.depreciationCost + cost.maintenanceCost + cost.overheadCost + cost.failedPrintBuffer),
    labourCost: cost.laborCost,
    postProcessingCost: postProcessing ? (settings.postProcessingFeePerUnit ?? 200) * quantity : 0,
    subtotal: cost.totalProductionCost,
    profit: cost.profitAmount,
    profitMarginPct: settings.profitMarginPercent,
    priceBeforeVAT: cost.sellingPriceExVat,
    vat: cost.vatAmount,
    vatPercent: settings.vatRatePercent,
    finalPrice: cost.sellingPriceIncVat,
    rangeLow: Math.round(cost.sellingPriceIncVat * 0.85),
    rangeHigh: Math.round(cost.sellingPriceIncVat * 1.25),
  };
}

/** Compute aggregate estimate for a multi-part 3D job. */
export function computeMultiPart3DEstimate(
  config: {
    labourRate: number;
    vatPercent: number;
    monthlyOverhead: number;
    monthlyCapacityHrs: number;
    profitMargin: number;
    postProcessingFeePerUnit?: number;
    postProcessingTimeHours?: number;
  },
  parts: Array<{
    weightG: number;
    printTimeHrs: number;
    quantity: number;
    costPerKg: number;
    postProcessing: boolean;
    postProcessingTimeHoursOverride?: number;
    profitMarginOverride?: number;
  }>
) {
  const estimates = parts.map((p) =>
    compute3DEstimateFromConfig(
      {
        ...config,
        filaments: [], // filaments not needed for the compute logic itself, just the rate
      },
      p
    )
  );

  const total = estimates.reduce(
    (acc, est) => {
      acc.materialCost += est.materialCost;
      acc.machineCost += est.machineCost;
      acc.labourCost += est.labourCost;
      acc.postProcessingCost += est.postProcessingCost;
      acc.subtotal += est.subtotal;
      acc.profit += est.profit;
      acc.priceBeforeVAT += est.priceBeforeVAT;
      acc.vat += est.vat;
      acc.finalPrice += est.finalPrice;
      return acc;
    },
    {
      materialCost: 0,
      machineCost: 0,
      labourCost: 0,
      postProcessingCost: 0,
      subtotal: 0,
      profit: 0,
      priceBeforeVAT: 0,
      vat: 0,
      finalPrice: 0,
    }
  );

  // The range for multi-part is the sum of the ranges (or a new range based on the total final price)
  // Let's re-calculate ranges based on the sum of final prices, or just sum the ranges?
  // Using the total's final price to calculate a consolidated range:
  const rangeLow = Math.round(total.finalPrice * 0.85);
  const rangeHigh = Math.round(total.finalPrice * 1.25);

  return {
    ...total,
    rangeLow,
    rangeHigh,
    estimates, // include individual estimates for breakdown view
    vatPercent: config.vatPercent,
  };
}

