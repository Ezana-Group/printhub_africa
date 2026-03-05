import { requireAdminSettings } from "@/lib/auth-guard";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingsSaveButton } from "@/components/settings/settings-save-button";

export default async function AdminSettingsPaymentsPage() {
  await requireAdminSettings();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Payments & Checkout</h1>
      <form id="settings-payments" className="space-y-6">
      <p className="text-sm text-amber-600">
        Changes take effect immediately on the live site. Test all integrations after making changes.
      </p>
      <SectionCard
        title="M-Pesa (Daraja API) — PRIMARY"
        description="Business Short Code, Passkey, Consumer Key/Secret."
      >
        <p className="text-sm text-muted-foreground mb-2">Status: Not configured</p>
        <div className="grid gap-2">
          <Label>Environment</Label>
          <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option>Sandbox</option>
            <option>Production</option>
          </select>
          <Label>Business Short Code</Label>
          <Input type="password" placeholder="••••••••" />
          <Label>Passkey / Consumer Key / Consumer Secret</Label>
          <Input type="password" placeholder="••••••••" />
          <Label>Callback URL</Label>
          <Input readOnly className="bg-muted" value="https://printhub.africa/api/payments/mpesa/callback" />
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-2">Test M-Pesa Connection</Button>
      </SectionCard>
      <SectionCard title="Pesapal" description="Consumer Key, Secret, IPN URL.">
        <p className="text-sm text-muted-foreground">Status: Not configured</p>
        <Button type="button" variant="outline" size="sm">Configure</Button>
      </SectionCard>
      <SectionCard title="Flutterwave" description="Public Key, Secret Key, Webhook.">
        <p className="text-sm text-muted-foreground">Status: Not configured</p>
      </SectionCard>
      <SectionCard title="Stripe (International Cards)" description="Publishable Key, Secret Key, Webhook Secret.">
        <p className="text-sm text-muted-foreground">Status: Not configured</p>
      </SectionCard>
      <SectionCard
        title="Bank Transfer"
        description="Show for orders over threshold."
      >
        <div className="flex items-center gap-4">
          <Switch />
          <Label>Enable bank transfer</Label>
        </div>
        <div className="grid gap-2 mt-4">
          <Label>Show for orders over (KES)</Label>
          <Input type="number" defaultValue="10000" />
          <Label>Bank Name / Account Name / Account Number / Branch</Label>
          <Input placeholder="Bank details" />
        </div>
      </SectionCard>
      <SectionCard
        title="Checkout Behaviour"
        description="Guest checkout, minimum order, payment method order."
      >
        <div className="flex items-center gap-4">
          <Switch defaultChecked />
          <Label>Guest checkout enabled</Label>
        </div>
        <div className="grid gap-2 mt-4">
          <Label>Minimum order value (KES)</Label>
          <Input type="number" defaultValue="500" />
          <Label>Payment timeout (minutes)</Label>
          <Input type="number" defaultValue="30" />
        </div>
        <p className="text-sm text-muted-foreground">Accepted: M-Pesa, Visa/Mastercard, Flutterwave, Stripe, Bank Transfer. M-Pesa first.</p>
      </SectionCard>
      <SectionCard
        title="Invoice Settings"
        description="Prefixes, next number, due days."
      >
        <div className="grid gap-2">
          <Label>Invoice prefix</Label>
          <Input defaultValue="PHUB-INV-" />
          <Label>Quote prefix</Label>
          <Input defaultValue="PHUB-QT-" />
          <Label>Next invoice number</Label>
          <Input type="number" defaultValue="1001" />
          <Label>Invoice due days</Label>
          <Input type="number" defaultValue="30" />
        </div>
      </SectionCard>
      <SettingsSaveButton formId="settings-payments" action="/api/admin/settings/payments" />
      </form>
    </div>
  );
}
