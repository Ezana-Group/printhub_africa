"use client";

import { useState, useEffect } from "react";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { city, country } = useBusinessPublic();
  const sessionLocation = [city, country].filter(Boolean).join(", ") || "Nairobi, Kenya";

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
        <p className="text-sm text-muted-foreground">
          Status: <span className="font-medium">Disabled</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Add an extra layer of security to your account. Supported apps: Google
          Authenticator, Authy, Microsoft Authenticator.
        </p>
        <Button type="button" variant="outline">
          Enable 2FA
        </Button>
      </SectionCard>

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
