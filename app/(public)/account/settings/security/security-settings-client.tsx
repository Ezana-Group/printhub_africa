"use client";

import { useState, useEffect } from "react";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SupportEmailFallback() {
  const [email, setEmail] = useState<string>("support@printhub.africa");
  useEffect(() => {
    fetch("/api/settings/business-public")
      .then((r) => r.json())
      .then((d) => {
        if (d?.supportEmail) setEmail(d.supportEmail);
      })
      .catch(() => {});
  }, []);
  return <a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a>;
}

export function SecuritySettingsClient() {
  const [passwordSaved, setPasswordSaved] = useState(false);

  return (
    <div className="space-y-6">
      <SectionCard
        title="Password"
        description="Update your account password."
      >
        <div className="grid gap-2">
          <Label htmlFor="currentPassword">Current Password</Label>
          <Input id="currentPassword" name="currentPassword" type="password" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="newPassword">New Password</Label>
          <Input id="newPassword" name="newPassword" type="password" />
          <p className="text-xs text-muted-foreground">
            Min 8 characters, 1 uppercase, 1 number. Strength: —
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" />
        </div>
        <Button
          type="button"
          onClick={() => {
            setPasswordSaved(true);
            setTimeout(() => setPasswordSaved(false), 2000);
          }}
        >
          Update Password
        </Button>
        {passwordSaved && (
          <p className="text-sm text-green-600 font-medium">✓ Saved</p>
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
            <span>Chrome on Windows · Nairobi, Kenya · Active now</span>
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
