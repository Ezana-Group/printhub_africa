"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Trash2 } from "lucide-react";

export function PrivacyDataClient() {
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await fetch("/api/account/data/export", { method: "POST" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "printhub-data-export.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setDeleteError("Could not download data. Try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== "DELETE MY ACCOUNT") {
      setDeleteError('Type "DELETE MY ACCOUNT" to confirm.');
      return;
    }
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/account/data/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: deleteConfirm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(data.error ?? "Request failed");
        return;
      }
      window.location.href = "/";
    } catch {
      setDeleteError("Request failed. Try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download my data
          </CardTitle>
          <CardDescription>
            Export your profile, orders, addresses, refunds and support tickets as a JSON file (KDPA data portability).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} disabled={exportLoading}>
            {exportLoading ? "Preparing…" : "Download"}
          </Button>
        </CardContent>
      </Card>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete my account
          </CardTitle>
          <CardDescription>
            Anonymise your account and sign out. Order history is retained for legal and accounting purposes but no longer linked to you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="delete-confirm">Type DELETE MY ACCOUNT to confirm</Label>
            <Input
              id="delete-confirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
              className="mt-1 font-mono"
            />
          </div>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading || deleteConfirm !== "DELETE MY ACCOUNT"}>
            {deleteLoading ? "Processing…" : "Delete my account"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
