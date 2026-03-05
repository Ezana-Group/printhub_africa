import { requireAdminSettings } from "@/lib/auth-guard";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingsSaveButton } from "@/components/settings/settings-save-button";

export default async function AdminSettingsReferralPage() {
  await requireAdminSettings();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Referral Programme</h1>
      <form id="settings-referral" className="space-y-6">
      <SectionCard
        title="Programme Settings"
        description="Enable and set referrer/referee rewards."
      >
        <div className="flex items-center gap-4">
          <Switch />
          <Label>Enable referral programme</Label>
        </div>
        <div className="grid gap-2 mt-4">
          <Label>Referrer reward</Label>
          <div className="flex gap-2">
            <Input type="number" defaultValue="300" className="w-28" /> KES account credit
            <span className="text-sm text-muted-foreground self-center">OR</span>
            <Input type="number" defaultValue="100" className="w-24" /> loyalty points
          </div>
          <Label>Referee reward</Label>
          <div className="flex gap-2">
            <Input type="number" defaultValue="10" className="w-20" /> % off first order
            <span className="text-sm text-muted-foreground self-center">OR</span>
            <Input type="number" defaultValue="200" className="w-24" /> KES off
          </div>
          <Label>Minimum referee order (KES) to qualify</Label>
          <Input type="number" defaultValue="1000" />
          <Label>Referral link format</Label>
          <Input defaultValue="printhub.africa/ref/{username}" readOnly className="bg-muted" />
          <Label>Max referrals per user per month</Label>
          <Input type="number" defaultValue="20" />
        </div>
        <p className="text-sm text-muted-foreground mt-2">Reward granted after referee&apos;s payment clears.</p>
      </SectionCard>
      <SettingsSaveButton formId="settings-referral" action="/api/admin/settings/referral" />
      </form>
    </div>
  );
}
