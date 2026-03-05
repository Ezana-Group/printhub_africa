import { requireAdminSettings } from "@/lib/auth-guard";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingsSaveButton } from "@/components/settings/settings-save-button";

export default async function AdminSettingsNotificationsPage() {
  await requireAdminSettings();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Notifications & Communications</h1>
      <form id="settings-notifications" className="space-y-6">
      <SectionCard
        title="Email (Resend)"
        description="From name, from email, API key. Must be verified domain."
      >
        <div className="grid gap-2">
          <Label>Resend API Key</Label>
          <Input type="password" placeholder="••••••••" />
          <Label>From Name</Label>
          <Input defaultValue="PrintHub" />
          <Label>From Email</Label>
          <Input defaultValue="hello@printhub.africa" />
          <Label>Reply-To</Label>
          <Input placeholder="support@printhub.africa" />
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-2">Test Email</Button>
      </SectionCard>
      <SectionCard
        title="SMS (Africa's Talking)"
        description="API Key, Username, Sender ID (max 11 chars)."
      >
        <div className="grid gap-2">
          <Label>API Key / Username</Label>
          <Input type="password" placeholder="••••••••" />
          <Label>Sender ID</Label>
          <Input defaultValue="PrintHub" placeholder="Max 11 characters" />
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-2">Test SMS</Button>
      </SectionCard>
      <SectionCard
        title="WhatsApp Business"
        description="Number and pre-filled message for website button."
      >
        <div className="grid gap-2">
          <Label>WhatsApp Number</Label>
          <Input placeholder="+254 XXX XXX XXX" />
          <Label>Pre-filled message</Label>
          <Input placeholder="Hi PrintHub, I'd like to get a quote for..." />
        </div>
        <div className="flex items-center gap-4 mt-4">
          <Switch defaultChecked />
          <Label>Show WhatsApp floating button on all pages</Label>
        </div>
      </SectionCard>
      <SectionCard
        title="Admin Email Alerts"
        description="Which events send an email to admin."
      >
        <p className="text-sm text-muted-foreground">
          New order, payment received/failed, new upload, quote request, quote accepted, cancellation, refund, corporate application, low stock, maintenance, support ticket, negative review.
        </p>
        <div className="grid gap-2 mt-4">
          <Label>Admin alert email</Label>
          <Input placeholder="admin@printhub.africa" />
        </div>
      </SectionCard>
      <SectionCard
        title="Customer Communication Templates"
        description="Preview and test automated emails."
      >
        <p className="text-sm text-muted-foreground">
          Welcome, Order Confirmation, Payment Received, Order Shipped, Quote Ready, Quote Expiring, File Review Complete, Abandoned Cart. [Preview] [Send Test] per template.
        </p>
      </SectionCard>
      <SettingsSaveButton formId="settings-notifications" action="/api/admin/settings/notifications" />
      </form>
    </div>
  );
}
