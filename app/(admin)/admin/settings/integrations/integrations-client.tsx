"use client";

import { useState } from "react";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsSwitch } from "@/components/settings/settings-switch";
import { Loader2, Eye, EyeOff, Copy, Check, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface IntegrationsClientProps {
  initialData: any;
  webhookUrl: string;
  isSuperAdmin: boolean;
}

export function IntegrationsClient({ initialData, webhookUrl, isSuperAdmin }: IntegrationsClientProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [showApiKey, setShowApiKey] = useState(false);
  const [realApiKey, setRealApiKey] = useState<string | null>(null);
  const [loadingApiKey, setLoadingApiKey] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [testingStorage, setTestingStorage] = useState(false);
  const [storageResult, setStorageResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<Record<string, "success" | "error" | null>>({});

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toggleApiKey = async () => {
    if (showApiKey) {
      setShowApiKey(false);
      return;
    }

    if (realApiKey) {
      setShowApiKey(true);
      return;
    }

    setLoadingApiKey(true);
    try {
      const res = await fetch("/api/admin/settings/api-key");
      const d = await res.json();
      if (d.apiKey) {
        setRealApiKey(d.apiKey);
        setShowApiKey(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingApiKey(false);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm("Are you sure? This will invalidate the existing API key immediately.")) return;
    setRegenerating(true);
    try {
      const res = await fetch("/api/admin/settings/api-key/regenerate", { method: "POST" });
      const d = await res.json();
      if (d.apiKey) {
        setRealApiKey(d.apiKey);
        setShowApiKey(true);
        alert("New API key generated!");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to regenerate key");
    } finally {
      setRegenerating(false);
    }
  };

  const handleReindex = async () => {
    setReindexing(true);
    try {
      const res = await fetch("/api/admin/algolia/reindex", { method: "POST" });
      const d = await res.json();
      if (d.success) {
        alert(d.message);
      } else {
        alert("Error: " + d.error);
      }
    } catch (e: any) {
      alert("Failed: " + e.message);
    } finally {
      setReindexing(false);
    }
  };

  const handleTestStorage = async () => {
    setTestingStorage(true);
    setStorageResult(null);
    try {
      const res = await fetch("/api/admin/settings/storage/test", { method: "POST" });
      const d = await res.json();
      setStorageResult({ success: !!d.success, message: d.message || d.error });
    } catch (e: any) {
      setStorageResult({ success: false, message: e.message });
    } finally {
      setTestingStorage(false);
    }
  };

  const saveSection = async (section: string, fields: string[]) => {
    setSaving(section);
    setSaveStatus({ ...saveStatus, [section]: null });
    
    const payload: any = {};
    fields.forEach(f => payload[f] = data[f]);

    try {
      const res = await fetch("/api/admin/settings/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSaveStatus({ ...saveStatus, [section]: "success" });
        router.refresh();
      } else {
        setSaveStatus({ ...saveStatus, [section]: "error" });
      }
    } catch (e) {
      setSaveStatus({ ...saveStatus, [section]: "error" });
    } finally {
      setSaving(null);
      setTimeout(() => setSaveStatus({ ...saveStatus, [section]: null }), 3000);
    }
  };

  const updateData = (field: string, value: any) => {
    setData({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* SECTION 1 — API Keys & Webhooks */}
      <SectionCard
        title="API Keys & Webhooks"
        description="API keys for external access. Webhook URL for third-party service callbacks."
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>API Key</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                className="bg-muted font-mono"
                value={showApiKey ? (realApiKey || "••••••••••••••••") : "ph_live_••••••••••••••••"}
              />
              <Button variant="outline" size="icon" onClick={toggleApiKey} disabled={loadingApiKey}>
                {loadingApiKey ? <Loader2 className="h-4 w-4 animate-spin" /> : showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(realApiKey || "", "apiKey")}
                disabled={!showApiKey || !realApiKey}
              >
                {copiedField === "apiKey" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            {isSuperAdmin && (
              <Button variant="secondary" size="sm" className="w-fit" onClick={handleRegenerate} disabled={regenerating}>
                {regenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Regenerate Key
              </Button>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Webhook URL</Label>
            <div className="flex gap-2">
              <Input readOnly className="bg-muted font-mono" value={webhookUrl} />
              <Button variant="outline" size="icon" onClick={() => handleCopy(webhookUrl, "webhook")}>
                {copiedField === "webhook" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* SECTION 2 — Analytics */}
      <SectionCard
        title="Analytics"
        description="Google Analytics 4, Search Console, Hotjar."
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Google Analytics 4 — Measurement ID</Label>
            <Input
              placeholder="G-XXXXXXXXXX"
              value={data.ga4MeasurementId || ""}
              onChange={(e) => updateData("ga4MeasurementId", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Hotjar Site ID</Label>
            <Input
              placeholder="Site ID"
              value={data.hotjarSiteId || ""}
              onChange={(e) => updateData("hotjarSiteId", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Google Search Console Verification</Label>
            <Input
              placeholder="Meta tag content or DNS TXT value"
              value={data.searchConsoleVerification || ""}
              onChange={(e) => updateData("searchConsoleVerification", e.target.value)}
            />
          </div>
          <Button
            className="w-fit"
            onClick={() => saveSection("analytics", ["ga4MeasurementId", "hotjarSiteId", "searchConsoleVerification"])}
            disabled={saving === "analytics"}
          >
            {saving === "analytics" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saveStatus.analytics === "success" ? "✓ Saved" : saveStatus.analytics === "error" ? "✗ Error" : "Save Analytics"}
          </Button>
        </div>
      </SectionCard>

      {/* SECTION 3 — Search (Algolia) */}
      <SectionCard
        title="Search (Algolia)"
        description="Set NEXT_PUBLIC_ALGOLIA_APP_ID and NEXT_PUBLIC_ALGOLIA_SEARCH_KEY in env."
      >
        <div className="grid gap-4">
          <div className="flex items-center gap-2">
             <SettingsSwitch
              name="algoliaEnabled"
              defaultValue={data.algoliaEnabled}
              label="Enable Algolia Search"
              // Update local state when switch changes
              onChange={(enabled) => {
                updateData("algoliaEnabled", enabled);
                // Auto save for this switch
                setTimeout(() => saveSection("algolia", ["algoliaEnabled"]), 100);
              }}
            />
          </div>
          <Button variant="outline" size="sm" className="w-fit" onClick={handleReindex} disabled={reindexing}>
            {reindexing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Re-index all products
          </Button>
        </div>
      </SectionCard>

      {/* SECTION 4 — Error Tracking */}
      <SectionCard
        title="Error Tracking (Sentry)"
        description="DSN for client and server-side tracking."
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Sentry DSN</Label>
            <Input
              type="password"
              placeholder="https://..."
              value={data.sentryDsn || ""}
              onChange={(e) => updateData("sentryDsn", e.target.value)}
            />
          </div>
          <Button
            className="w-fit"
            onClick={() => saveSection("sentry", ["sentryDsn"])}
            disabled={saving === "sentry"}
          >
            {saving === "sentry" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saveStatus.sentry === "success" ? "✓ Saved" : saveStatus.sentry === "error" ? "✗ Error" : "Save Sentry"}
          </Button>
        </div>
      </SectionCard>

      {/* SECTION 5 — Storage (S3 / R2) */}
      <SectionCard
        title="Storage (S3 / R2)"
        description="Override bucket names from env."
      >
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Public Bucket</Label>
              <Input
                placeholder="printhub-public"
                value={data.storagePublicBucket || ""}
                onChange={(e) => updateData("storagePublicBucket", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Uploads Bucket</Label>
              <Input
                placeholder="printhub-uploads"
                value={data.storageBucket || ""}
                onChange={(e) => updateData("storageBucket", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>CDN URL</Label>
            <Input
              placeholder="https://cdn..."
              value={data.storageCdnUrl || ""}
              onChange={(e) => updateData("storageCdnUrl", e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-center">
            <Button
              className="w-fit"
              onClick={() => saveSection("storage", ["storagePublicBucket", "storageBucket", "storageCdnUrl"])}
              disabled={saving === "storage"}
            >
              {saving === "storage" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saveStatus.storage === "success" ? "✓ Saved" : saveStatus.storage === "error" ? "✗ Error" : "Save Storage Settings"}
            </Button>
            <Button variant="outline" onClick={handleTestStorage} disabled={testingStorage}>
              {testingStorage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test Connection
            </Button>
          </div>
          {storageResult && (
            <p className={`text-sm ${storageResult.success ? "text-green-600" : "text-destructive"}`}>
              {storageResult.success ? "✓ " : "✗ "} {storageResult.message}
            </p>
          )}
        </div>
      </SectionCard>

      {/* SECTION 6 — Accounting */}
      <SectionCard
        title="Accounting (Xero / QuickBooks)"
        description="Connect for automated invoicing and reconciliation."
      >
        <div className="grid gap-4">
           <div>
            <Button
              variant="outline"
              disabled={data.xeroConnected}
              onClick={() => window.location.href = "/api/admin/integrations/xero/connect"}
            >
              Connect Xero
            </Button>
            {data.xeroConnected && <span className="ml-2 text-sm text-green-600 font-medium">✓ Connected</span>}
          </div>
          <div>
            <Button
              variant="outline"
              disabled={data.quickbooksConnected}
              onClick={() => window.location.href = "/api/admin/integrations/quickbooks/connect"}
            >
              Connect QuickBooks
            </Button>
            {data.quickbooksConnected && <span className="ml-2 text-sm text-green-600 font-medium">✓ Connected</span>}
          </div>
        </div>
      </SectionCard>

      {/* SECTION 7 — Google Business */}
      <SectionCard title="Google Business" description="Verify listing.">
        <div className="grid gap-4">
          <Button
            variant="outline"
            disabled={data.googleBusinessConnected}
            onClick={() => window.location.href = "/api/admin/integrations/google-business/connect"}
          >
            Connect / Verify
          </Button>
          {data.googleBusinessConnected && <span className="text-sm text-green-600 font-medium">✓ Connected</span>}
        </div>
      </SectionCard>
    </div>
  );
}
