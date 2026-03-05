"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EditableSection } from "@/components/admin/editable-section";
import { CALCULATOR_CONFIG_INVALIDATE_EVENT } from "@/lib/calculator-config";

type BusinessSettings = {
  labourRateKesPerHour?: number;
  monthlyRentKes?: number;
  monthlyUtilitiesKes?: number;
  monthlyInsuranceKes?: number;
  monthlyOtherKes?: number;
  workingDaysPerMonth?: number;
  workingHoursPerDay?: number;
  defaultProfitMarginPct?: number;
  vatRatePct?: number;
};

function formatNum(n: number | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-KE", { maximumFractionDigits: 1 });
}

export function FinanceBusinessCostsForm({ canEdit = true }: { canEdit?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<BusinessSettings | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchBusiness = useCallback(async () => {
    setFetchError(null);
    try {
      const r = await fetch("/api/admin/calculator/lf/settings");
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setFetchError(data.error ?? `Failed to load (${r.status})`);
        return;
      }
      setBusiness(data.business ?? null);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusiness();
  }, [fetchBusiness]);

  const update = useCallback((key: keyof BusinessSettings, value: number) => {
    setBusiness((b) => (b ? { ...b, [key]: value } : { [key]: value }));
  }, []);

  const saveBusiness = useCallback(async () => {
    if (!business) throw new Error("No settings to save");
    const payload = {
      business: {
        labourRateKesPerHour: business.labourRateKesPerHour ?? 0,
        defaultProfitMarginPct: business.defaultProfitMarginPct ?? 0,
        monthlyRentKes: business.monthlyRentKes ?? 0,
        monthlyUtilitiesKes: business.monthlyUtilitiesKes ?? 0,
        monthlyInsuranceKes: business.monthlyInsuranceKes ?? 0,
        monthlyOtherKes: business.monthlyOtherKes ?? 0,
        workingDaysPerMonth: business.workingDaysPerMonth ?? 0,
        workingHoursPerDay: business.workingHoursPerDay ?? 0,
        vatRatePct: business.vatRatePct ?? 0,
      },
    };
    const res = await fetch("/api/admin/calculator/lf/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Failed to save");
    await fetchBusiness();
    window.dispatchEvent(new CustomEvent(CALCULATOR_CONFIG_INVALIDATE_EVENT));
  }, [business, fetchBusiness]);

  const monthlyOverhead = useMemo(() => {
    if (!business) return 0;
    const rent = business.monthlyRentKes ?? 0;
    const util = business.monthlyUtilitiesKes ?? 0;
    const ins = business.monthlyInsuranceKes ?? 0;
    const other = business.monthlyOtherKes ?? 0;
    return rent + util + ins + other;
  }, [business]);

  const totalHoursPerMonth = useMemo(() => {
    if (!business) return 0;
    const days = business.workingDaysPerMonth ?? 0;
    const hours = business.workingHoursPerDay ?? 0;
    return days * hours;
  }, [business]);

  const hourlyOverheadRate = useMemo(() => {
    if (totalHoursPerMonth <= 0) return 0;
    return monthlyOverhead / totalHoursPerMonth;
  }, [monthlyOverhead, totalHoursPerMonth]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading business costs…</p>;
  }

  if (fetchError) {
    return <p className="text-sm text-destructive">{fetchError}</p>;
  }

  if (!business) {
    return (
      <p className="text-sm text-muted-foreground">
        No business settings found. Run <code className="rounded bg-muted px-1">npm run db:seed</code> to create defaults.
      </p>
    );
  }

  // Calculated from inputs: monthly overhead = rent + utilities + insurance + other; hourly rate = monthly overhead ÷ (days × hours)
  const previewText = `Monthly overhead: KES ${formatNum(monthlyOverhead)} | Hourly overhead rate: KES ${formatNum(hourlyOverheadRate)}`;
  const previewHint = "Calculated from rent, utilities, insurance and other costs below. Change those to update this.";

  return (
    <EditableSection
      id="finance-business-costs"
      title="Business costs"
      description="Rent, utilities, labour, insurance, working schedule, profit target and VAT. Used by all calculators."
      canEdit={canEdit}
      viewContent={
        <div className="space-y-0">
          {[
            { label: "Labour rate (KES/hr)", value: formatNum(business.labourRateKesPerHour) },
            { label: "Default profit margin %", value: formatNum(business.defaultProfitMarginPct) },
            { label: "Monthly rent (KES)", value: formatNum(business.monthlyRentKes) },
            { label: "Monthly utilities (KES)", value: formatNum(business.monthlyUtilitiesKes) },
            { label: "Monthly insurance (KES)", value: formatNum(business.monthlyInsuranceKes) },
            { label: "Monthly other (KES)", value: formatNum(business.monthlyOtherKes) },
            { label: "Working days per month", value: String(business.workingDaysPerMonth ?? "—") },
            { label: "Working hours per day", value: String(business.workingHoursPerDay ?? "—") },
            { label: "VAT %", value: formatNum(business.vatRatePct) },
          ].map((row, i) => (
            <div
              key={i}
              className="flex flex-wrap items-baseline justify-between gap-2 py-2 border-b border-border/50 last:border-0 hover:bg-muted/30 rounded px-1 -mx-1"
            >
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className="text-sm font-medium text-foreground">{row.value}</span>
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
            {previewText}
            <p className="text-xs text-muted-foreground/80 mt-1">{previewHint}</p>
          </div>
        </div>
      }
      editContent={({ setHasChanges }) => (
        <div className="space-y-4" onChange={() => setHasChanges(true)} onInput={() => setHasChanges(true)}>
          <div className="rounded border border-orange-200 bg-orange-50/50 px-3 py-2 text-sm text-orange-900">
            <p className="font-medium">{previewText}</p>
            <p className="text-xs text-orange-700/90 mt-1">{previewHint}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Labour rate (KES/hr)</Label>
              <Input type="number" min={0} value={business.labourRateKesPerHour ?? ""} onChange={(e) => update("labourRateKesPerHour", parseFloat(e.target.value) || 0)} className="focus-visible:ring-orange-500" />
            </div>
            <div className="space-y-1.5">
              <Label>Default profit margin %</Label>
              <Input type="number" min={0} max={100} value={business.defaultProfitMarginPct ?? ""} onChange={(e) => update("defaultProfitMarginPct", parseFloat(e.target.value) || 0)} className="focus-visible:ring-orange-500" />
            </div>
            <div className="space-y-1.5">
              <Label>Monthly rent (KES)</Label>
              <Input type="number" min={0} value={business.monthlyRentKes ?? ""} onChange={(e) => update("monthlyRentKes", parseFloat(e.target.value) || 0)} className="focus-visible:ring-orange-500" />
            </div>
            <div className="space-y-1.5">
              <Label>Monthly utilities (KES)</Label>
              <Input type="number" min={0} value={business.monthlyUtilitiesKes ?? ""} onChange={(e) => update("monthlyUtilitiesKes", parseFloat(e.target.value) || 0)} className="focus-visible:ring-orange-500" />
            </div>
            <div className="space-y-1.5">
              <Label>Monthly insurance (KES)</Label>
              <Input type="number" min={0} value={business.monthlyInsuranceKes ?? ""} onChange={(e) => update("monthlyInsuranceKes", parseFloat(e.target.value) || 0)} className="focus-visible:ring-orange-500" />
            </div>
            <div className="space-y-1.5">
              <Label>Monthly other (KES)</Label>
              <Input type="number" min={0} value={business.monthlyOtherKes ?? ""} onChange={(e) => update("monthlyOtherKes", parseFloat(e.target.value) || 0)} className="focus-visible:ring-orange-500" />
            </div>
            <div className="space-y-1.5">
              <Label>Working days per month</Label>
              <Input type="number" min={1} max={31} value={business.workingDaysPerMonth ?? ""} onChange={(e) => update("workingDaysPerMonth", parseInt(e.target.value, 10) || 0)} className="focus-visible:ring-orange-500" />
            </div>
            <div className="space-y-1.5">
              <Label>Working hours per day</Label>
              <Input type="number" min={1} max={24} value={business.workingHoursPerDay ?? ""} onChange={(e) => update("workingHoursPerDay", parseInt(e.target.value, 10) || 0)} className="focus-visible:ring-orange-500" />
            </div>
            <div className="space-y-1.5">
              <Label>VAT %</Label>
              <Input type="number" min={0} value={business.vatRatePct ?? ""} onChange={(e) => update("vatRatePct", parseFloat(e.target.value) || 0)} className="focus-visible:ring-orange-500" />
            </div>
          </div>
        </div>
      )}
      onSave={saveBusiness}
    />
  );
}
