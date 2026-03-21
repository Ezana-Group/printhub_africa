"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertTriangle 
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
    description: "Restores all pricing rates to system defaults. All custom rates will be lost.",
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
    description: "Resets the quote number sequence. Only when starting fresh.",
    confirmLabel: "Reset Counter",
    confirmPhrase: "RESET COUNTER",
    apiPath: "reset-quote-counter",
  },
  {
    id: "anonymise",
    title: "Anonymise Customer Data",
    description: "GDPR/PDPA compliance. Anonymises personal data for deletion requests. Orders retained.",
    confirmLabel: "Anonymise Data",
    confirmPhrase: "ANONYMISE CUSTOMER",
    apiPath: "anonymise",
    needsUserId: true,
  },
  {
    id: "export",
    title: "Export All Data",
    description: "Full database export — orders, customers, products, settings. ZIP download. Handle with care.",
    confirmLabel: "Export All Data",
    confirmPhrase: "EXPORT DATA",
    apiPath: "export-all-data",
  },
  {
    id: "factory",
    title: "Factory Reset",
    description: "NUCLEAR OPTION. Wipes ALL data except SUPER_ADMIN account. No undo. Requires: type DELETE EVERYTHING + password + 2FA + 24hr delay.",
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      toast.success(`${action.title} completed successfully`);
      setOpenId(null);
    } catch {
      setError("Something went wrong");
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <BackupSystem />
      <RestoreSystem />

      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-destructive">
          <ShieldAlert className="w-5 h-5" />
          Critical Actions
        </h2>
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
                          className="font-mono"
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
                    {action?.requireTwoFa && (
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
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
              <CardTitle>Backup System</CardTitle>
              <CardDescription>Create full system backups (DB, Env, Files manifest)</CardDescription>
            </div>
          </div>
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
            Create Backup Now
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Date & Time</th>
                <th className="px-4 py-2 text-left font-medium">Created By</th>
                <th className="px-4 py-2 text-left font-medium">Size</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {backups.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic">
                    No backups found
                  </td>
                </tr>
              )}
              {backups.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-2">{format(new Date(b.createdAt), "MMM d, yyyy HH:mm")}</td>
                  <td className="px-4 py-2">{b.createdBy?.name || b.createdBy?.email || "Unknown"}</td>
                  <td className="px-4 py-2">{b.sizeBytes ? `${(Number(b.sizeBytes) / 1024 / 1024).toFixed(2)} MB` : "-"}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      b.status === "COMPLETE" ? "bg-green-100 text-green-700" :
                      b.status === "FAILED" ? "bg-red-100 text-red-700" :
                      "bg-blue-100 text-blue-700 animate-pulse"
                    }`}>
                      {b.status}
                    </span>
                    {b.errorMsg && <p className="text-[10px] text-red-500 mt-1 line-clamp-1">{b.errorMsg}</p>}
                  </td>
                  <td className="px-4 py-2 text-right space-x-2">
                    {b.status === "COMPLETE" && (
                      <Button size="icon" variant="ghost" asChild title="Download">
                        <a href={`/api/admin/settings/backup/${b.id}/download`} target="_blank">
                          <Download className="w-4 h-4 text-blue-600" />
                        </a>
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(b.id)} title="Delete">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
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

function RestoreSystem() {
  const [file, setFile] = useState<File | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [progress, setProgress] = useState<{ step: string; status: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");

  const handleRestore = async () => {
    if (!file) return;
    if (confirmPhrase !== "RESTORE EVERYTHING") return;
    
    setRestoring(true);
    setProgress([{ step: "Initialising restore...", status: "in_progress" }]);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("confirmPhrase", confirmPhrase);
      formData.append("password", password);
      formData.append("totpCode", totp);

      const response = await fetch("/api/admin/settings/backup/restore", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const d = await response.json().catch(() => ({}));
        throw new Error(d.error || "Restore failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            if (data.error) throw new Error(data.error);
            setProgress(prev => {
              const last = prev[prev.length - 1];
              if (last && last.step === data.step) {
                return [...prev.slice(0, -1), { step: data.step, status: data.status }];
              }
              return [...prev, { step: data.step, status: data.status }];
            });
          }
        }
      }
      toast.success("System restored successfully. Refreshing...");
      setTimeout(() => window.location.reload(), 2000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(e.message || "Restore failed");
      setProgress(prev => [...prev, { step: "Restoration failed", status: "failed" }]);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Card className="border-destructive/30 border-dashed">
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-destructive" />
          <div>
            <CardTitle>Restore from Backup</CardTitle>
            <CardDescription>Restore the entire database from a previously created .zip file</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="backup-file" className="sr-only">Choose Backup File</Label>
            <div className="relative group">
              <Input
                id="backup-file"
                type="file"
                accept=".zip"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="cursor-pointer file:cursor-pointer"
              />
              <FileUp className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
          <Button
            variant="outline"
            disabled={!file || restoring}
            onClick={() => setOpen(true)}
            className="border-destructive text-destructive hover:bg-destructive hover:text-white"
          >
            Upload & Restore
          </Button>
        </div>

        {progress.length > 0 && (
          <div className="mt-6 space-y-2 p-4 bg-muted rounded-lg border">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Restoration Progress</h4>
            {progress.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  {p.status === "in_progress" ? <Loader2 className="w-3 h-3 animate-spin text-primary" /> : <RefreshCcw className="w-3 h-3 text-green-500" />}
                  {p.step}
                </span>
                <span className={`text-[10px] uppercase font-bold ${p.status === "done" ? "text-green-600" : "text-blue-600"}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}

        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent className="max-w-md border-destructive">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive flex items-center gap-2">
                <ShieldAlert className="w-6 h-6" />
                SYSTEM RESTORE
              </AlertDialogTitle>
              <AlertDialogDescription className="bg-destructive/10 p-3 rounded border border-destructive/20 text-destructive font-bold text-xs">
                CAUTION: This will overwrite EVERYTHING. Current orders, customers, and settings will be replaced by the data in the backup file.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2 text-sm font-medium">
                <Label>Backup file: <span className="text-primary font-mono">{file?.name}</span></Label>
              </div>
              <div className="grid gap-1">
                <Label className="text-xs uppercase text-muted-foreground">Type &quot;RESTORE EVERYTHING&quot; to confirm</Label>
                <Input
                  value={confirmPhrase}
                  onChange={(e) => setConfirmPhrase(e.target.value)}
                  placeholder="RESTORE EVERYTHING"
                  className="font-mono"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs uppercase text-muted-foreground">Admin Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs uppercase text-muted-foreground">2FA Code</Label>
                <Input
                  value={totp}
                  onChange={(e) => setTotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setOpen(false)}>Wait, Cancel</AlertDialogCancel>
              <Button
                className="bg-destructive text-white hover:bg-destructive/90"
                disabled={confirmPhrase !== "RESTORE EVERYTHING" || !password || totp.length !== 6 || restoring}
                onClick={() => {
                  setOpen(false);
                  handleRestore();
                }}
              >
                Perform System Restore
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-6">
      <h2 className="font-display text-base font-bold">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
      <Button type="button" variant="destructive" className="mt-4" onClick={onConfirm} disabled={disabled}>
        {confirmLabel}
      </Button>
    </div>
  );
}
