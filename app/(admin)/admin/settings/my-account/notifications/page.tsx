import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SettingsSaveButton } from "@/components/settings/settings-save-button";

export default function AdminMyAccountNotificationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">My Notifications</h1>
      <form id="settings-my-account-notifications" className="space-y-6">
      <SectionCard
        title="My Work Queue"
        description="When to notify you about assigned jobs."
      >
        <div className="space-y-4">
          {[
            "New job assigned to me",
            "Job priority changed",
            "Job deadline approaching",
            "Customer message on my job",
          ].map((label) => (
            <div key={label} className="flex items-center justify-between">
              <Label>{label}</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="rounded" /> Email</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="rounded" /> SMS</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="rounded" /> In-app</label>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard
        title="General Alerts"
        description="New orders, uploads, quotes, stock, maintenance."
      >
        <div className="space-y-4">
          {[
            "New order received",
            "New upload awaiting review",
            "New quote request",
            "Low stock alert",
            "Maintenance due",
          ].map((label) => (
            <div key={label} className="flex items-center justify-between">
              <Label>{label}</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="rounded" /> Email</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="rounded" /> SMS</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="rounded" /> In-app</label>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard
        title="Shift & Schedule"
        description="Daily digest and end-of-day summary."
      >
        <div className="flex items-center justify-between">
          <Label>Daily job schedule (morning digest, 7am)</Label>
          <Switch />
        </div>
        <div className="flex items-center justify-between">
          <Label>End of day summary (6pm)</Label>
          <Switch />
        </div>
      </SectionCard>
      <SettingsSaveButton formId="settings-my-account-notifications" action="/api/admin/settings/my-account/notifications">
        Save Preferences
      </SettingsSaveButton>
      </form>
    </div>
  );
}
