"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Sends password reset or (for invite-pending staff) a fresh invite link — email goes to personal email when set. */
export function ResetPasswordButton({
  staffId,
  staffEmail,
  invitePending = false,
}: {
  staffId: string;
  staffEmail: string;
  invitePending?: boolean;
}) {
  void staffEmail;
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/staff/${staffId}/send-reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to send email");
        return;
      }
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={loading || sent}
      >
        {loading
          ? "Sending…"
          : sent
            ? invitePending
              ? "Invite email sent"
              : "Reset email sent"
            : invitePending
              ? "Resend invite email"
              : "Reset password"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
