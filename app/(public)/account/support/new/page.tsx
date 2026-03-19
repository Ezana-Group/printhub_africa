"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewSupportTicketPage() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!subject.trim() || !message.trim()) {
      setError("Subject and message are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/account/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error?.message ?? "Failed to create ticket");
        return;
      }
      router.push(`/account/support/${data.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container max-w-xl mx-auto px-4 py-8">
      <Link href="/account/support" className="text-sm text-primary hover:underline">← Back to tickets</Link>
      <h1 className="text-2xl font-bold mt-4">New support ticket</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="subject">Subject *</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief description"
            className="mt-1"
            maxLength={200}
          />
        </div>
        <div>
          <Label htmlFor="message">Message *</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your issue or question..."
            className="mt-1 min-h-[120px]"
            maxLength={5000}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit ticket"}
        </Button>
      </form>
    </div>
  );
}
