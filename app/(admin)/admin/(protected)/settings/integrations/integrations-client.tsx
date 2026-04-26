"use client";

import { useState } from "react";
import Link from "next/link";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsSwitch } from "@/components/settings/settings-switch";
import {
  Loader2, Eye, EyeOff, Copy, Check, RefreshCw,
  MessageSquare, Webhook, Send, ExternalLink,
  CircleCheck, CircleAlert, Circle, ChevronDown, ChevronUp,
  Server, Key, ShieldCheck, Terminal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface IntegrationsClientProps {
  initialData: any;
  webhookUrl: string;
  isSuperAdmin: boolean;
  whatsappServiceUrl?: string;
}

export function IntegrationsClient({ initialData, webhookUrl, isSuperAdmin, whatsappServiceUrl = "" }: IntegrationsClientProps) {
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

  // ── WhatsApp state ─────────────────────────────────────────────────────────
  const [waServiceStatus, setWaServiceStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const [waServiceMsg, setWaServiceMsg]       = useState("");
  const [waExpandedStep, setWaExpandedStep]   = useState<number | null>(1);
  const [waTestPhone, setWaTestPhone]         = useState("");
  const [waTestMsg, setWaTestMsg]             = useState("Hello from PrintHub Africa! 👋 This is a test message.");
  const [waSending, setWaSending]             = useState(false);
  const [waSendResult, setWaSendResult]       = useState<{ ok: boolean; text: string } | null>(null);

  const waWebhookUrl = whatsappServiceUrl ? `${whatsappServiceUrl}/webhook` : "";
  const isWaConfigured = !!whatsappServiceUrl;
  const waServiceEnvBlock = `# WhatsApp service (.env in /whatsapp)
NODE_ENV=production
PORT=3001
BASE_URL=https://YOUR_WHATSAPP_SERVICE_DOMAIN

# Meta WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_VERIFY_TOKEN=printhub_verify_2026

# Database (MongoDB - Railway or Atlas)
MONGODB_URI=

# Auth and internal security
JWT_SECRET=CHANGE_THIS_TO_A_LONG_RANDOM_SECRET
JWT_EXPIRES_IN=8h
INTERNAL_SECRET=SET_THE_SAME_VALUE_IN_BOTH_SERVICES

# Optional dashboard login (only used by standalone whatsapp dashboard)
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=CHANGE_ME`;

  const nextAppEnvBlock = `# Next.js app env vars (Railway Variables for main app)
WHATSAPP_SERVICE_URL=https://YOUR_WHATSAPP_SERVICE_DOMAIN
INTERNAL_SECRET=SET_THE_SAME_VALUE_IN_BOTH_SERVICES`;

  async function checkWaService() {
    setWaServiceStatus("checking");
    setWaServiceMsg("");
    try {
      const res = await fetch("/api/admin/whatsapp/conversations?limit=1");
      if (res.ok) {
        setWaServiceStatus("ok");
        setWaServiceMsg("Service is reachable and responding.");
      } else if (res.status === 503) {
        setWaServiceStatus("error");
        setWaServiceMsg("WHATSAPP_SERVICE_URL or INTERNAL_SECRET is not set in env.");
      } else if (res.status === 502) {
        setWaServiceStatus("error");
        setWaServiceMsg("Service is configured but not reachable — is it running?");
      } else {
        setWaServiceStatus("error");
        setWaServiceMsg(`Unexpected response: HTTP ${res.status}`);
      }
    } catch {
      setWaServiceStatus("error");
      setWaServiceMsg("Network error — could not reach the proxy.");
    }
  }

  async function sendWaTest() {
    if (!waTestPhone.trim() || !waTestMsg.trim()) return;
    setWaSending(true);
    setWaSendResult(null);
    try {
      const res = await fetch("/api/admin/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: waTestPhone.replace(/\D/g, ""), message: waTestMsg }),
      });
      const d = await res.json();
      if (res.ok) {
        setWaSendResult({ ok: true, text: "Message sent successfully!" });
      } else {
        setWaSendResult({ ok: false, text: d.error ?? "Send failed" });
      }
    } catch (err: any) {
      setWaSendResult({ ok: false, text: err.message });
    } finally {
      setWaSending(false);
    }
  }

  // ── END WhatsApp state ──────────────────────────────────────────────────────

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

      {/* SECTION 8 — WhatsApp Business API */}
      <SectionCard
        title="WhatsApp Business API"
        description="Standalone Express service that powers the WhatsApp inbox, webhook receiver, auto-reply bot, and ecommerce notifications."
      >
        {/* ── Status bar ── */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4 text-[#25d366]" />
            <span className="font-medium">Service status</span>
            {waServiceStatus === "ok" && (
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <CircleCheck className="h-4 w-4" /> Connected
              </span>
            )}
            {waServiceStatus === "error" && (
              <span className="flex items-center gap-1 text-red-600 font-medium">
                <CircleAlert className="h-4 w-4" /> Error
              </span>
            )}
            {waServiceStatus === "idle" && (
              <span className="text-muted-foreground">Not checked</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={checkWaService}
              disabled={waServiceStatus === "checking"}
            >
              {waServiceStatus === "checking" ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              )}
              Test Connection
            </Button>
            <Button size="sm" variant="default" asChild>
              <Link href="/admin/whatsapp">
                <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                Open Inbox
              </Link>
            </Button>
          </div>
        </div>
        {waServiceMsg && (
          <p className={cn("text-sm", waServiceStatus === "ok" ? "text-green-600" : "text-red-600")}>
            {waServiceStatus === "ok" ? "✓ " : "✗ "}{waServiceMsg}
          </p>
        )}

        {/* ── Setup steps ── */}
        <div className="rounded-lg border border-border divide-y divide-border">

          {/* Step 1 */}
          <WaStep
            num={1}
            icon={<Key className="h-4 w-4" />}
            title="Create a Meta Developer App"
            expanded={waExpandedStep === 1}
            onToggle={() => setWaExpandedStep(waExpandedStep === 1 ? null : 1)}
          >
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                Go to{" "}
                <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 inline-flex items-center gap-0.5">
                  developers.facebook.com <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Click <strong className="text-foreground">Create App</strong> → choose <strong className="text-foreground">Business</strong></li>
              <li>Under <strong className="text-foreground">Add Products</strong> find <strong className="text-foreground">WhatsApp</strong> and click <strong className="text-foreground">Set Up</strong></li>
              <li>Link your <strong className="text-foreground">Meta Business Account</strong> (create one if needed)</li>
            </ol>
            <a
              href="https://developers.facebook.com/apps/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Open Meta Apps Dashboard <ExternalLink className="h-3 w-3" />
            </a>
          </WaStep>

          {/* Step 2 */}
          <WaStep
            num={2}
            icon={<Key className="h-4 w-4" />}
            title="Get your API credentials"
            expanded={waExpandedStep === 2}
            onToggle={() => setWaExpandedStep(waExpandedStep === 2 ? null : 2)}
          >
            <p className="text-sm text-muted-foreground mb-3">
              From your app's <strong className="text-foreground">WhatsApp → API Setup</strong> page, copy the following into your WhatsApp service <code className="font-mono bg-muted px-1 rounded">.env</code>:
            </p>
            <div className="grid gap-2">
              {[
                { env: "WHATSAPP_PHONE_NUMBER_ID", desc: "WhatsApp → API Setup → Phone Number ID" },
                { env: "WHATSAPP_BUSINESS_ACCOUNT_ID", desc: "WhatsApp → API Setup → WhatsApp Business Account ID" },
                { env: "WHATSAPP_ACCESS_TOKEN", desc: "System Users → Generate Token (never expires with a System User)" },
                { env: "WHATSAPP_APP_SECRET", desc: "App Settings → Basic → App Secret (for webhook signature verification)" },
              ].map(({ env, desc }) => (
                <div key={env} className="flex items-start gap-3 rounded-md bg-muted/50 px-3 py-2">
                  <code className="text-xs font-mono text-foreground shrink-0 mt-0.5">{env}</code>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                  <button
                    className="ml-auto shrink-0"
                    onClick={() => handleCopy(env, `wa-env-${env}`)}
                    title="Copy env var name"
                  >
                    {copiedField === `wa-env-${env}` ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    )}
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              💡 Use a <strong>System User token</strong> from Meta Business Suite — it doesn't expire like a personal user token.
            </p>
          </WaStep>

          {/* Step 3 — Webhooks */}
          <WaStep
            num={3}
            icon={<Webhook className="h-4 w-4" />}
            title="Configure webhooks to receive messages"
            expanded={waExpandedStep === 3}
            onToggle={() => setWaExpandedStep(waExpandedStep === 3 ? null : 3)}
          >
            <p className="text-sm text-muted-foreground mb-3">
              Meta sends all incoming messages and status updates to your webhook URL. You need a <strong className="text-foreground">publicly reachable HTTPS URL</strong>.
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              Create a custom webhook URL or use services that help you set up an endpoint.
            </p>

            {/* Webhook URL */}
            <div className="grid gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Callback URL (paste this into Meta)
              </Label>
              {waWebhookUrl ? (
                <div className="flex gap-2">
                  <Input readOnly className="bg-muted font-mono text-sm" value={waWebhookUrl} />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(waWebhookUrl, "wa-webhook")}
                  >
                    {copiedField === "wa-webhook" ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  <strong>WHATSAPP_SERVICE_URL</strong> is not set in the Next.js env vars.
                  Add it to Railway so this URL can be displayed.
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                This is your WhatsApp Express service URL + <code className="font-mono">/webhook</code>.
                For local development, use{" "}
                <a href="https://ngrok.com" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">ngrok</a>{" "}
                to create a public tunnel: <code className="font-mono">npx ngrok http 3001</code>
              </p>
            </div>

            {/* Verify Token */}
            <div className="grid gap-2 mt-3">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Verify Token
              </Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  className="bg-muted font-mono text-sm"
                  value="(value of WHATSAPP_VERIFY_TOKEN in your whatsapp/.env)"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy("WHATSAPP_VERIFY_TOKEN", "wa-verify")}
                  title="Copy env var name"
                >
                  {copiedField === "wa-verify" ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Set this to any string you choose (e.g. <code className="font-mono">printhub_verify_2024</code>).
                It must match exactly in both your <code className="font-mono">.env</code> and the Meta webhook config.
              </p>
            </div>

            {/* Meta config steps */}
            <div className="mt-3 rounded-md border border-border bg-muted/30 px-4 py-3">
              <p className="text-xs font-semibold text-foreground mb-2">In Meta Developer Console:</p>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-muted-foreground">
                <li>Go to your app → <strong className="text-foreground">WhatsApp → Configuration</strong></li>
                <li>Under <strong className="text-foreground">Webhook</strong>, click <strong className="text-foreground">Edit</strong></li>
                <li>Paste your <strong className="text-foreground">Callback URL</strong> and <strong className="text-foreground">Verify Token</strong></li>
                <li>Click <strong className="text-foreground">Verify and Save</strong> — watch the terminal for <code className="font-mono">✅ Webhook verified</code></li>
                <li>Under <strong className="text-foreground">Webhook Fields</strong>, enable <strong className="text-foreground">messages ✓</strong></li>
              </ol>
            </div>

            <div className="mt-3 rounded-md border border-border bg-muted/30 px-4 py-3">
              <p className="text-xs font-semibold text-foreground mb-2">Useful additions (recommended):</p>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground">
                <li>Subscribe to both <strong className="text-foreground">messages</strong> and <strong className="text-foreground">message_status</strong> fields for delivery/read tracking.</li>
                <li>After saving, send a test WhatsApp message and confirm logs show inbound webhook events.</li>
                <li>Keep your endpoint stable in production (Railway domain) and use ngrok only for local testing.</li>
                <li>Keep <code className="font-mono">WHATSAPP_APP_SECRET</code> and <code className="font-mono">INTERNAL_SECRET</code> private and rotate them periodically.</li>
              </ul>
            </div>

            <div className="mt-3 flex gap-2 flex-wrap">
              <a
                href="https://developers.facebook.com/apps/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Meta webhook config <ExternalLink className="h-3 w-3" />
              </a>
              <span className="text-muted-foreground">·</span>
              <a
                href="https://ngrok.com/download"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Download ngrok <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </WaStep>

          {/* Step 4 — Deploy */}
          <WaStep
            num={4}
            icon={<Server className="h-4 w-4" />}
            title="Deploy the WhatsApp service"
            expanded={waExpandedStep === 4}
            onToggle={() => setWaExpandedStep(waExpandedStep === 4 ? null : 4)}
          >
            <p className="text-sm text-muted-foreground mb-3">
              The service lives in the <code className="font-mono bg-muted px-1 rounded">whatsapp/</code> directory. Deploy it as a separate service from your Next.js app.
            </p>
            <div className="grid gap-3">
              <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5" /> Railway (recommended)
                </p>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-5">{`cd whatsapp
npm install -g @railway/cli
railway login
railway init
railway up
railway domain   # → your public URL`}</pre>
              </div>
              <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5" /> Local development
                </p>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-5">{`cd whatsapp
cp .env.example .env
# Edit .env with your credentials
npm run dev          # starts on :3001
npx ngrok http 3001  # exposes publicly`}</pre>
              </div>
            </div>
            <p className="mt-2 text-xs text-amber-600">
              ⚠️ Render free tier sleeps after 15 min — use Railway or a paid plan for production.
            </p>
          </WaStep>

          {/* Step 5 — Env vars */}
          <WaStep
            num={5}
            icon={<ShieldCheck className="h-4 w-4" />}
            title="Set environment variables in Railway"
            expanded={waExpandedStep === 5}
            onToggle={() => setWaExpandedStep(waExpandedStep === 5 ? null : 5)}
          >
            <p className="text-sm text-muted-foreground mb-3">
              Two sets of env vars are needed — one for the WhatsApp service, one for this Next.js app.
            </p>

            <div className="grid gap-4">
              {/* WhatsApp service vars */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">
                  WhatsApp service (<code className="font-mono">whatsapp/.env</code>)
                </p>
                <div className="grid gap-1.5">
                  {[
                    ["WHATSAPP_PHONE_NUMBER_ID",      "From Meta API Setup"],
                    ["WHATSAPP_BUSINESS_ACCOUNT_ID",  "From Meta API Setup"],
                    ["WHATSAPP_ACCESS_TOKEN",          "System User token from Meta"],
                    ["WHATSAPP_APP_SECRET",            "App Settings → Basic → App Secret"],
                    ["WHATSAPP_VERIFY_TOKEN",          "Any string (must match Meta webhook config)"],
                    ["MONGODB_URI",                    "Atlas connection string"],
                    ["INTERNAL_SECRET",                "Shared secret with the Next.js app"],
                    ["JWT_SECRET",                     "Random 48-byte hex string"],
                    ["BASE_URL",                       "Your public WhatsApp service URL"],
                  ].map(([key, desc]) => (
                    <div key={key} className="flex items-center gap-2 rounded bg-muted/50 px-2.5 py-1.5">
                      <code className="text-xs font-mono text-foreground shrink-0">{key}</code>
                      <span className="text-xs text-muted-foreground truncate">{desc}</span>
                      <button className="ml-auto shrink-0" onClick={() => handleCopy(key, `wa-var-${key}`)}>
                        {copiedField === `wa-var-${key}` ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next.js vars */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">
                  This Next.js app (add to Railway / <code className="font-mono">.env.local</code>)
                </p>
                <div className="grid gap-1.5">
                  {[
                    ["WHATSAPP_SERVICE_URL", "Public URL of the WhatsApp Express service"],
                    ["INTERNAL_SECRET",      "Same value as in the WhatsApp service"],
                  ].map(([key, desc]) => (
                    <div key={key} className="flex items-center gap-2 rounded bg-muted/50 px-2.5 py-1.5">
                      <code className="text-xs font-mono text-foreground shrink-0">{key}</code>
                      <span className="text-xs text-muted-foreground">{desc}</span>
                      <button className="ml-auto shrink-0" onClick={() => handleCopy(key, `wa-next-${key}`)}>
                        {copiedField === `wa-next-${key}` ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4">
              <div className="rounded-md border border-border bg-muted/30 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground">
                    Copy-ready block — WhatsApp service
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(waServiceEnvBlock, "wa-service-env-block")}
                  >
                    {copiedField === "wa-service-env-block" ? (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        Copy block
                      </>
                    )}
                  </Button>
                </div>
                <pre className="max-h-56 overflow-auto rounded bg-background p-3 text-xs leading-5 text-muted-foreground">
{waServiceEnvBlock}
                </pre>
              </div>

              <div className="rounded-md border border-border bg-muted/30 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground">
                    Copy-ready block — Next.js app
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(nextAppEnvBlock, "wa-next-env-block")}
                  >
                    {copiedField === "wa-next-env-block" ? (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        Copy block
                      </>
                    )}
                  </Button>
                </div>
                <pre className="max-h-40 overflow-auto rounded bg-background p-3 text-xs leading-5 text-muted-foreground">
{nextAppEnvBlock}
                </pre>
              </div>
            </div>
          </WaStep>

          {/* Step 6 — Test send */}
          <WaStep
            num={6}
            icon={<Send className="h-4 w-4" />}
            title="Send a test message"
            expanded={waExpandedStep === 6}
            onToggle={() => setWaExpandedStep(waExpandedStep === 6 ? null : 6)}
          >
            <p className="text-sm text-muted-foreground mb-3">
              Send a test WhatsApp message to verify the full pipeline is working.
              The recipient must have messaged your number first (or use an approved template).
            </p>
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label className="text-xs">Recipient phone (with country code, no +)</Label>
                <Input
                  placeholder="254712345678"
                  value={waTestPhone}
                  onChange={(e) => setWaTestPhone(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Message</Label>
                <Input
                  value={waTestMsg}
                  onChange={(e) => setWaTestMsg(e.target.value)}
                />
              </div>
              <Button
                className="w-fit"
                onClick={sendWaTest}
                disabled={waSending || !waTestPhone.trim() || !waTestMsg.trim()}
              >
                {waSending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send Test Message
              </Button>
              {waSendResult && (
                <p className={cn("text-sm", waSendResult.ok ? "text-green-600" : "text-red-600")}>
                  {waSendResult.ok ? "✓ " : "✗ "}{waSendResult.text}
                </p>
              )}
            </div>
          </WaStep>
        </div>

        {/* ── Quick links ── */}
        <div className="flex flex-wrap gap-3 pt-1">
          <a
            href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            <ExternalLink className="h-3 w-3" /> WhatsApp Cloud API docs
          </a>
          <a
            href="https://business.facebook.com/wa/manage/message-templates/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            <ExternalLink className="h-3 w-3" /> Manage message templates
          </a>
          <a
            href="https://developers.facebook.com/tools/explorer/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            <ExternalLink className="h-3 w-3" /> Graph API Explorer
          </a>
        </div>
      </SectionCard>
    </div>
  );
}

// ── WaStep: collapsible step row used inside the WhatsApp section ─────────────

function WaStep({
  num,
  icon,
  title,
  expanded,
  onToggle,
  children,
}: {
  num: number;
  icon: React.ReactNode;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
        onClick={onToggle}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
          {num}
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">{icon}</span>
        <span className="flex-1 text-sm font-medium text-foreground">{title}</span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {expanded && (
        <div className="border-t border-border bg-muted/20 px-4 py-4">
          {children}
        </div>
      )}
    </div>
  );
}
