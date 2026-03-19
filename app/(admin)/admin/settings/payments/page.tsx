import { requireAdminSettings } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsSaveButton } from "@/components/settings/settings-save-button";
import { SettingsSwitch } from "@/components/settings/settings-switch";
import { MpesaPaybillTillFields } from "@/components/settings/mpesa-paybill-till-fields";

function getMpesaCallbackUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa";
  return `${base.replace(/\/$/, "")}/api/payments/mpesa/callback`;
}

function asStr(v: unknown): string {
  if (v == null) return "";
  return String(v);
}

export default async function AdminSettingsPaymentsPage() {
  await requireAdminSettings();
  const mpesaCallbackUrl = getMpesaCallbackUrl();
  let payments: Record<string, unknown> = {};
  try {
    const row = await prisma.pricingConfig.findUnique({ where: { key: "adminSettings:payments" } });
    if (row?.valueJson) payments = (JSON.parse(row.valueJson) as Record<string, unknown>) ?? {};
  } catch {
    // use defaults
  }
  const p = (key: string, fallback: string) => asStr(payments[key] ?? fallback);
  const pBool = (key: string, fallback: boolean) => {
    const v = payments[key];
    if (v === true || v === "true") return true;
    if (v === false || v === "false") return false;
    return fallback;
  };
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
          <select name="mpesaEnvironment" className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="sandbox">Sandbox</option>
            <option value="production">Production</option>
          </select>
          <Label>Business Short Code</Label>
          <Input name="mpesaShortCode" type="password" placeholder="••••••••" />
          <Label>Passkey</Label>
          <Input name="mpesaPasskey" type="password" placeholder="••••••••" />
          <Label>Consumer Key</Label>
          <Input name="mpesaConsumerKey" type="password" placeholder="••••••••" />
          <Label>Consumer Secret</Label>
          <Input name="mpesaConsumerSecret" type="password" placeholder="••••••••" />
          <Label>Callback URL</Label>
          <Input name="mpesaCallbackUrl" readOnly className="bg-muted" value={mpesaCallbackUrl} />
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-2">Test M-Pesa Connection</Button>
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm font-medium text-foreground mb-2">Paybill / Till (shown to customers)</p>
          <p className="text-sm text-muted-foreground mb-3">When STK push fails or for manual payment, customers see these numbers. Update if your business or till number changes.</p>
          <MpesaPaybillTillFields />
        </div>
      </SectionCard>
      <SectionCard title="Pesapal" description="Consumer Key, Secret, IPN URL. Primary for cards and other mobile money.">
        <p className="text-sm text-muted-foreground">Status: Not configured</p>
        <Button type="button" variant="outline" size="sm">Configure</Button>
      </SectionCard>
      <SectionCard
        title="Bank Transfer"
        description="Show for orders over threshold."
      >
        <SettingsSwitch name="bankTransferEnabled" defaultValue={pBool("bankTransferEnabled", false)} label="Enable bank transfer" />
        <div className="grid gap-2 mt-4">
          <Label>Show for orders over (KES)</Label>
          <Input name="bankTransferMinOrder" type="number" defaultValue={p("bankTransferMinOrder", "10000")} />
          <Label>Bank Name / Account Name / Account Number / Branch</Label>
          <Input name="bankTransferDetails" placeholder="Bank details" defaultValue={p("bankTransferDetails", "")} />
        </div>
      </SectionCard>
      <SectionCard
        title="Checkout Behaviour"
        description="Guest checkout, minimum order, payment method order."
      >
        <SettingsSwitch name="guestCheckoutEnabled" defaultValue={pBool("guestCheckoutEnabled", true)} label="Guest checkout enabled" />
        <div className="grid gap-2 mt-4">
          <Label>Minimum order value (KES)</Label>
          <Input name="minOrderValue" type="number" defaultValue={p("minOrderValue", "500")} />
          <Label>Payment timeout (minutes)</Label>
          <Input name="paymentTimeoutMinutes" type="number" defaultValue={p("paymentTimeoutMinutes", "30")} />
        </div>
        <p className="text-sm text-muted-foreground">Accepted: M-Pesa, PesaPal (cards & mobile money), Bank Transfer. M-Pesa first.</p>
      </SectionCard>
      <SectionCard
        title="Invoice Settings"
        description="Prefixes, next number, due days."
      >
        <div className="grid gap-2">
          <Label>Invoice prefix</Label>
          <Input name="invoicePrefix" defaultValue={p("invoicePrefix", "PHUB-INV-")} />
          <Label>Quote prefix</Label>
          <Input name="quotePrefix" defaultValue={p("quotePrefix", "PHUB-QT-")} />
          <Label>Next invoice number</Label>
          <Input name="nextInvoiceNumber" type="number" defaultValue={p("nextInvoiceNumber", "1001")} />
          <Label>Invoice due days</Label>
          <Input name="invoiceDueDays" type="number" defaultValue={p("invoiceDueDays", "30")} />
        </div>
      </SectionCard>
      <SettingsSaveButton formId="settings-payments" action="/api/admin/settings/payments" />
      </form>
    </div>
  );
}
