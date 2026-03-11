"use client";

import { useState, useEffect, useCallback } from "react";
import type { LFPrinterSettings, LFBusinessSettings } from "@/lib/lf-calculator-engine";

const CACHE_MS = 5 * 60 * 1000;

export type LFMaterialRate = {
  code: string;
  name: string;
  rollWidthM: number;
  averageCostKes: number;
  lastPurchasePriceKes?: number;
  stockAvailableLm: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
};

export type LFLaminationRate = {
  code: string;
  name: string;
  averageCostKes: number;
  stockAvailableLm: number;
};

export type LFRatesData = {
  printerSettings: LFPrinterSettings;
  businessSettings: LFBusinessSettings;
  materials: LFMaterialRate[];
  laminations: LFLaminationRate[];
  inkCosts: { CMYK: number; PHOTO: number; WHITE_INK: number; BLACK_ONLY: number };
  finishingHardware: {
    eyeletCostPerUnit: number;
    hemTapeCostPerM: number;
    ropeCostPerM: number;
    polePocketCostPerM: number;
    packagingCostKes: number;
  };
  rushOptions: { code: string; name: string; surchargePercent: number; multiplier: number }[];
  designServiceOptions: { code: string; name: string; flatFee: number }[];
  vatRatePct: number;
  minOrderValueKes: number;
};

const cache = new Map<string, { data: LFRatesData; at: number }>();

function cacheKey(printerId: string | undefined) {
  return printerId ?? "__default__";
}

export function useLFRates(printerId?: string) {
  const key = cacheKey(printerId);
  const cached = cache.get(key);
  const [data, setData] = useState<LFRatesData | null>(
    cached && cached.at + CACHE_MS > Date.now() ? cached.data : null
  );
  const [loading, setLoading] = useState(!cached || cached.at + CACHE_MS <= Date.now());
  const [error, setError] = useState<Error | null>(null);

  const fetchRates = useCallback(async () => {
    const k = cacheKey(printerId);
    const hit = cache.get(k);
    if (hit && hit.at + CACHE_MS > Date.now()) {
      setData(hit.data);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = `/api/calculator/rates/large-format${printerId ? `?printerId=${encodeURIComponent(printerId)}` : ""}`;
      const res = await fetch(url);
      const json = await res.json();
      cache.set(k, { data: json as LFRatesData, at: Date.now() });
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load rates"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [printerId]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return { data, loading, error, refetch: fetchRates };
}
