"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Plus, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type EmailMailbox = {
  id: string;
  address: string;
  label: string;
  isActive: boolean;
  createdAt: string;
};

type StaffUser = {
  id: string;
  name: string | null;
  email: string;
};

type SetupStatus = {
  resendApiKey: boolean;
  resendWebhookSecret: boolean;
  cloudflareConfigured: boolean;
  fromEmail: string | null;
  fromName: string | null;
  replyTo: string | null;
  adminAlertEmail: string | null;
};

function StatusRow({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight">{label}</p>
        {detail && <p className="text-xs text-muted-foreground font-mono mt-0.5 break-all">{detail}</p>}
      </div>
    </div>
  );
}

export function EmailMailboxSettingsClient({
  mailboxes,
  staff,
  viewersByMailboxId,
  setupStatus,
}: {
  mailboxes: EmailMailbox[];
  staff: StaffUser[];
  viewersByMailboxId: Record<string, string[]>;
  setupStatus: SetupStatus;
}) {
  const router = useRouter();

  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const normalizedAddress = useMemo(() => address.trim().toLowerCase(), [address]);

  async function handleCreate() {
    setError(null);
    setSuccess(null);
    setWarning(null);

    const addr = normalizedAddress;
    const lab = label.trim();

    if (!addr || !lab) {
      setError("Address and label are required.");
      return;
    }
    if (!addr.endsWith("@printhub.africa")) {
      setError("Mailbox address must end with @printhub.africa");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/email/mailboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr, label: lab }),
      });

      const d = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(d.error ?? "Failed to create mailbox.");
        return;
      }

      setSuccess("Mailbox created successfully.");
      if (d.warning) setWarning(d.warning);
      setAddress("");
      setLabel("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleAccess(mailboxId: string, userId: string, allowed: boolean) {
    const key = `${mailboxId}:${userId}`;
    setTogglingKey(key);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/email/mailboxes/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mailboxId, userId, allowed }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Failed to update access");
        return;
      }

      router.refresh();
    } finally {
      setTogglingKey(null);
    }
  }

  const inboundFullyReady =
    setupStatus.resendApiKey &&
    setupStatus.resendWebhookSecret &&
    setupStatus.cloudflareConfigured;

  return (
    <div className="p-6 space-y-8">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email settings
          </h1>
          <p className="text-muted-foreground text-sm">
            System email addresses, mailboxes, and inbound email configuration.
          </p>
        </div>
      </div>

      {/* ── System emails (read-only) ──────────────────────────── */}
      <section className="space-y-3">
        <h2 className="font-semibold text-base">System email addresses</h2>
        <p className="text-sm text-muted-foreground">
          These are configured in Admin → Finance → Business Settings or via environment variables.
          They are used for outbound transactional email.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardContent className="pt-4 pb-4 space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">From address</p>
              {setupStatus.fromEmail ? (
                <>
                  <p className="text-sm font-mono font-medium">{setupStatus.fromEmail}</p>
                  {setupStatus.fromName && (
                    <p className="text-xs text-muted-foreground">Display name: {setupStatus.fromName}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-amber-600">Not configured — set in Business Settings</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4 space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Admin alert email</p>
              {setupStatus.adminAlertEmail ? (
                <p className="text-sm font-mono font-medium">{setupStatus.adminAlertEmail}</p>
              ) : (
                <p className="text-sm text-amber-600">Not configured — set in Business Settings</p>
              )}
            </CardContent>
          </Card>

          {setupStatus.replyTo && (
            <Card>
              <CardContent className="pt-4 pb-4 space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Reply-to</p>
                <p className="text-sm font-mono font-medium">{setupStatus.replyTo}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* ── Inbound setup status ───────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-base">Inbound email setup</h2>
          {inboundFullyReady ? (
            <Badge variant="default" className="bg-green-500">Ready</Badge>
          ) : (
            <Badge variant="secondary" className="text-amber-600 border-amber-300 bg-amber-50">Incomplete</Badge>
          )}
        </div>

        <Card>
          <CardContent className="pt-4 pb-2 divide-y divide-border">
            <StatusRow
              ok={setupStatus.resendApiKey}
              label="Resend API key"
              detail={setupStatus.resendApiKey ? "Configured" : "Missing — set RESEND_API_KEY or configure in Business Settings"}
            />
            <StatusRow
              ok={setupStatus.resendWebhookSecret}
              label="Resend inbound webhook secret"
              detail={
                setupStatus.resendWebhookSecret
                  ? "Configured"
                  : "Missing RESEND_WEBHOOK_SECRET — create a webhook in Resend → Webhooks pointing to https://printhub.africa/api/email/inbound"
              }
            />
            <StatusRow
              ok={setupStatus.cloudflareConfigured}
              label="Cloudflare Email Routing"
              detail={
                setupStatus.cloudflareConfigured
                  ? "Configured — new mailboxes will auto-register forwarding rules"
                  : "Missing CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID, or RESEND_INBOUND_ADDRESS — mailboxes can still be saved but will not receive email until this is set up"
              }
            />
          </CardContent>
        </Card>

        {!inboundFullyReady && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">Steps to enable inbound email</p>
                <ol className="list-decimal list-inside space-y-1 text-amber-700">
                  <li>In Resend, enable inbound email for your domain (printhub.africa)</li>
                  <li>Create a webhook in Resend → Webhooks → New Webhook pointing to <span className="font-mono">https://printhub.africa/api/email/inbound</span>, event type: <span className="font-mono">email.received</span></li>
                  <li>Copy the webhook signing secret → set <span className="font-mono">RESEND_WEBHOOK_SECRET</span> in your environment</li>
                  <li>Copy the Resend inbound forwarding address (looks like <span className="font-mono">xxx@inbound.resend.dev</span>) → set <span className="font-mono">RESEND_INBOUND_ADDRESS</span></li>
                  <li>Set <span className="font-mono">CLOUDFLARE_API_TOKEN</span> and <span className="font-mono">CLOUDFLARE_ZONE_ID</span> to auto-register mailbox forwarding rules</li>
                  <li>Redeploy after setting env vars</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Add new mailbox ────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="font-semibold text-base">Add mailbox</h2>
        <Card>
          <CardContent className="pt-4 space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}
            {warning && (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-700">{warning}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="support@printhub.africa"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Must end with <span className="font-mono">@printhub.africa</span>.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  placeholder="Customer Support"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Create mailbox
            </Button>

            {!setupStatus.cloudflareConfigured && (
              <p className="text-xs text-muted-foreground">
                Cloudflare not configured — mailbox will be saved but inbound email routing won't be set up automatically.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Existing mailboxes ─────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="font-semibold text-base">
          Managed mailboxes{" "}
          <span className="text-muted-foreground font-normal text-sm">({mailboxes.length})</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {mailboxes.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="font-medium truncate" title={m.address}>
                      {m.label}
                    </p>
                    <p className="text-sm text-muted-foreground font-mono break-all">{m.address}</p>
                  </div>
                  <Badge variant={m.isActive ? "default" : "secondary"}>
                    {m.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Viewers: <span className="font-medium text-foreground">{(viewersByMailboxId[m.id] ?? []).length}</span>
                    {" · "}
                    Added {new Date(m.createdAt).toLocaleDateString("en-GB")}
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">Manage access</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Access for {m.label}</DialogTitle>
                        <DialogDescription>
                          Toggle which staff can view this mailbox in the inbox. Staff can always
                          see threads assigned to them regardless of this setting.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="mt-2 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                        {staff.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No staff users found.</p>
                        ) : (
                          staff.map((s) => {
                            const allowed = (viewersByMailboxId[m.id] ?? []).includes(s.id);
                            const toggleKey = `${m.id}:${s.id}`;
                            return (
                              <div key={s.id} className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{s.name ?? s.email}</p>
                                  <p className="text-xs text-muted-foreground font-mono truncate">{s.email}</p>
                                </div>
                                <Switch
                                  checked={allowed}
                                  disabled={togglingKey === toggleKey}
                                  onCheckedChange={(next) => void handleToggleAccess(m.id, s.id, next)}
                                  aria-label={`Toggle access ${s.email} → ${m.label}`}
                                />
                              </div>
                            );
                          })
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {mailboxes.length === 0 && (
          <div className="rounded-xl border border-dashed p-8 text-center space-y-2">
            <Mail className="h-8 w-8 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">No mailboxes yet.</p>
            <p className="text-muted-foreground text-xs">
              Add a mailbox above to start receiving emails at <span className="font-mono">@printhub.africa</span> addresses.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
