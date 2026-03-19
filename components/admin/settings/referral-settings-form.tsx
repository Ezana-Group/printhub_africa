"use client";

import { useEffect, useState } from "react";
import { SectionCard } from "@/components/settings/section-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsSaveButton } from "@/components/settings/settings-save-button";
import { SettingsSwitch } from "@/components/settings/settings-switch";
import { Loader2 } from "lucide-react";

const API = "/api/admin/settings/referral";

type ReferralData = Record<string, string | boolean>;

export function ReferralSettingsForm() {
  const [data, setData] = useState<ReferralData | null>(null);

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
    <form id="settings-referral" className="space-y-6">
      <SectionCard title="Programme Settings" description="Enable and set referrer/referee rewards.">
        <SettingsSwitch
          name="referralEnabled"
          defaultValue={bool("referralEnabled", false)}
          label="Enable referral programme"
        />
        <div className="grid gap-2 mt-4">
          <Label>Referrer reward</Label>
          <div className="flex gap-2 items-center flex-wrap">
            <Input name="referrerRewardKes" type="number" defaultValue={val("referrerRewardKes", "300")} className="w-28" /> KES account credit
            <span className="text-sm text-muted-foreground">OR</span>
            <Input name="referrerRewardPoints" type="number" defaultValue={val("referrerRewardPoints", "100")} className="w-24" /> loyalty points
          </div>
          <Label>Referee reward</Label>
          <div className="flex gap-2 items-center flex-wrap">
            <Input name="refereeRewardPct" type="number" defaultValue={val("refereeRewardPct", "10")} className="w-20" /> % off first order
            <span className="text-sm text-muted-foreground">OR</span>
            <Input name="refereeRewardKes" type="number" defaultValue={val("refereeRewardKes", "200")} className="w-24" /> KES off
          </div>
          <Label>Minimum referee order (KES) to qualify</Label>
          <Input name="minRefereeOrderKes" type="number" defaultValue={val("minRefereeOrderKes", "1000")} />
          <Label>Referral link format</Label>
          <Input name="referralLinkFormat" defaultValue={val("referralLinkFormat", "printhub.africa/ref/{username}")} readOnly className="bg-muted" />
          <Label>Max referrals per user per month</Label>
          <Input name="maxReferralsPerMonth" type="number" defaultValue={val("maxReferralsPerMonth", "20")} />
        </div>
        <p className="text-sm text-muted-foreground mt-2">Reward granted after referee&apos;s payment clears.</p>
      </SectionCard>
      <SettingsSaveButton formId="settings-referral" action={API} />
    </form>
  );
}
