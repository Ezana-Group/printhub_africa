"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
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

function useBusinessPublic() {
  const [data, setData] = useState<{ supportEmail?: string; city?: string; country?: string }>({});
  useEffect(() => {
    fetch("/api/settings/business-public")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);
  return data;
}

function SupportEmailFallback() {
  const { supportEmail } = useBusinessPublic();
  const email = supportEmail ?? "support@printhub.africa";
  return <a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a>;
}

export function SecuritySettingsClient() {
  const router = useRouter();
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { city, country } = useBusinessPublic();
  const sessionLocation = [city, country].filter(Boolean).join(", ") || "Nairobi, Kenya";

  // 2FA state
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [twoFaMethod, setTwoFaMethod] = useState<string | null>(null);
  const [twoFaLoadingStatus, setTwoFaLoadingStatus] = useState(true);
  const [twoFaOpen, setTwoFaOpen] = useState(false);
  const [twoFaSecret, setTwoFaSecret] = useState<string | null>(null);
  const [twoFaOtpauthUrl, setTwoFaOtpauthUrl] = useState<string | null>(null);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [twoFaError, setTwoFaError] = useState<string | null>(null);
  const [disable2FaOpen, setDisable2FaOpen] = useState(false);
  const [disable2FaPassword, setDisable2FaPassword] = useState("");
  const [disable2FaLoading, setDisable2FaLoading] = useState(false);
  const [disable2FaError, setDisable2FaError] = useState<string | null>(null);

  const refresh2FaStatus = useCallback(() => {
    setTwoFaLoadingStatus(true);
    fetch("/api/account/settings/2fa")
      .then((r) => r.json())
      .then((data) => {
        setTwoFaEnabled(!!data.twoFaEnabled);
        setTwoFaMethod(data.twoFaMethod ?? null);
      })
      .catch(() => {})
      .finally(() => setTwoFaLoadingStatus(false));
  }, []);

  useEffect(() => {
    refresh2FaStatus();
  }, [refresh2FaStatus]);

  const handleEnable2FAClick = async () => {
    setTwoFaError(null);
    setTwoFaLoading(true);
    try {
      const res = await fetch("/api/account/settings/2fa/setup", { method: "POST" });
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
      const res = await fetch("/api/account/settings/2fa/verify", {
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
      refresh2FaStatus();
      router.refresh();
    } catch {
      setTwoFaError("Something went wrong");
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handle2FASetupMethod = async (method: "email" | "sms") => {
    setTwoFaError(null);
    setTwoFaLoading(true);
    try {
      const res = await fetch("/api/account/settings/2fa/setup-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTwoFaError(data.error ?? "Failed to enable");
        return;
      }
      refresh2FaStatus();
      router.refresh();
    } catch {
      setTwoFaError("Something went wrong");
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disable2FaPassword.trim()) {
      setDisable2FaError("Enter your current password.");
      return;
    }
    setDisable2FaError(null);
    setDisable2FaLoading(true);
    try {
      const res = await fetch("/api/account/settings/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: disable2FaPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDisable2FaError(data.error ?? "Failed to disable 2FA");
        return;
      }
      setDisable2FaOpen(false);
      setDisable2FaPassword("");
      refresh2FaStatus();
      router.refresh();
    } catch {
      setDisable2FaError("Something went wrong");
    } finally {
      setDisable2FaLoading(false);
    }
  };

  async function handleUpdatePassword() {
    setPasswordError(null);
    if (!currentPassword.trim()) {
      setPasswordError("Enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/account/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPasswordError(data.error ?? "Failed to update password.");
        return;
      }
      setPasswordSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSaved(false), 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Password"
        description="Update your account password."
      >
        <div className="grid gap-2">
          <Label htmlFor="currentPassword">Current Password</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
          <p className="text-xs text-muted-foreground">
            Min 8 characters. Use a mix of letters, numbers and symbols for strength.
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        {passwordError && (
          <p className="text-sm text-destructive">{passwordError}</p>
        )}
        <Button
          type="button"
          onClick={handleUpdatePassword}
          disabled={loading}
        >
          {loading ? "Updating…" : "Update Password"}
        </Button>
        {passwordSaved && (
          <p className="text-sm text-green-600 font-medium">✓ Password updated</p>
        )}
      </SectionCard>

      <SectionCard
        title="Two-Factor Authentication"
        description="Add an extra layer of security."
      >
        <p className="text-sm text-muted-foreground mb-2">
          Status:{" "}
          {twoFaLoadingStatus ? (
            <span className="font-medium">Loading…</span>
          ) : twoFaEnabled ? (
            <span className="font-medium">
              Enabled (
              {twoFaMethod === "totp"
                ? "Authenticator app"
                : twoFaMethod === "email"
                  ? "Email code"
                  : twoFaMethod === "sms"
                    ? "SMS code"
                    : "Authenticator"}
              )
            </span>
          ) : (
            <span className="font-medium">Disabled</span>
          )}
        </p>
        {twoFaEnabled && (
          <div className="flex flex-wrap gap-2 mb-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDisable2FaError(null);
                setDisable2FaPassword("");
                setDisable2FaOpen(true);
              }}
              disabled={disable2FaLoading}
            >
              Disable 2FA
            </Button>
            <p className="text-xs text-muted-foreground self-center">
              You can re-enable with a different method after disabling.
            </p>
          </div>
        )}
        {!twoFaEnabled && !twoFaLoadingStatus && (
          <div className="flex flex-wrap gap-2">
            <p className="text-sm text-muted-foreground w-full">
              Supported apps: Google Authenticator, Authy, Microsoft Authenticator.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleEnable2FAClick}
              disabled={twoFaLoading}
            >
              {twoFaLoading ? "Starting…" : "Authenticator app"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={twoFaLoading}
              onClick={() => handle2FASetupMethod("email")}
            >
              Email code
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={twoFaLoading}
              onClick={() => handle2FASetupMethod("sms")}
            >
              SMS code
            </Button>
          </div>
        )}
        {twoFaError && (
          <p className="text-sm text-destructive font-medium mt-2">{twoFaError}</p>
        )}
      </SectionCard>

      <Dialog open={disable2FaOpen} onOpenChange={(open) => !disable2FaLoading && setDisable2FaOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your current password to disable 2FA. You can re-enable it later with
              authenticator app, email, or SMS.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDisable2FA} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="disable2fa-password">Current password</Label>
              <Input
                id="disable2fa-password"
                type="password"
                value={disable2FaPassword}
                onChange={(e) => setDisable2FaPassword(e.target.value)}
                autoComplete="current-password"
                disabled={disable2FaLoading}
              />
            </div>
            {disable2FaError && (
              <p className="text-sm text-destructive font-medium">{disable2FaError}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDisable2FaOpen(false)}
                disabled={disable2FaLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={disable2FaLoading || !disable2FaPassword.trim()}>
                {disable2FaLoading ? "Disabling…" : "Disable 2FA"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
            <div className="space-y-3">
              <div className="flex justify-center bg-white p-3 rounded-md inline-block">
                <QRCodeSVG value={twoFaOtpauthUrl} size={192} level="M" />
              </div>
              <p className="text-xs text-muted-foreground font-mono break-all">
                Secret (manual entry): {twoFaSecret}
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
        title="Active Sessions"
        description="Devices currently logged in to your account."
      >
        <ul className="space-y-3 text-sm">
          <li className="flex items-center justify-between gap-4 py-2 border-b">
            <span>Chrome on Windows · {sessionLocation} · Active now</span>
            <Button type="button" variant="ghost" size="sm">
              Sign out this device
            </Button>
          </li>
        </ul>
        <Button type="button" variant="outline" size="sm">
          Sign Out All Other Devices
        </Button>
      </SectionCard>

      <SectionCard
        title="Account Activity"
        description="Recent login events."
      >
        <p className="text-sm text-muted-foreground">
          Last 5 login events (date/time, device, location, status).
        </p>
        <Button type="button" variant="link" size="sm">
          View full login history
        </Button>
        <p className="text-xs text-muted-foreground">
          If you see activity you don&apos;t recognise, change your password and
          contact{" "}
          <SupportEmailFallback />
        </p>
      </SectionCard>

      <SectionCard
        title="Delete Account"
        description="Permanently delete your account and all your data."
      >
        <p className="text-sm text-muted-foreground">
          Orders, quotes, and invoices are retained for 7 years for legal
          compliance. Your personal data will be anonymised.
        </p>
        <Button type="button" variant="destructive">
          Request Account Deletion
        </Button>
      </SectionCard>
    </div>
  );
}
