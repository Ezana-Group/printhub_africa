import { requireAdminSettings } from "@/lib/auth-guard";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingsSaveButton } from "@/components/settings/settings-save-button";

export default async function AdminSettingsSecurityPage() {
  await requireAdminSettings();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Security & Access</h1>
      <form id="settings-security" className="space-y-6">
      <SectionCard
        title="Password Policy"
        description="Minimum length, uppercase, numbers, expiry, reuse."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <div><Label>Minimum length</Label><Input type="number" defaultValue="8" /></div>
          <div className="flex items-center gap-4"><Switch defaultChecked /><Label>Require uppercase</Label></div>
          <div className="flex items-center gap-4"><Switch defaultChecked /><Label>Require numbers</Label></div>
          <div className="flex items-center gap-4"><Switch /><Label>Require special characters</Label></div>
          <div><Label>Password expiry</Label><select className="h-10 rounded-md border px-3 w-full"><option>Never</option><option>90 days</option></select></div>
          <div><Label>Prevent reuse of last</Label><Input type="number" defaultValue="5" className="w-24" /> passwords</div>
        </div>
      </SectionCard>
      <SectionCard
        title="2FA Policy"
        description="Enforce 2FA by role."
      >
        <p className="text-sm text-muted-foreground">SUPER_ADMIN: Enforced. ADMIN: Enforced. STAFF: Recommended. CUSTOMER: Optional.</p>
      </SectionCard>
      <SectionCard
        title="Session Settings"
        description="Admin and customer session timeouts."
      >
        <div className="grid gap-2">
          <Label>Admin session timeout</Label>
          <Input type="number" defaultValue="4" /> hours
          <Label>Customer session timeout</Label>
          <Input type="number" defaultValue="30" /> days
          <Label>Concurrent admin sessions max</Label>
          <Input type="number" defaultValue="3" />
        </div>
      </SectionCard>
      <SectionCard
        title="IP Allowlist (Admin Panel)"
        description="Restrict admin access to specific IPs. Only enable if you have a static IP."
      >
        <div className="flex items-center gap-4">
          <Switch />
          <Label>Restrict admin panel to IP allowlist</Label>
        </div>
        <p className="text-sm text-amber-600 mt-2">You will be locked out if your IP changes and this is enabled.</p>
        <Label className="mt-4">Allowed IPs</Label>
        <Input placeholder="Add IP or CIDR" />
      </SectionCard>
      <SectionCard
        title="API Keys"
        description="Generate keys for developers. Never share; rotate every 90 days."
      >
        <Button type="button" variant="outline">+ Generate New API Key</Button>
        <p className="text-sm text-muted-foreground mt-2">Name, Permissions, Expiry. Table: Name | Created | Last Used | Revoke</p>
      </SectionCard>
      <SectionCard
        title="Security Headers"
        description="Auto-configured. Status display only."
      >
        <p className="text-sm text-muted-foreground">HTTPS enforced, X-Frame-Options, CSP, X-Content-Type-Options, Referrer-Policy.</p>
        <Button type="button" variant="outline" size="sm">Run Security Audit</Button>
      </SectionCard>
      <SectionCard
        title="Rate Limiting"
        description="Login lockout, API limit, checkout limit."
      >
        <p className="text-sm text-muted-foreground">Login: 5 attempts per 15 min. API: 100/min. M-Pesa callback: Safaricom IPs only. Checkout: 10 per 10 min.</p>
      </SectionCard>
      <SettingsSaveButton formId="settings-security" action="/api/admin/settings/security" />
      </form>
    </div>
  );
}
