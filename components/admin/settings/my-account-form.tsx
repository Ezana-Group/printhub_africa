"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
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

type Dept = { id: string; name: string; isActive?: boolean };

interface MyAccountFormProps {
  name: string;
  email: string;
  phone?: string | null;
  twoFaEnabled?: boolean;
  pinSet?: boolean;
  role?: string;
  position?: string | null;
  departmentId?: string | null;
  department?: string | null;
  joinedAt?: Date | string | null;
}

export function MyAccountForm({
  name,
  email,
  phone = null,
  twoFaEnabled = false,
  pinSet = false,
  role = "STAFF",
  position = null,
  departmentId = null,
  department = null,
  joinedAt = null,
}: MyAccountFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const isAdminOrAbove = ["ADMIN", "SUPER_ADMIN"].includes(role);

  useEffect(() => {
    if (isAdminOrAbove) {
      fetch("/api/admin/departments")
        .then((r) => r.json())
        .then((data) => setDepartments(data.departments ?? []))
        .catch(() => setDepartments([]));
    }
  }, [isAdminOrAbove]);

  const [twoFaOpen, setTwoFaOpen] = useState(false);
  const [twoFaSecret, setTwoFaSecret] = useState<string | null>(null);
  const [twoFaOtpauthUrl, setTwoFaOtpauthUrl] = useState<string | null>(null);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [twoFaError, setTwoFaError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [pinOpen, setPinOpen] = useState(false);
  const [pinCurrentPassword, setPinCurrentPassword] = useState("");
  const [pinNewPin, setPinNewPin] = useState("");
  const [pinConfirmPin, setPinConfirmPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      const body: Record<string, unknown> = Object.fromEntries(formData.entries());
      if (isAdminOrAbove) {
        const posInput = form.querySelector<HTMLInputElement>('input[name="position"]');
        const deptSelect = form.querySelector<HTMLSelectElement>('select[name="departmentId"]');
        if (posInput) body.position = posInput.value;
        if (deptSelect) body.departmentId = deptSelect.value || null;
      }
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

  const handleSetPin = async () => {
    setPinError(null);
    if (!pinCurrentPassword.trim()) {
      setPinError("Enter your current password.");
      return;
    }
    if (pinNewPin.length !== 4 || !/^\d{4}$/.test(pinNewPin)) {
      setPinError("PIN must be exactly 4 digits.");
      return;
    }
    if (pinNewPin !== pinConfirmPin) {
      setPinError("PIN and confirmation do not match.");
      return;
    }
    setPinLoading(true);
    try {
      const res = await fetch("/api/admin/settings/my-account/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pinCurrentPassword.trim(),
          newPin: pinNewPin,
          confirmPin: pinConfirmPin,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPinError(data.error ?? "Failed to set PIN.");
        return;
      }
      setPinSuccess(true);
      setPinCurrentPassword("");
      setPinNewPin("");
      setPinConfirmPin("");
      setTimeout(() => {
        setPinSuccess(false);
        setPinOpen(false);
        router.refresh();
      }, 1500);
    } catch {
      setPinError("Something went wrong");
    } finally {
      setPinLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
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
    setPasswordLoading(true);
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
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setPasswordSuccess(false);
        signOut({ callbackUrl: "/login", redirect: true });
      }, 2000);
    } catch {
      setPasswordError("Something went wrong");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <form id="settings-my-account" onSubmit={handleSaveProfile} className="space-y-6">
      <SectionCard
        title="Profile"
        description={
          isAdminOrAbove
            ? "Your name, email, position, and department."
            : "Your name, email, and contact details. Position and department are set by your admin."
        }
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
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={phone ?? ""} placeholder="+254 XXX XXX XXX" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="position">Position / Title</Label>
          {isAdminOrAbove ? (
            <Input
              id="position"
              name="position"
              type="text"
              defaultValue={position ?? ""}
              placeholder="e.g. Super Admin, Head of Operations"
              className="focus-visible:ring-primary"
            />
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm text-foreground">{position ?? "—"}</p>
              <span className="text-xs text-muted-foreground">(set by admin)</span>
            </div>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="departmentId">Department</Label>
          {isAdminOrAbove ? (
            <select
              id="departmentId"
              name="departmentId"
              defaultValue={departmentId ?? ""}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <option value="">Select department...</option>
              {departments.filter((d) => d.isActive !== false).map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm text-foreground">{department ?? "—"}</p>
              <span className="text-xs text-muted-foreground">(set by admin)</span>
            </div>
          )}
        </div>
        <div className="grid gap-2">
          <Label>Joined</Label>
          <p className="text-sm text-foreground">
            {joinedAt
              ? new Date(joinedAt).toLocaleDateString("en-KE", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "—"}
          </p>
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
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            disabled={passwordLoading}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            disabled={passwordLoading}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            disabled={passwordLoading}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleUpdatePassword}
          disabled={passwordLoading}
        >
          {passwordLoading ? "Updating…" : "Update Password"}
        </Button>
        {passwordSuccess && (
          <p className="text-sm text-green-600 font-medium">
            Password updated. Signing you out — please sign in again with your new password.
          </p>
        )}
        {passwordError && (
          <p className="text-sm text-destructive font-medium">{passwordError}</p>
        )}
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
            <div className="space-y-3">
              <div className="flex justify-center bg-white p-3 rounded-md inline-block">
                <QRCodeSVG value={twoFaOtpauthUrl} size={192} level="M" />
              </div>
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
        <p className="text-sm text-muted-foreground mb-2">
          Status: {pinSet ? "Set" : "Not set"}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setPinError(null);
            setPinSuccess(false);
            setPinCurrentPassword("");
            setPinNewPin("");
            setPinConfirmPin("");
            setPinOpen(true);
          }}
        >
          {pinSet ? "Change PIN" : "Set PIN"}
        </Button>
      </SectionCard>

      <Dialog open={pinOpen} onOpenChange={(open) => !pinLoading && setPinOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{pinSet ? "Change" : "Set"} production PIN</DialogTitle>
            <DialogDescription>
              Enter your account password to authorize, then choose a 4-digit PIN for the production floor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="pin-current-password">Current password</Label>
              <Input
                id="pin-current-password"
                type="password"
                value={pinCurrentPassword}
                onChange={(e) => setPinCurrentPassword(e.target.value)}
                autoComplete="current-password"
                disabled={pinLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pin-new">New PIN (4 digits)</Label>
              <Input
                id="pin-new"
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="0000"
                value={pinNewPin}
                onChange={(e) => setPinNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                disabled={pinLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pin-confirm">Confirm PIN</Label>
              <Input
                id="pin-confirm"
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="0000"
                value={pinConfirmPin}
                onChange={(e) => setPinConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                disabled={pinLoading}
              />
            </div>
            {pinSuccess && (
              <p className="text-sm text-green-600 font-medium">PIN saved. You can use it on the production floor.</p>
            )}
            {pinError && <p className="text-sm text-destructive font-medium">{pinError}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPinOpen(false)} disabled={pinLoading}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSetPin}
              disabled={pinLoading || !pinCurrentPassword.trim() || pinNewPin.length !== 4 || pinConfirmPin.length !== 4}
            >
              {pinLoading ? "Saving…" : pinSet ? "Change PIN" : "Set PIN"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
