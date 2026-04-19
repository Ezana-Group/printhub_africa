"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  Loader2, 
  Download, 
  Trash2, 
  ShieldAlert, 
  Database, 
  History, 
  RefreshCcw, 
  FileUp, 
  AlertTriangle,
  Bug,
  CalendarClock
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

const BASE = "/api/admin/settings/danger";

type DangerAction = {
  id: string;
  title: string;
  description: string;
  confirmLabel: string;
  confirmPhrase: string;
  apiPath?: string;
  requireTwoFa?: boolean;
  needsUserId?: boolean;
};

const ACTIONS: DangerAction[] = [
  {
    id: "reset-pricing",
    title: "Reset All Pricing to Defaults",
    description: "Restores all pricing rates in BusinessSettings to system defaults.",
    confirmLabel: "Reset Pricing",
    confirmPhrase: "RESET PRICING",
    apiPath: "reset-pricing",
  },
  {
    id: "clear-drafts",
    title: "Clear All Draft Quotes",
    description: "Permanently deletes all quotes in DRAFT status.",
    confirmLabel: "Clear Draft Quotes",
    confirmPhrase: "CLEAR DRAFTS",
    apiPath: "clear-draft-quotes",
  },
  {
    id: "reset-counter",
    title: "Reset Quote Counter",
    description: "Resets the quote number sequence in settings.",
    confirmLabel: "Reset Counter",
    confirmPhrase: "RESET COUNTER",
    apiPath: "reset-quote-counter",
  },
  {
    id: "export",
    title: "Export All Data (Full DB)",
    description: "Full database export including orders, customers, products, and settings. ZIP/JSON format.",
    confirmLabel: "Export All Data",
    confirmPhrase: "EXPORT DATA",
    apiPath: "export-all-data",
  },
  {
    id: "factory",
    title: "Factory Reset",
    description: "NUCLEAR OPTION. Wipes ALL data except SUPER_ADMIN account. No undo. 24hr delay required.",
    confirmLabel: "Factory Reset",
    confirmPhrase: "DELETE EVERYTHING",
    apiPath: "factory-reset/initiate",
    requireTwoFa: true,
  },
];

export function DangerZoneActions() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [phrase, setPhrase] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [devMode, setDevMode] = useState(false);
  const [pendingReset, setPendingReset] = useState<any>(null);

  useEffect(() => {
    // Initial fetch of common statuses
    fetch(`${BASE}/developer-mode`).then(r => r.json()).then(d => setDevMode(!!d.developerMode)).catch(() => {});
    fetch(`${BASE}/factory-reset/status`).then(r => r.json()).then(d => setPendingReset(d.pending)).catch(() => {});
  }, []);

  const action = openId ? ACTIONS.find((a) => a.id === openId) : null;
  const canSubmit =
    action?.apiPath &&
    password &&
    (action.confirmPhrase ? phrase === action.confirmPhrase : true) &&
    (!action.requireTwoFa || totpCode.length === 6) &&
    (!action.needsUserId || targetUserId.length > 0);

  const handleOpen = (id: string) => {
    setOpenId(id);
    setError(null);
    setPassword("");
    setPhrase("");
    setTotpCode("");
    setTargetUserId("");
  };

  const handleConfirm = async () => {
    if (!action?.apiPath || !canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      const body: any = {
        confirmPhrase: action.confirmPhrase,
        password,
      };
      if (action.requireTwoFa) body.totpCode = totpCode;
      if (action.needsUserId) body.userId = targetUserId;

      const res = await fetch(`${BASE}/${action.apiPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Confirmation failed");
        toast.error(data.error ?? "Action failed");
        return;
      }

      // Special handling for export
      if (action.id === "export" && data.payload) {
        const blob = new Blob([JSON.stringify(data.payload, null, 2)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename || "printhub-export.json";
        a.click();
        window.URL.revokeObjectURL(url);
      }

      // Refresh status if factory reset initiated
      if (action.id === "factory") {
        fetch(`${BASE}/factory-reset/status`).then(r => r.json()).then(d => setPendingReset(d.pending)).catch(() => {});
      }

      toast.success(`${action.title} completed successfully`);
      setOpenId(null);
    } catch {
      setError("Something went wrong");
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const toggleDevMode = async (enabled: boolean) => {
    toast.promise(
      fetch(`${BASE}/developer-mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled })
      }).then(r => {
        if (!r.ok) throw new Error();
        setDevMode(enabled);
        return r;
      }),
      {
        loading: "Updating developer mode...",
        success: `Developer mode ${enabled ? "enabled" : "disabled"}`,
        error: "Failed to update"
      }
    );
  }

  const cancelReset = async () => {
    if (!confirm("Are you sure you want to cancel the scheduled factory reset?")) return;
    toast.promise(
      fetch(`${BASE}/factory-reset/cancel`, { method: "POST" }).then(r => {
        if (!r.ok) throw new Error();
        setPendingReset(null);
        return r;
      }),
      {
        loading: "Cancelling reset...",
        success: "Factory reset cancelled",
        error: "Failed to cancel reset"
      }
    );
  }

  return (
    <div className="space-y-8">
      <BackupSystem />
      
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-destructive">
          <ShieldAlert className="w-5 h-5" />
          Critical Actions
        </h2>
        
        {pendingReset && (
          <div className="bg-destructive/10 border border-destructive p-4 rounded-lg flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CalendarClock className="w-6 h-6 text-destructive animate-pulse" />
              <div>
                <p className="font-bold text-destructive">FACTORY RESET SCHEDULED</p>
                <p className="text-xs text-muted-foreground mr-1">Scheduled for: {format(new Date(pendingReset.executeAt), "PPpp")}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={cancelReset} className="border-destructive text-destructive hover:bg-destructive hover:text-white transition-all">
              Cancel Scheduled Reset
            </Button>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug className="h-5 w-5 text-indigo-500" />
                <div>
                  <CardTitle>Developer & Debug Mode</CardTitle>
                  <CardDescription>Enable debug banners and detailed error logging across the admin panel.</CardDescription>
                </div>
              </div>
              <Switch checked={devMode} onCheckedChange={toggleDevMode} />
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4">
          {ACTIONS.map((a) => (
            <div key={a.id}>
              <SectionPlaceholder
                title={a.title}
                description={a.description}
                confirmLabel={a.confirmLabel}
                onConfirm={() => handleOpen(a.id)}
                disabled={!a.apiPath}
              />
              <AlertDialog open={openId === a.id} onOpenChange={(open) => !open && setOpenId(null)}>
                <AlertDialogContent className="border-destructive/50 max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-destructive flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      {a.title}
                    </AlertDialogTitle>
                    <AlertDialogDescription>{a.description}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="grid gap-4 py-2">
                    {a.needsUserId && (
                      <div className="grid gap-2">
                        <Label>Customer User ID</Label>
                        <Input
                          value={targetUserId}
                          onChange={(e) => setTargetUserId(e.target.value)}
                          placeholder="e.g. cl0123456789"
                        />
                      </div>
                    )}
                    {a.confirmPhrase && (
                      <div className="grid gap-2">
                        <Label>Type &quot;{a.confirmPhrase}&quot; to confirm</Label>
                        <Input
                          value={phrase}
                          onChange={(e) => setPhrase(e.target.value)}
                          placeholder={a.confirmPhrase}
                          className="font-mono uppercase"
                          autoComplete="off"
                        />
                      </div>
                    )}
                    <div className="grid gap-2">
                      <Label>Your Admin Password</Label>
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        autoComplete="current-password"
                      />
                    </div>
                    {a.requireTwoFa && (
                      <div className="grid gap-2">
                        <Label>2FA code (6 digits)</Label>
                        <Input
                          value={totpCode}
                          onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="000000"
                          inputMode="numeric"
                          maxLength={6}
                          autoComplete="one-time-code"
                        />
                      </div>
                    )}
                    {error && <p className="text-sm text-destructive font-bold p-2 bg-destructive/10 rounded">{error}</p>}
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button
                      onClick={handleConfirm}
                      disabled={loading || !canSubmit}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing…
                        </>
                      ) : (
                        a.confirmLabel
                      )}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BackupSystem() {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings/backup/list");
      if (res.ok) setBackups(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    toast.info("Starting backup process...");
    try {
      const res = await fetch("/api/admin/settings/backup/create", { method: "POST" });
      if (res.ok) {
        toast.success("Backup scheduled successfully");
        fetchBackups();
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to start backup");
      }
    } catch {
      toast.error("Failed to start backup");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this backup?")) return;
    toast.promise(
      fetch(`/api/admin/settings/backup/${id}`, { method: "DELETE" }).then(r => {
        if (!r.ok) throw new Error("Delete failed");
        fetchBackups();
        return r;
      }),
      {
        loading: "Deleting backup...",
        success: "Backup deleted",
        error: "Failed to delete backup",
      }
    );
  };

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-orange-500" />
            <div>
              <CardTitle>System Snapshot & Backups</CardTitle>
              <CardDescription>Create full database and configuration snapshots stored in private secure cloud (R2).</CardDescription>
            </div>
          </div>
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
          >
            {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
            Take Snapshot Now
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-[#E5E7EB] bg-white overflow-hidden shadow-inner">
          <table className="w-full text-sm">
            <thead className="bg-[#F9FAFB] text-muted-foreground border-b border-[#E5E7EB]">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Timestamp</th>
                <th className="px-4 py-2 text-left font-medium">Initiated By</th>
                <th className="px-4 py-2 text-left font-medium">Size</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {backups.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground italic">
                    No system snapshots found. Take a backup to protect your business data.
                  </td>
                </tr>
              )}
              {backups.map((b) => (
                <tr key={b.id} className="hover:bg-[#F9FAFB]/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-[#111827]">{format(new Date(b.createdAt), "MMM d, yyyy HH:mm")}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.createdBy?.name || b.createdBy?.email || "System"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{b.sizeBytes ? `${(Number(b.sizeBytes) / 1024 / 1024).toFixed(2)} MB` : "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                      b.status === "COMPLETE" ? "bg-[#D1FAE5] text-[#059669]" :
                      b.status === "FAILED" ? "bg-[#FEE2E2] text-[#DC2626]" :
                      "bg-[#DBEAFE] text-[#2563EB] animate-pulse"
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {b.status === "COMPLETE" && (
                        <Button size="icon" variant="ghost" asChild title="Download">
                          <a href={`/api/admin/settings/backup/${b.id}/download`} target="_blank">
                            <Download className="w-4 h-4 text-[#2563EB]" />
                          </a>
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(b.id)} title="Delete">
                        <Trash2 className="w-4 h-4 text-[#DC2626]" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionPlaceholder({
  title,
  description,
  confirmLabel,
  onConfirm,
  disabled,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm hover:border-destructive/30 transition-colors">
      <h2 className="font-display text-base font-bold text-[#111827]">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
      <Button type="button" variant="destructive" className="mt-4 shadow-sm" onClick={onConfirm} disabled={disabled}>
        {confirmLabel}
      </Button>
    </div>
  );
}
