"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AcceptInviteForm({ userId, token, email, name }: { userId: string; token: string; email: string; name: string }) {
  void name;
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = data.error;
        setError(
          typeof err === "string"
            ? err
            : err?.token?.[0] ?? err?.password?.[0] ?? err?.userId?.[0] ?? "Failed to set password"
        );
        return;
      }
      router.push("/login?callbackUrl=/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
      <h1 className="text-lg font-semibold">Set your password</h1>
      <p className="mt-1 text-sm text-muted-foreground">{email}</p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1"
            minLength={8}
            required
          />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1"
            minLength={8}
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Setting password…" : "Accept & sign in"}
        </Button>
      </form>
    </div>
  );
}
