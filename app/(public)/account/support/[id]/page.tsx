"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Message = {
  id: string;
  message: string;
  senderType: string;
  createdAt: string;
};

type Ticket = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  messages: Message[];
  createdAt: string;
};

export default function SupportTicketDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/account/support/tickets/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setTicket)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/account/support/tickets/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply.trim() }),
      });
      if (res.ok) {
        setReply("");
        const updated = await fetch(`/api/account/support/tickets/${id}`).then((r) => r.json());
        setTicket(updated);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !ticket) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <p className="text-slate-600">{loading ? "Loading…" : "Ticket not found."}</p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Link href="/account/support" className="text-sm text-primary hover:underline">← Back to tickets</Link>
      <div className="mt-4 border rounded-xl p-6">
        <span className="font-mono text-sm text-slate-500">{ticket.ticketNumber}</span>
        <h1 className="text-xl font-bold mt-1">{ticket.subject}</h1>
        <p className="text-sm text-slate-600 mt-1">Status: {ticket.status}</p>
      </div>
      <div className="mt-6 space-y-4">
        {ticket.messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-xl border p-4 ${m.senderType === "STAFF" ? "bg-slate-50 border-slate-200" : ""}`}
          >
            <p className="text-xs text-slate-500">{m.senderType} · {new Date(m.createdAt).toLocaleString()}</p>
            <p className="mt-2 whitespace-pre-wrap text-slate-800">{m.message}</p>
          </div>
        ))}
      </div>
      {ticket.status !== "CLOSED" && (
        <form onSubmit={handleReply} className="mt-8 space-y-2">
          <Label>Reply</Label>
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[100px]"
          />
          <Button type="submit" disabled={submitting}>Send reply</Button>
        </form>
      )}
    </div>
  );
}
