"use client";

import { useState } from "react";
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

const BASE = "/api/admin/settings/danger";

type DangerAction = {
  id: string;
  title: string;
  description: string;
  confirmLabel: string;
  confirmPhrase: string;
  apiPath?: string;
  requireTwoFa?: boolean;
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
    description: "GDPR/PDPA compliance. Anonymises personal data for deletion requests. Orders retained. Use Customers to anonymise per customer.",
    confirmLabel: "Anonymise Data",
    confirmPhrase: "",
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

  const action = openId ? ACTIONS.find((a) => a.id === openId) : null;
  const canSubmit =
    action?.apiPath &&
    password &&
    (action.confirmPhrase ? phrase === action.confirmPhrase : true) &&
    (!action.requireTwoFa || totpCode.length === 6);

  const handleOpen = (id: string) => {
    setOpenId(id);
    setError(null);
    setPassword("");
    setPhrase("");
    setTotpCode("");
  };

  const handleConfirm = async () => {
    if (!action?.apiPath || !canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      const body: { confirmPhrase: string; password: string; totpCode?: string } = {
        confirmPhrase: action.confirmPhrase,
        password,
      };
      if (action.requireTwoFa) body.totpCode = totpCode;
      const res = await fetch(`${BASE}/${action.apiPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Confirmation failed");
        return;
      }
      setOpenId(null);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
            <AlertDialogContent className="border-destructive/50">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive">{a.title}</AlertDialogTitle>
                <AlertDialogDescription>{a.description}</AlertDialogDescription>
              </AlertDialogHeader>
              {a.apiPath ? (
                <div className="grid gap-4 py-2">
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
                    <Label>Your password</Label>
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
                  {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  Use Customers or per-customer actions to anonymise. No bulk API.
                </p>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                {a.apiPath && (
                  <Button
                    onClick={handleConfirm}
                    disabled={loading || !canSubmit}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {loading ? "Processing…" : a.confirmLabel}
                  </Button>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}
    </>
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
