"use client";

import { useState, useEffect, useCallback } from "react";
import type { PrinterSettings, MaterialRate } from "@/lib/3d-calculator-engine";
import { DEFAULT_PRINTER_SETTINGS } from "@/lib/3d-calculator-engine";

const CACHE_MS = 5 * 60 * 1000; // 5 minutes

type RatesData = {
  printerSettings: PrinterSettings;
  materials: MaterialRate[];
  postProcessingOptions: { code: string; name: string }[];
  rushOptions: { code: string; name: string; surchargePercent: number }[];
};

const cache = new Map<string, { data: RatesData; at: number }>();

function cacheKey(printerId: string | undefined) {
  return printerId ?? "__default__";
}

export function use3DRates(printerId?: string) {
  const key = cacheKey(printerId);
  const cached = cache.get(key);
  const [data, setData] = useState<RatesData | null>(cached && cached.at + CACHE_MS > Date.now() ? cached.data : null);
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
      const url = `/api/calculator/rates/3d-print${printerId ? `?printerId=${encodeURIComponent(printerId)}` : ""}`;
      const res = await fetch(url);
      const json = await res.json();
      const rates: RatesData = {
        printerSettings: json.printerSettings ?? DEFAULT_PRINTER_SETTINGS,
        materials: Array.isArray(json.materials) ? json.materials : [],
        postProcessingOptions: Array.isArray(json.postProcessingOptions) ? json.postProcessingOptions : [],
        rushOptions: Array.isArray(json.rushOptions) ? json.rushOptions : [],
      };
      cache.set(k, { data: rates, at: Date.now() });
      setData(rates);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load rates"));
      setData({
        printerSettings: DEFAULT_PRINTER_SETTINGS,
        materials: [],
        postProcessingOptions: [],
        rushOptions: [],
      });
    } finally {
      setLoading(false);
    }
  }, [printerId]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return { data, loading, error, refetch: fetchRates };
}
