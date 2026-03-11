"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MyAccountFormProps {
  name: string;
  email: string;
  twoFaEnabled?: boolean;
}

export function MyAccountForm({ name, email, twoFaEnabled = false }: MyAccountFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [twoFaOpen, setTwoFaOpen] = useState(false);
  const [twoFaSecret, setTwoFaSecret] = useState<string | null>(null);
  const [twoFaOtpauthUrl, setTwoFaOtpauthUrl] = useState<string | null>(null);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [twoFaError, setTwoFaError] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      const body = Object.fromEntries(formData.entries());
      const res = await fetch("/api/admin/settings/my-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleEnable2FAClick = async () => {
    setTwoFaError(null);
    setTwoFaLoading(true);
    try {
      const res = await fetch("/api/admin/settings/my-account/2fa/setup", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTwoFaError(data.error ?? "Failed to start 2FA setup");
        return;
      }
      setTwoFaSecret(data.secret ?? null);
      setTwoFaOtpauthUrl(data.otpauthUrl ?? null);
      setTwoFaCode("");
      setTwoFaOpen(true);
    } catch {
      setTwoFaError("Something went wrong");
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFaSecret || twoFaCode.length !== 6) {
      setTwoFaError("Enter the 6-digit code from your authenticator app");
      return;
    }
    setTwoFaError(null);
    setTwoFaLoading(true);
    try {
      const res = await fetch("/api/admin/settings/my-account/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: twoFaCode, secret: twoFaSecret }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTwoFaError(data.error ?? "Verification failed");
        return;
      }
      setTwoFaOpen(false);
      setTwoFaSecret(null);
      setTwoFaOtpauthUrl(null);
      setTwoFaCode("");
      router.refresh();
    } catch {
      setTwoFaError("Something went wrong");
    } finally {
      setTwoFaLoading(false);
    }
  };

  return (
    <form id="settings-my-account" onSubmit={handleSaveProfile} className="space-y-6">
      <SectionCard
        title="Profile"
        description="Your name, email, and position (position/department set by admin)."
      >
        <div className="grid gap-2">
          <Label>Profile Photo</Label>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-lg font-display font-bold text-muted-foreground">
              {name.slice(0, 2).toUpperCase() || "?"}
            </div>
            <Button type="button" variant="outline" size="sm">
              Change Photo
            </Button>
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input id="name" name="name" defaultValue={name} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" name="email" type="email" defaultValue={email} required />
          <p className="text-xs text-muted-foreground">Changing email may require admin approval.</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input id="phone" name="phone" type="tel" placeholder="+254 XXX XXX XXX" />
        </div>
        <div className="grid gap-2">
          <Label>Position</Label>
          <p className="text-sm text-muted-foreground">— (read-only, set by admin)</p>
        </div>
        <div className="grid gap-2">
          <Label>Department</Label>
          <p className="text-sm text-muted-foreground">— (read-only, set by admin)</p>
        </div>
        <div className="grid gap-2">
          <Label>Start Date</Label>
          <p className="text-sm text-muted-foreground">— (read-only)</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : saved ? "Saved" : "Save Changes"}
          </Button>
          {saved && <p className="text-sm text-green-600 font-medium">Profile saved successfully.</p>}
          {error && <p className="text-sm text-destructive font-medium">{error}</p>}
        </div>
      </SectionCard>

      <SectionCard
        title="Password"
        description="Update your password."
      >
        <div className="grid gap-2">
          <Label htmlFor="currentPassword">Current Password</Label>
          <Input id="currentPassword" type="password" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="newPassword">New Password</Label>
          <Input id="newPassword" type="password" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input id="confirmPassword" type="password" />
        </div>
        <Button type="button" variant="outline">Update Password</Button>
      </SectionCard>

      <SectionCard
        title="Two-Factor Authentication"
        description="Admin accounts require 2FA. Highly recommended for all staff."
      >
        <p className="text-sm text-muted-foreground">
          Status: {twoFaEnabled ? "Enabled" : "Disabled"}
        </p>
        {!twoFaEnabled && (
          <Button
            type="button"
            variant="outline"
            onClick={handleEnable2FAClick}
            disabled={twoFaLoading}
          >
            {twoFaLoading ? "Starting…" : "Enable 2FA"}
          </Button>
        )}
      </SectionCard>

      <Dialog open={twoFaOpen} onOpenChange={(open) => !twoFaLoading && setTwoFaOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app (e.g. Google Authenticator), or enter the
              secret manually. Then enter the 6-digit code below to confirm.
            </DialogDescription>
          </DialogHeader>
          {twoFaOtpauthUrl && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-mono break-all">
                Secret (manual entry): {twoFaSecret}
              </p>
              <p className="text-xs text-muted-foreground break-all">
                Or use this URL in your app: {twoFaOtpauthUrl}
              </p>
            </div>
          )}
          <form onSubmit={handle2FAVerify} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="twofa-code">Verification code</Label>
              <Input
                id="twofa-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                value={twoFaCode}
                onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={twoFaLoading}
              />
            </div>
            {twoFaError && (
              <p className="text-sm text-destructive font-medium">{twoFaError}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTwoFaOpen(false)}
                disabled={twoFaLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={twoFaLoading || twoFaCode.length !== 6}>
                {twoFaLoading ? "Verifying…" : "Verify and enable 2FA"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SectionCard
        title="PIN (production floor)"
        description="4-digit PIN for job ticket scanning and production updates on shared devices."
      >
        <Button type="button" variant="outline">Set / Change PIN</Button>
      </SectionCard>
    </form>
  );
}
