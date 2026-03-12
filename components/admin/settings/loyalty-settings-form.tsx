"use client";

import { useEffect, useState } from "react";
import { SectionCard } from "@/components/settings/section-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsSaveButton } from "@/components/settings/settings-save-button";
import { SettingsSwitch } from "@/components/settings/settings-switch";
import { Loader2 } from "lucide-react";

const API = "/api/admin/settings/loyalty";

type LoyaltyData = Record<string, string | boolean>;

export function LoyaltySettingsForm() {
  const [data, setData] = useState<LoyaltyData | null>(null);

  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((d) => setData(typeof d === "object" && d !== null ? d : {}))
      .catch(() => setData({}));
  }, []);

  if (data === null) {
    return (
      <p className="text-sm text-muted-foreground py-4 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </p>
    );
  }

  const val = (k: string, def: string) => (data[k] != null ? String(data[k]) : def);
  const bool = (k: string, def: boolean) =>
    data[k] === true || data[k] === "true" ? true : data[k] === false || data[k] === "false" ? false : def;

  return (
    <form id="settings-loyalty" className="space-y-6">
      <SectionCard title="Programme Status" description="Enable and name the programme.">
        <SettingsSwitch
          name="loyaltyEnabled"
          defaultValue={bool("loyaltyEnabled", true)}
          label="Enable loyalty programme"
        />
        <div className="grid gap-2 mt-4">
          <Label>Programme name</Label>
          <Input name="programmeName" defaultValue={val("programmeName", "PrintHub Points")} />
          <Label>Points currency name</Label>
          <Input name="pointsCurrencyName" defaultValue={val("pointsCurrencyName", "Points")} />
        </div>
      </SectionCard>
      <SectionCard
        title="Earning Rules"
        description="Points per KES spent. Bonus events: first order, birthday month, review, referral, corporate."
      >
        <div className="grid gap-2">
          <Label>Points per KES spent</Label>
          <div className="flex items-center gap-2">
            <Input name="pointsPerUnit" type="number" defaultValue={val("pointsPerUnit", "1")} className="w-20" /> point per KES
            <Input name="kesPerUnit" type="number" defaultValue={val("kesPerUnit", "100")} className="w-24" /> spent
          </div>
          <Label>Round points</Label>
          <select name="roundPoints" className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-40">
            <option value="down">Down (1.7 → 1)</option>
          </select>
        </div>
        <p className="text-sm text-muted-foreground mt-4">Bonus: First order +50, Birthday month 2×, Review +20, Referral referee +100 referrer +50, Corporate 1.5×</p>
      </SectionCard>
      <SectionCard
        title="Redemption Rules"
        description="Points value, minimum to redeem, max discount %, expiry."
      >
        <div className="grid gap-2">
          <Label>Points value</Label>
          <div className="flex items-center gap-2">
            <Input name="pointsValuePoints" type="number" defaultValue={val("pointsValuePoints", "1")} className="w-20" /> point = KES
            <Input name="pointsValueKes" type="number" defaultValue={val("pointsValueKes", "0.50")} className="w-24" />
          </div>
          <Label>Minimum to redeem (points)</Label>
          <Input name="minRedeemPoints" type="number" defaultValue={val("minRedeemPoints", "200")} />
          <Label>Maximum discount per order (%)</Label>
          <Input name="maxDiscountPct" type="number" defaultValue={val("maxDiscountPct", "20")} />
          <Label>Expiry (months of inactivity)</Label>
          <Input name="expiryMonths" type="number" defaultValue={val("expiryMonths", "24")} />
        </div>
      </SectionCard>
      <SectionCard title="Tiers (optional)" description="Bronze, Silver, Gold, Platinum with earn rate and benefits.">
        <SettingsSwitch name="tiersEnabled" defaultValue={bool("tiersEnabled", false)} label="Enable tiers" />
        <p className="text-sm text-muted-foreground mt-2">Bronze 0–999, Silver 1k–4.9k (1.25×), Gold 5k–19.9k (1.5× + free delivery), Platinum 20k+ (2× + express + priority)</p>
      </SectionCard>
      <SettingsSaveButton formId="settings-loyalty" action={API} />
    </form>
  );
}
