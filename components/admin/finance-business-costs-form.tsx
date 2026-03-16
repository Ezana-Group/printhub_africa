"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  return n.toLocaleString("en-KE", { maximumFractionDigits: 2 });
}

const UTILISATION_PCT = 70; // 70% machine utilisation for effective hours

/** Default baseline values (same as API/seed). Use as starting point so you can edit and save your own. */
const DEFAULT_BASELINE: BusinessSettings = {
  labourRateKesPerHour: 200,
  monthlyRentKes: 35000,
  monthlyUtilitiesKes: 8000,
  monthlyInsuranceKes: 4000,
  monthlyOtherKes: 3000,
  workingDaysPerMonth: 26,
  workingHoursPerDay: 8,
  defaultProfitMarginPct: 40,
  vatRatePct: 16,
};

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

  const effectiveMachineHours = useMemo(() => {
    return totalHoursPerMonth * (UTILISATION_PCT / 100);
  }, [totalHoursPerMonth]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading business costs…</p>;
  }

  if (fetchError) {
    return <p className="text-sm text-destructive">{fetchError}</p>;
  }

  if (!business) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-3">
            No business settings found. You can start from a default baseline and then enter your own values — no need to run <code className="rounded bg-muted px-1">npm run db:seed</code>.
          </p>
          {canEdit && (
            <Button type="button" onClick={() => setBusiness({ ...DEFAULT_BASELINE })}>
              Use default baseline and enter my values
            </Button>
          )}
          {!canEdit && (
            <p className="text-sm text-muted-foreground">You don’t have permission to edit finance settings.</p>
          )}
        </CardContent>
      </Card>
    );
  }

  const summaryBlock = (
    <Card className="bg-muted/30 border-primary/20">
      <CardContent className="pt-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total monthly fixed costs</p>
            <p className="text-2xl font-bold mt-1">KES {formatNum(monthlyOverhead)}</p>
            <p className="text-xs text-muted-foreground mt-1">Based on settings below</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Overhead rate per hour</p>
            <p className="text-2xl font-bold mt-1">KES {formatNum(hourlyOverheadRate)}</p>
            <p className="text-xs text-muted-foreground mt-1">At {UTILISATION_PCT}% utilisation</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Effective machine hours: <strong>{formatNum(effectiveMachineHours)}</strong> hrs/month
            <span className="text-muted-foreground/80 ml-1">
              ({business.workingDaysPerMonth ?? 0} days × {business.workingHoursPerDay ?? 0} hrs × {UTILISATION_PCT}% utilisation)
            </span>
          </p>
        </div>
        <p className="text-sm text-muted-foreground mt-3 flex items-start gap-2">
          <span className="shrink-0">ℹ</span>
          <span>
            Used by Large Format and 3D printing calculators to price jobs. Does not affect shop product pricing.
          </span>
        </p>
      </CardContent>
    </Card>
  );

  return (
    <EditableSection
      id="finance-business-costs"
      title="Business costs"
      description="Operational overhead shared across Shop, Print Services, and Corporate. Shop product costs (COGS) are set per product in Products → Pricing."
      canEdit={canEdit}
      viewContent={
        <div className="space-y-6">
          {summaryBlock}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <h3 className="text-sm font-semibold">Premises</h3>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>Rent: KES {formatNum(business.monthlyRentKes)}</p>
                <p>Other: KES {formatNum(business.monthlyOtherKes)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <h3 className="text-sm font-semibold">Utilities</h3>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>Electricity & water: KES {formatNum(business.monthlyUtilitiesKes)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <h3 className="text-sm font-semibold">Insurance</h3>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>Business: KES {formatNum(business.monthlyInsuranceKes)}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-sm font-semibold">Labour & schedule</h3>
            </CardHeader>
            <CardContent className="text-sm">
              <p>Standard rate: KES {formatNum(business.labourRateKesPerHour)}/hr</p>
              <p className="mt-1 text-muted-foreground">
                Days/month: {business.workingDaysPerMonth ?? "—"} · Hours/day: {business.workingHoursPerDay ?? "—"}
              </p>
              <p className="text-muted-foreground mt-2 text-xs">
                Used per print job. Not applied to shop orders.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-sm font-semibold">Profitability & VAT</h3>
            </CardHeader>
            <CardContent className="text-sm">
              <p>Default profit margin: {formatNum(business.defaultProfitMarginPct)}%</p>
              <p className="mt-1">VAT: {formatNum(business.vatRatePct)}%</p>
            </CardContent>
          </Card>
        </div>
      }
      editContent={({ setHasChanges }) => (
        <div className="space-y-6" onChange={() => setHasChanges(true)} onInput={() => setHasChanges(true)}>
          {summaryBlock}

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <h3 className="text-sm font-semibold">Premises</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Rent (KES)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={business.monthlyRentKes ?? ""}
                    onChange={(e) => update("monthlyRentKes", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Other (KES)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={business.monthlyOtherKes ?? ""}
                    onChange={(e) => update("monthlyOtherKes", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <h3 className="text-sm font-semibold">Utilities</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Electricity & water (KES)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={business.monthlyUtilitiesKes ?? ""}
                    onChange={(e) => update("monthlyUtilitiesKes", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <h3 className="text-sm font-semibold">Insurance</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Business (KES)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={business.monthlyInsuranceKes ?? ""}
                    onChange={(e) => update("monthlyInsuranceKes", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-sm font-semibold">Labour rates</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5 max-w-xs">
                <Label>Standard rate (KES/hr)</Label>
                <Input
                  type="number"
                  min={0}
                  value={business.labourRateKesPerHour ?? ""}
                  onChange={(e) => update("labourRateKesPerHour", parseFloat(e.target.value) || 0)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Used per print job. Not applied to shop orders.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-sm font-semibold">Working schedule</h3>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <div className="space-y-1.5">
                <Label>Days per month</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={business.workingDaysPerMonth ?? ""}
                  onChange={(e) => update("workingDaysPerMonth", parseInt(e.target.value, 10) || 0)}
                  className="w-24"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Hours per day</Label>
                <Input
                  type="number"
                  min={1}
                  max={24}
                  value={business.workingHoursPerDay ?? ""}
                  onChange={(e) => update("workingHoursPerDay", parseInt(e.target.value, 10) || 0)}
                  className="w-24"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Utilisation %</Label>
                <Input type="number" min={1} max={100} value={UTILISATION_PCT} disabled className="w-24 bg-muted" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-sm font-semibold">Profitability targets</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5 max-w-xs">
                <Label>Default profit margin %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={business.defaultProfitMarginPct ?? ""}
                  onChange={(e) => update("defaultProfitMarginPct", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1.5 max-w-xs">
                <Label>VAT %</Label>
                <Input
                  type="number"
                  min={0}
                  value={business.vatRatePct ?? ""}
                  onChange={(e) => update("vatRatePct", parseFloat(e.target.value) || 0)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Shop margin target is set per product in Products → Pricing. This margin applies to print calculators.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      onSave={saveBusiness}
    />
  );
}
