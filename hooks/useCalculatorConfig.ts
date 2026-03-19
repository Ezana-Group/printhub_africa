"use client";

import { useState, useEffect, useCallback } from "react";
import type { CalculatorConfig } from "@/lib/calculator-config";
import { CALCULATOR_CONFIG_INVALIDATE_EVENT } from "@/lib/calculator-config";

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
        labourRate: json.labourRate ?? 200,
        profitMargin: json.profitMargin ?? 40,
        vatPercent: json.vatPercent ?? 16,
        monthlyOverhead: json.monthlyOverhead ?? 50000,
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
    /** When true, adds post-processing / support removal fee per unit from config. */
    postProcessing?: boolean;
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
  const { labourRate, vatPercent, monthlyOverhead, monthlyCapacityHrs } = config;
  const { weightG, printTimeHrs, quantity, costPerKg, profitMarginOverride, postProcessing } = params;
  const profitMargin = profitMarginOverride ?? config.profitMargin;

  const materialCostPerUnit = (weightG / 1000) * costPerKg;
  const capacityHrs = monthlyCapacityHrs > 0 ? monthlyCapacityHrs : 208;
  const machineCostPerUnit = printTimeHrs * (monthlyOverhead / capacityHrs);
  const labourCostPerUnit = printTimeHrs * labourRate;

  const postProcessingFeePerUnit = postProcessing ? (config.postProcessingFeePerUnit ?? 300) : 0;
  const postProcessingCost = postProcessingFeePerUnit * quantity;

  const subtotal = (materialCostPerUnit + machineCostPerUnit + labourCostPerUnit) * quantity + postProcessingCost;
  const profit = subtotal * (profitMargin / 100);
  const marginPct = profitMargin;
  const priceBeforeVAT = subtotal + profit;
  const vat = priceBeforeVAT * (vatPercent / 100);
  const finalPrice = priceBeforeVAT + vat;

  const minOrder = 800;
  const finalWithMin = Math.max(finalPrice, minOrder);
  const rangeLow = Math.round(finalWithMin * 0.85);
  const rangeHigh = Math.round(finalWithMin * 1.25);

  return {
    materialCost: materialCostPerUnit * quantity,
    machineCost: machineCostPerUnit * quantity,
    labourCost: labourCostPerUnit * quantity,
    postProcessingCost,
    subtotal,
    profit,
    profitMarginPct: marginPct,
    priceBeforeVAT,
    vat,
    vatPercent,
    finalPrice: finalWithMin,
    rangeLow,
    rangeHigh,
  };
}
