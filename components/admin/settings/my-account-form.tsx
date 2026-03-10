"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MyAccountFormProps {
  name: string;
  email: string;
}

export function MyAccountForm({ name, email }: MyAccountFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <p className="text-sm text-muted-foreground">Status: Disabled</p>
        <Button type="button" variant="outline">Enable 2FA</Button>
      </SectionCard>

      <SectionCard
        title="PIN (production floor)"
        description="4-digit PIN for job ticket scanning and production updates on shared devices."
      >
        <Button type="button" variant="outline">Set / Change PIN</Button>
      </SectionCard>
    </form>
  );
}
