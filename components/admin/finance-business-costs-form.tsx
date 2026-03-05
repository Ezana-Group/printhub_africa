"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

export function FinanceBusinessCostsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [business, setBusiness] = useState<BusinessSettings | null>(null);

  useEffect(() => {
    fetch("/api/admin/calculator/lf/settings")
      .then((r) => r.json())
      .then((data: { business?: BusinessSettings }) => {
        setBusiness(data.business ?? null);
      })
      .catch(() => setError("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!business) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/calculator/lf/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business }),
      });
      if (!res.ok) throw new Error("Failed to save");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof BusinessSettings, value: number) => {
    setBusiness((b) => (b ? { ...b, [key]: value } : { [key]: value }));
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading business costs…</p>;
  }

  if (!business) {
    return (
      <p className="text-sm text-muted-foreground">
        No business settings found. Run <code className="rounded bg-muted px-1">npm run db:seed</code> to create defaults.
      </p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business costs</CardTitle>
        <CardDescription>
          Rent, utilities, labour, insurance, working schedule, profit target and VAT. Used by all calculators.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Labour rate (KES/hr)</Label>
            <Input
              type="number"
              min={0}
              value={business.labourRateKesPerHour ?? ""}
              onChange={(e) => update("labourRateKesPerHour", parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Default profit margin %</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={business.defaultProfitMarginPct ?? ""}
              onChange={(e) => update("defaultProfitMarginPct", parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Monthly rent (KES)</Label>
            <Input
              type="number"
              min={0}
              value={business.monthlyRentKes ?? ""}
              onChange={(e) => update("monthlyRentKes", parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Monthly utilities (KES)</Label>
            <Input
              type="number"
              min={0}
              value={business.monthlyUtilitiesKes ?? ""}
              onChange={(e) => update("monthlyUtilitiesKes", parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Monthly insurance (KES)</Label>
            <Input
              type="number"
              min={0}
              value={business.monthlyInsuranceKes ?? ""}
              onChange={(e) => update("monthlyInsuranceKes", parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Monthly other (KES)</Label>
            <Input
              type="number"
              min={0}
              value={business.monthlyOtherKes ?? ""}
              onChange={(e) => update("monthlyOtherKes", parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Working days per month</Label>
            <Input
              type="number"
              min={1}
              max={31}
              value={business.workingDaysPerMonth ?? ""}
              onChange={(e) => update("workingDaysPerMonth", parseInt(e.target.value, 10) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Working hours per day</Label>
            <Input
              type="number"
              min={1}
              max={24}
              value={business.workingHoursPerDay ?? ""}
              onChange={(e) => update("workingHoursPerDay", parseInt(e.target.value, 10) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>VAT %</Label>
            <Input
              type="number"
              min={0}
              value={business.vatRatePct ?? ""}
              onChange={(e) => update("vatRatePct", parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save business costs"}
        </Button>
      </CardContent>
    </Card>
  );
}
