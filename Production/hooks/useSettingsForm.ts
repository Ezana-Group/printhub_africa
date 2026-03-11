"use client";

import { useState, useEffect, useCallback } from "react";

export function useSettingsForm<T extends object>(apiPath: string) {
  const [data, setData] = useState<T | null>(null);
  const [original, setOriginal] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty =
    data && original && JSON.stringify(data) !== JSON.stringify(original);

  useEffect(() => {
    fetch(apiPath)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setOriginal(typeof structuredClone === "function" ? structuredClone(d) : JSON.parse(JSON.stringify(d)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [apiPath]);

  const patch = useCallback((partial: Partial<T>) => {
    setData((d) => (d ? { ...d, ...partial } : d));
  }, []);

  const save = useCallback(async () => {
    if (!isDirty || !data) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(apiPath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      setOriginal(typeof structuredClone === "function" ? structuredClone(data) : JSON.parse(JSON.stringify(data)));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      setError(msg);
      throw e;
    } finally {
      setSaving(false);
    }
  }, [apiPath, data, isDirty]);

  const discard = useCallback(() => {
    setData(original ? (typeof structuredClone === "function" ? structuredClone(original) : JSON.parse(JSON.stringify(original))) : null);
  }, [original]);

  return { data, patch, loading, saving, error, isDirty, save, discard };
}
