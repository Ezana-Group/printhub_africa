"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/admin/email/rich-text-editor";
import { Mail, Settings, PenSquare, Loader2, Send, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ThreadRow = {
  id: string;
  subject: string;
  status: "OPEN" | "CLOSED" | "SPAM";
  customerName: string | null;
  customerEmail: string;
  updatedAt: string;
  hasUnread: boolean;
  mailbox: { id: string; label: string; address: string };
  latestSnippet: string | null;
};

type Mailbox = { id: string; label: string; address: string };

export function EmailInboxClient({
  threads,
  mailboxes,
  currentUserEmail,
}: {
  threads: ThreadRow[];
  mailboxes: Mailbox[];
  currentUserEmail?: string;
}) {
  const router = useRouter();
  const [composeOpen, setComposeOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Compose form state */
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [cc, setCc] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");

  /* Sort mailboxes: user's own email first */
  const sortedMailboxes = [...mailboxes].sort((a, b) => {
    if (currentUserEmail) {
      const aMatch = a.address.toLowerCase() === currentUserEmail.toLowerCase();
      const bMatch = b.address.toLowerCase() === currentUserEmail.toLowerCase();
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
    }
    return a.label.localeCompare(b.label);
  });

  const [fromMailboxId, setFromMailboxId] = useState(sortedMailboxes[0]?.id ?? "");

  const handleSend = async () => {
    setError(null);
    if (!to.trim() || !subject.trim() || !bodyHtml.trim() || !fromMailboxId) {
      setError("To, Subject, From mailbox, and Message are required.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/admin/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim(),
          bodyHtml,
          cc: cc.trim() || undefined,
          fromAddressId: fromMailboxId,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Failed to send email.");
        return;
      }
      setComposeOpen(false);
      setTo("");
      setSubject("");
      setCc("");
      setBodyHtml("");
      router.refresh();
    } catch {
      setError("Failed to send email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email inbox
          </h1>
          <p className="text-muted-foreground text-sm">
            Staff-managed messages for <span className="font-mono">@printhub.africa</span> ({mailboxes.length} mailboxes configured).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
            <DialogTrigger asChild>
              <Button>
                <PenSquare className="h-4 w-4 mr-2" />
                Compose
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>New email</DialogTitle>
                <DialogDescription>
                  Compose and send an email from one of your configured mailboxes.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 mt-2">
                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>From mailbox</Label>
                    <select
                      value={fromMailboxId}
                      onChange={(e) => setFromMailboxId(e.target.value)}
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm w-full"
                    >
                      {sortedMailboxes.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label} ({m.address})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>To</Label>
                    <Input
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      placeholder="recipient@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Subject</Label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Email subject"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CC</Label>
                    <Input
                      value={cc}
                      onChange={(e) => setCc(e.target.value)}
                      placeholder="cc@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Message</Label>
                  <RichTextEditor
                    value={bodyHtml}
                    onChange={setBodyHtml}
                    placeholder="Write your message…"
                    minHeight="200px"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setComposeOpen(false)}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSend}
                    disabled={sending || !to.trim() || !subject.trim() || !bodyHtml.trim()}
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    {sending ? "Sending…" : "Send email"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" asChild>
            <Link href="/admin/email/settings">
              <Settings className="h-4 w-4 mr-2" />
              Manage Mailboxes
            </Link>
          </Button>
        </div>
      </div>

      {threads.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
          No threads found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {threads.map((t) => (
            <Link key={t.id} href={`/admin/email/thread/${t.id}`} className="block">
              <Card
                className={`hover:bg-muted/40 transition-colors cursor-pointer ${
                  t.hasUnread ? "border-primary/40" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="pt-2">
                      {t.hasUnread ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block" />
                      ) : (
                        <span className="h-2.5 w-2.5 rounded-full bg-transparent inline-block" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium truncate" title={t.customerName ?? t.customerEmail}>
                          {t.customerName ?? t.customerEmail}
                        </p>
                        <Badge variant="secondary" className="whitespace-nowrap">
                          {t.mailbox.label}
                        </Badge>
                        <Badge variant="outline" className="whitespace-nowrap">
                          {t.status}
                        </Badge>
                      </div>

                      <p className="mt-1 text-sm text-muted-foreground truncate" title={t.subject}>
                        <span className="font-medium text-foreground">{t.subject}</span>
                        {t.latestSnippet ? ` — ${t.latestSnippet}` : ""}
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(t.updatedAt).toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
