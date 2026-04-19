"use client";

import { useState, useEffect } from "react";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Trash2, Copy, Check, ShieldAlert, Key, Globe, Lock, Search } from "lucide-react";
import { toast } from "sonner"; // Assuming sonner is the toast system

export function SecuritySettingsClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [auditResults, setAuditResults] = useState<any[] | null>(null);
  const [runningAudit, setRunningAudit] = useState(false);
  const [currentIp, setCurrentIp] = useState<string>("");

  // API Key Modal State
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpiry, setNewKeyExpiry] = useState("90 days");
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(["read:products"]);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchKeys();
    detectIp();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/admin/settings/security");
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      toast.error("Failed to load security settings");
    } finally {
      setLoading(false);
    }
  }

  async function fetchKeys() {
    try {
      const res = await fetch("/api/admin/settings/api-keys");
      const data = await res.json();
      setApiKeys(data);
    } catch (err) {
      toast.error("Failed to load API keys");
    }
  }

  async function detectIp() {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      setCurrentIp(data.ip);
    } catch (err) {
      console.error("IP detection failed", err);
    }
  }

  async function saveSection(section: string, data: any) {
    setSaving(section);
    try {
      const res = await fetch("/api/admin/settings/security", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [section]: data }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      toast.success("Settings saved");
      fetchSettings();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(null);
    }
  }

  async function generateKey() {
    if (!newKeyName) return toast.error("Please enter a key name");
    setSaving("generating-key");
    try {
      const res = await fetch("/api/admin/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName,
          expiry: newKeyExpiry,
          permissions: newKeyPermissions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate key");
      setGeneratedKey(data.plaintextKey);
      fetchKeys();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(null);
    }
  }

  async function revokeKey(id: string) {
    if (!confirm("Are you sure you want to revoke this API key?")) return;
    try {
      const res = await fetch(`/api/admin/settings/api-keys/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to revoke key");
      toast.success("API key revoked");
      fetchKeys();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function runAudit() {
    setRunningAudit(true);
    setAuditResults(null);
    try {
      const res = await fetch("/api/admin/settings/security/audit", { method: "POST" });
      const data = await res.json();
      setAuditResults(data);
      toast.success("Security audit complete");
    } catch (err) {
      toast.error("Security audit failed");
    } finally {
      setRunningAudit(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const {
    passwordPolicy = { minLength: 12, requireUppercase: true, requireNumbers: true, requireSpecialChars: true, passwordExpiry: "Never", preventReuseOf: 5 },
    twoFactorPolicy = { superAdmin: "Enforced", admin: "Enforced", staff: "Recommended", customer: "Optional" },
    sessionSettings = { adminTimeoutHours: 4, customerTimeoutDays: 30, concurrentAdminMax: 3 },
    ipAllowlist = { enabled: false, ips: [] },
    rateLimitSettings = { loginMaxAttempts: 5, loginLockoutMinutes: 15, apiLimitPerMinute: 100, checkoutLimitPer10Min: 10, restrictMpesaIps: false },
  } = {
    passwordPolicy: settings?.passwordPolicy ?? undefined,
    twoFactorPolicy: settings?.twoFactorPolicy ?? undefined,
    sessionSettings: settings?.sessionSettings ?? undefined,
    ipAllowlist: settings?.ipAllowlist ?? undefined,
    rateLimitSettings: settings?.rateLimitSettings ?? undefined,
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Security & Access</h1>

      {/* SECTION 1: Password Policy */}
      <SectionCard
        title="Password Policy"
        description="Minimum length, uppercase, numbers, expiry, reuse."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Minimum length</Label>
            <Input
              type="number"
              value={passwordPolicy.minLength}
              onChange={(e) => setSettings({ ...settings, passwordPolicy: { ...passwordPolicy, minLength: parseInt(e.target.value) } })}
            />
          </div>
          <div className="flex flex-col gap-4 mt-6">
            <div className="flex items-center gap-4">
              <Switch
                checked={passwordPolicy.requireUppercase}
                onCheckedChange={(checked) => setSettings({ ...settings, passwordPolicy: { ...passwordPolicy, requireUppercase: checked } })}
              />
              <Label>Require uppercase</Label>
            </div>
            <div className="flex items-center gap-4">
              <Switch
                checked={passwordPolicy.requireNumbers}
                onCheckedChange={(checked) => setSettings({ ...settings, passwordPolicy: { ...passwordPolicy, requireNumbers: checked } })}
              />
              <Label>Require numbers</Label>
            </div>
            <div className="flex items-center gap-4">
              <Switch
                checked={passwordPolicy.requireSpecialChars}
                onCheckedChange={(checked) => setSettings({ ...settings, passwordPolicy: { ...passwordPolicy, requireSpecialChars: checked } })}
              />
              <Label>Require special characters</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Password expiry</Label>
            <select
              className="h-10 rounded-md border px-3 w-full bg-background"
              value={passwordPolicy.passwordExpiry}
              onChange={(e) => setSettings({ ...settings, passwordPolicy: { ...passwordPolicy, passwordExpiry: e.target.value } })}
            >
              <option>Never</option>
              <option>30 days</option>
              <option>90 days</option>
              <option>180 days</option>
              <option>1 year</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Prevent reuse of last N passwords</Label>
            <Input
              type="number"
              value={passwordPolicy.preventReuseOf}
              onChange={(e) => setSettings({ ...settings, passwordPolicy: { ...passwordPolicy, preventReuseOf: parseInt(e.target.value) } })}
            />
          </div>
        </div>
        <Button
          className="mt-4"
          onClick={() => saveSection("passwordPolicy", passwordPolicy)}
          disabled={saving === "passwordPolicy"}
        >
          {saving === "passwordPolicy" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Password Policy
        </Button>
      </SectionCard>

      {/* SECTION 2: 2FA Policy */}
      <SectionCard
        title="2FA Policy"
        description="Enforce 2FA by role."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["superAdmin", "admin", "staff", "customer"].map((role) => (
            <div key={role} className="space-y-2">
              <Label className="capitalize">{role}</Label>
              <select
                className="h-10 rounded-md border px-3 w-full bg-background"
                value={twoFactorPolicy[role]}
                onChange={(e) => setSettings({ ...settings, twoFactorPolicy: { ...twoFactorPolicy, [role]: e.target.value } })}
              >
                <option>Enforced</option>
                <option>Recommended</option>
                <option>Optional</option>
                <option>Disabled</option>
              </select>
            </div>
          ))}
        </div>
        <Button
          className="mt-4"
          onClick={() => saveSection("twoFactorPolicy", twoFactorPolicy)}
          disabled={saving === "twoFactorPolicy"}
        >
          {saving === "twoFactorPolicy" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save 2FA Policy
        </Button>
      </SectionCard>

      {/* SECTION 3: Session Settings */}
      <SectionCard
        title="Session Settings"
        description="Admin and customer session timeouts."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Admin timeout (hours)</Label>
            <Input
              type="number"
              value={sessionSettings.adminTimeoutHours}
              onChange={(e) => setSettings({ ...settings, sessionSettings: { ...sessionSettings, adminTimeoutHours: parseInt(e.target.value) } })}
            />
          </div>
          <div className="space-y-2">
            <Label>Customer timeout (days)</Label>
            <Input
              type="number"
              value={sessionSettings.customerTimeoutDays}
              onChange={(e) => setSettings({ ...settings, sessionSettings: { ...sessionSettings, customerTimeoutDays: parseInt(e.target.value) } })}
            />
          </div>
          <div className="space-y-2">
            <Label>Max concurrent admin sessions</Label>
            <Input
              type="number"
              value={sessionSettings.concurrentAdminMax}
              onChange={(e) => setSettings({ ...settings, sessionSettings: { ...sessionSettings, concurrentAdminMax: parseInt(e.target.value) } })}
            />
          </div>
        </div>
        <Button
          className="mt-4"
          onClick={() => saveSection("sessionSettings", sessionSettings)}
          disabled={saving === "sessionSettings"}
        >
          {saving === "sessionSettings" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Session Settings
        </Button>
      </SectionCard>

      {/* SECTION 4: IP Allowlist */}
      <SectionCard
        title="IP Allowlist (Admin Panel)"
        description="Restrict admin access to specific IPs. Only enable if you have a static IP."
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Switch
              checked={ipAllowlist.enabled}
              onCheckedChange={(checked) => {
                if (checked && !ipAllowlist.ips.includes(currentIp)) {
                  if (!confirm(`Your current IP (${currentIp}) is NOT in the allowlist. You might lock yourself out. Proceed?`)) return;
                }
                setSettings({ ...settings, ipAllowlist: { ...ipAllowlist, enabled: checked } });
              }}
            />
            <Label>Restrict admin panel to IP allowlist</Label>
          </div>
          {ipAllowlist.enabled && (
            <p className="text-sm text-amber-600 font-medium flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              You will be locked out if your IP changes and this is enabled.
            </p>
          )}
          
          <div className="space-y-2">
            <Label>Your current IP: <Badge variant="secondary">{currentIp || "Detecting..."}</Badge></Label>
            <div className="flex gap-2">
              <Input
                id="new-ip"
                placeholder="Add IP or CIDR (e.g. 1.2.3.4 or 1.2.3.0/24)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = e.currentTarget.value.trim();
                    if (val) {
                      if (!ipAllowlist.ips.includes(val)) {
                        const newIps = [...ipAllowlist.ips, val];
                        saveSection("ipAllowlist", { ...ipAllowlist, ips: newIps });
                        e.currentTarget.value = "";
                      }
                    }
                  }
                }}
              />
              <Button onClick={() => {
                const el = document.getElementById("new-ip") as HTMLInputElement;
                const val = el.value.trim();
                if (val && !ipAllowlist.ips.includes(val)) {
                  const newIps = [...ipAllowlist.ips, val];
                  saveSection("ipAllowlist", { ...ipAllowlist, ips: newIps });
                  el.value = "";
                }
              }}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {ipAllowlist.ips.map((ip: string) => (
                <Badge key={ip} variant="outline" className="pl-3 pr-1 py-1 flex items-center gap-2">
                  {ip}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 rounded-full p-0"
                    onClick={() => {
                      const newIps = ipAllowlist.ips.filter((i: string) => i !== ip);
                      saveSection("ipAllowlist", { ...ipAllowlist, ips: newIps });
                    }}
                  >
                    ×
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <Button
          className="mt-4"
          onClick={() => saveSection("ipAllowlist", { enabled: ipAllowlist.enabled })}
          disabled={saving === "ipAllowlist"}
          variant={ipAllowlist.enabled ? "outline" : "default"}
        >
          {saving === "ipAllowlist" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {ipAllowlist.enabled ? "Update Status" : "Save Status"}
        </Button>
      </SectionCard>

      {/* SECTION 5: API Keys */}
      <SectionCard
        title="API Keys"
        description="Generate keys for developers. Never share; rotate every 90 days."
      >
        <Button type="button" variant="outline" onClick={() => { 
          setGeneratedKey(null);
          setIsKeyModalOpen(true); 
        }}>
          <Key className="mr-2 h-4 w-4" />
          Generate New API Key
        </Button>
        
        <div className="mt-6 border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Name</th>
                <th className="px-4 py-2 text-left font-medium">Prefix</th>
                <th className="px-4 py-2 text-left font-medium">Permissions</th>
                <th className="px-4 py-2 text-left font-medium">Expires</th>
                <th className="px-4 py-2 text-left font-medium">Last Used</th>
                <th className="px-4 py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground italic">
                    No active API keys found.
                  </td>
                </tr>
              ) : (
                apiKeys.map((k) => (
                  <tr key={k.id}>
                    <td className="px-4 py-2 font-medium">{k.name}</td>
                    <td className="px-4 py-2"><code>{k.keyPrefix}••••••••</code></td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {k.permissions.map((p: string) => (
                          <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground text-xs">
                      {k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : "Never"}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground text-xs">
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "Never"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => revokeKey(k.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* SECTION 6: Security Headers */}
      <SectionCard
        title="Security Headers"
        description="Auto-configured via next.config.mjs."
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Check the status of application security headers and infrastructure settings.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={runAudit} disabled={runningAudit}>
            {runningAudit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Run Security Audit
          </Button>

          {auditResults && (
            <div className="mt-4 border rounded-md divide-y overflow-hidden text-sm">
              {auditResults.map((res) => (
                <div key={res.id} className="p-3 flex items-start gap-3">
                  <div className="mt-0.5">
                    {res.status === "Pass" ? (
                      <Badge className="bg-green-600">✅ Pass</Badge>
                    ) : res.status === "Warning" ? (
                      <Badge variant="secondary" className="bg-amber-500 text-white">⚠️ Warning</Badge>
                    ) : (
                      <Badge variant="destructive">❌ Fail</Badge>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold">{res.name}</h4>
                    <p className="text-muted-foreground text-xs">{res.message}</p>
                    {res.suggestion && (
                      <p className="text-blue-600 text-xs mt-1 font-medium">Suggestion: {res.suggestion}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      {/* SECTION 7: Rate Limiting */}
      <SectionCard
        title="Rate Limiting"
        description="Login lockout, API limit, checkout limit."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Login attempts before lockout</Label>
            <Input
              type="number"
              value={rateLimitSettings.loginMaxAttempts}
              onChange={(e) => setSettings({ ...settings, rateLimitSettings: { ...rateLimitSettings, loginMaxAttempts: parseInt(e.target.value) } })}
            />
          </div>
          <div className="space-y-2">
            <Label>Lockout duration (minutes)</Label>
            <Input
              type="number"
              value={rateLimitSettings.loginLockoutMinutes}
              onChange={(e) => setSettings({ ...settings, rateLimitSettings: { ...rateLimitSettings, loginLockoutMinutes: parseInt(e.target.value) } })}
            />
          </div>
          <div className="space-y-2">
            <Label>API rate limit per minute</Label>
            <Input
              type="number"
              value={rateLimitSettings.apiLimitPerMinute}
              onChange={(e) => setSettings({ ...settings, rateLimitSettings: { ...rateLimitSettings, apiLimitPerMinute: parseInt(e.target.value) } })}
            />
          </div>
          <div className="space-y-2">
            <Label>Checkout attempts per 10 min</Label>
            <Input
              type="number"
              value={rateLimitSettings.checkoutLimitPer10Min}
              onChange={(e) => setSettings({ ...settings, rateLimitSettings: { ...rateLimitSettings, checkoutLimitPer10Min: parseInt(e.target.value) } })}
            />
          </div>
          <div className="flex items-center gap-4 mt-2">
            <Switch
              checked={rateLimitSettings.restrictMpesaIps}
              onCheckedChange={(checked) => setSettings({ ...settings, rateLimitSettings: { ...rateLimitSettings, restrictMpesaIps: checked } })}
            />
            <Label>Restrict M-Pesa callbacks to Safaricom IPs only</Label>
          </div>
        </div>
        <Button
          className="mt-4"
          onClick={() => saveSection("rateLimitSettings", rateLimitSettings)}
          disabled={saving === "rateLimitSettings"}
        >
          {saving === "rateLimitSettings" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Rate Limiting
        </Button>
      </SectionCard>

      {/* GENERATE API KEY MODAL */}
      <Dialog open={isKeyModalOpen} onOpenChange={setIsKeyModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate New API Key</DialogTitle>
          </DialogHeader>
          {!generatedKey ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Key Name</Label>
                <Input
                  placeholder="e.g. Mobile App, Inventory Sync"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry</Label>
                <select
                  className="h-10 rounded-md border px-3 w-full bg-background text-sm"
                  value={newKeyExpiry}
                  onChange={(e) => setNewKeyExpiry(e.target.value)}
                >
                  <option>30 days</option>
                  <option>90 days</option>
                  <option>1 year</option>
                  <option>Never</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {["read:products", "read:orders", "write:orders", "read:customers", "webhooks"].map((p) => (
                    <label key={p} className="flex items-center gap-2 border p-2 rounded cursor-pointer hover:bg-muted">
                      <input
                        type="checkbox"
                        checked={newKeyPermissions.includes(p)}
                        onChange={(e) => {
                          if (e.target.checked) setNewKeyPermissions([...newKeyPermissions, p]);
                          else setNewKeyPermissions(newKeyPermissions.filter((item) => item !== p));
                        }}
                      />
                      {p}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-900 text-sm flex gap-3">
                <Lock className="h-5 w-5 shrink-0" />
                <p>This key will not be shown again. Copy it now and store it securely.</p>
              </div>
              <div className="flex gap-2">
                <Input readOnly value={generatedKey} className="font-mono text-xs bg-muted" />
                <Button variant="outline" size="sm" onClick={() => {
                  navigator.clipboard.writeText(generatedKey);
                  toast.success("Key copied to clipboard");
                }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            {!generatedKey ? (
              <Button onClick={generateKey} disabled={saving === "generating-key"}>
                {saving === "generating-key" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Key
              </Button>
            ) : (
              <Button onClick={() => setIsKeyModalOpen(false)}>Close & Refresh</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
