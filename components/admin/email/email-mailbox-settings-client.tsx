"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Plus } from "lucide-react";
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

export function EmailMailboxSettingsClient({
  mailboxes,
  staff,
  viewersByMailboxId,
}: {
  mailboxes: EmailMailbox[];
  staff: StaffUser[];
  viewersByMailboxId: Record<string, string[]>;
}) {
  const router = useRouter();

  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const normalizedAddress = useMemo(() => address.trim().toLowerCase(), [address]);

  async function handleCreate() {
    setError(null);
    setSuccess(null);

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

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Failed to create mailbox.");
        return;
      }

      setSuccess("Mailbox created.");
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email mailboxes
          </h1>
          <p className="text-muted-foreground text-sm">
            Configure the <span className="font-mono">@printhub.africa</span> addresses that Cloudflare forwards to Resend.
          </p>
        </div>
        <Badge variant="secondary">Protected</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">New mailbox</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="orders@printhub.africa"
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
                placeholder="Orders"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleCreate} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create mailbox
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Existing mailboxes</h2>

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
                  <Switch checked={m.isActive} disabled aria-label={`Mailbox ${m.label} active`} />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Badge variant={m.isActive ? "default" : "secondary"}>{m.isActive ? "Active" : "Inactive"}</Badge>
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(m.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Viewers: <span className="font-medium text-foreground">{(viewersByMailboxId[m.id] ?? []).length}</span>
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Manage access
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Access for {m.label}</DialogTitle>
                        <DialogDescription>
                          Toggle which staff can view this business mailbox. Even if a staff member is not granted mailbox access,
                          they will still be able to see threads assigned to them.
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
                                  <p className="text-sm font-medium truncate">
                                    {s.name ?? s.email}
                                  </p>
                                  <p className="text-xs text-muted-foreground font-mono truncate">{s.email}</p>
                                </div>
                                <Switch
                                  checked={allowed}
                                  disabled={togglingKey === toggleKey}
                                  onCheckedChange={(next) => void handleToggleAccess(m.id, s.id, next)}
                                  aria-label={`Toggle access ${s.email} -> ${m.label}`}
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
          <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
            No mailboxes yet.
          </div>
        )}
      </div>
    </div>
  );
}

