"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SmartTextEditor } from "@/components/admin/smart-text-editor";

type Message = {
  id: string;
  senderType: string;
  message: string;
  isInternal: boolean;
  createdAt: Date | string;
};

type Ticket = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string | null;
  messages: Message[];
};

export function SupportTicketDetailClient({ ticket: initial }: { ticket: Ticket }) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [status, setStatus] = useState(initial.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleReply() {
    if (!reply.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${initial.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: reply.trim(),
          isInternal,
          status: status !== initial.status ? status : undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error?.message ?? "Failed to send reply");
        return;
      }
      setReply("");
      setIsInternal(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        setError("Failed to update status");
        return;
      }
      setStatus(newStatus);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mt-6 space-y-4">
        {initial.messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-xl border p-4 ${m.isInternal ? "bg-amber-50 border-amber-200" : m.senderType === "STAFF" ? "bg-slate-50" : ""}`}
          >
            <p className="text-xs text-muted-foreground">
              {m.senderType}{m.isInternal ? " (internal)" : ""} · {new Date(m.createdAt).toLocaleString()}
            </p>
            <p className="mt-2 whitespace-pre-wrap">{m.message}</p>
          </div>
        ))}
      </div>

      {initial.status !== "CLOSED" && (
        <div className="mt-6 rounded-xl border p-6 bg-muted/30">
          <h3 className="font-semibold mb-3">Reply</h3>
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          <div className="mt-1">
            <SmartTextEditor
              value={reply}
              onChange={setReply}
              placeholder="Type your reply here..."
              minHeight="150px"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded"
              />
              Internal note (customer won&apos;t see)
            </label>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleReply} disabled={loading || !reply.trim()}>
              {loading ? "Sending…" : "Send reply"}
            </Button>
            {status !== initial.status && (
              <Button
                variant="outline"
                onClick={() => handleStatusChange(status)}
                disabled={loading}
              >
                Update status only
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
