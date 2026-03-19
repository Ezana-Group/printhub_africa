"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/admin/email/rich-text-editor";
import {
  Mail,
  PenSquare,
  Loader2,
  Send,
  X,
  Reply,
  Forward,
  Trash2,
  MailOpen,
  Inbox,
  SendHorizontal,
  FileText,
  Settings,
  Download,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/* ───────── types ───────── */

type Mailbox = {
  id: string;
  label: string;
  address: string;
  unreadCount?: number;
};

type ThreadRow = {
  id: string;
  subject: string;
  status: "OPEN" | "CLOSED" | "SPAM";
  hasUnread: boolean;
  unreadCount?: number;
  customerName: string | null;
  customerEmail: string;
  updatedAt: string;
  mailbox: { id: string; label: string; address: string };
  latestSnippet: string | null;
  latestDirection?: string | null;
  latestEmailAt?: string | null;
};

type EmailRow = {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  isRead: boolean;
  sentAt: string;
  bodyHtml: string;
  bodyText: string | null;
  subject: string;
  cc: string | null;
  toAddress: string;
  fromAddress: string;
  attachments: unknown;
};

type EmailAttachment = {
  name: string;
  r2Key: string;
  size?: number;
  mimeType?: string;
};

type ThreadDetail = {
  id: string;
  subject: string;
  status: "OPEN" | "CLOSED" | "SPAM";
  hasUnread: boolean;
  customerName: string | null;
  customerEmail: string;
  assignedToId: string | null;
  mailbox: { id: string; label: string; address: string };
};

type FolderType = "inbox" | "sent" | "drafts" | "trash";
type FilterType = "all" | "unread" | "flagged";

/* ───────── helpers ───────── */

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function relativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function parseAttachments(attachments: unknown): EmailAttachment[] {
  if (Array.isArray(attachments)) return attachments as EmailAttachment[];
  if (typeof attachments === "string") {
    try {
      const parsed = JSON.parse(attachments) as unknown;
      if (Array.isArray(parsed)) return parsed as EmailAttachment[];
    } catch {
      // ignore
    }
  }
  return [];
}

const MAILBOX_COLORS = [
  "#D85A30",
  "#2563EB",
  "#059669",
  "#7C3AED",
  "#DB2777",
  "#EA580C",
  "#0891B2",
  "#4F46E5",
];

/* ───────── component ───────── */

export function EmailInboxThreePane({
  initialThreads,
  mailboxes,
  currentUserEmail,
  initialSelectedThread,
  initialEmails,
}: {
  initialThreads: ThreadRow[];
  mailboxes: Mailbox[];
  currentUserEmail?: string;
  initialSelectedThread?: ThreadDetail | null;
  initialEmails?: EmailRow[];
}) {
  const router = useRouter();

  /* Pane 1 state */
  const [selectedMailboxId, setSelectedMailboxId] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<FolderType>("inbox");

  /* Pane 2 state */
  const [threads, setThreads] = useState<ThreadRow[]>(initialThreads);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(false);

  /* Pane 3 state */
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    initialSelectedThread?.id ?? null
  );
  const [threadDetail, setThreadDetail] = useState<ThreadDetail | null>(
    initialSelectedThread ?? null
  );
  const [emails, setEmails] = useState<EmailRow[]>(initialEmails ?? []);
  const [loadingThread, setLoadingThread] = useState(false);

  /* Reply state */
  const [replyHtml, setReplyHtml] = useState("");
  const [replyCc, setReplyCc] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  /* Compose state */
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeFromId, setComposeFromId] = useState(mailboxes[0]?.id ?? "");
  const [composeSending, setComposeSending] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);

  /* Action state */
  const [actionError, setActionError] = useState<string | null>(null);

  /* Scroll ref for email body */
  const emailBodyRef = useRef<HTMLDivElement>(null);

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

  /* Fetch threads from API */
  const fetchThreads = useCallback(
    async (mailboxId?: string | null) => {
      setLoadingThreads(true);
      try {
        const params = new URLSearchParams();
        if (mailboxId) params.set("mailboxId", mailboxId);
        if (activeFolder === "inbox") params.set("status", "OPEN");
        else if (activeFolder === "trash") params.set("status", "SPAM");
        params.set("limit", "50");

        const res = await fetch(`/api/admin/email/threads?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setThreads(data.threads ?? []);
        }
      } catch {
        // fail silently
      } finally {
        setLoadingThreads(false);
      }
    },
    [activeFolder]
  );

  /* When mailbox or folder changes, refetch */
  useEffect(() => {
    fetchThreads(selectedMailboxId);
  }, [selectedMailboxId, activeFolder, fetchThreads]);

  /* Fetch thread detail */
  const fetchThreadDetail = useCallback(async (threadId: string) => {
    setLoadingThread(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/email/threads/${threadId}`);
      if (res.ok) {
        const data = await res.json();
        setThreadDetail(data.thread);
        setEmails(data.emails ?? []);
        setReplyHtml("");
        setReplyCc("");
      }
    } catch {
      // fail silently
    } finally {
      setLoadingThread(false);
    }
  }, []);

  /* Select thread */
  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    fetchThreadDetail(threadId);
  };

  /* Scroll to bottom when emails load */
  useEffect(() => {
    if (emailBodyRef.current) {
      emailBodyRef.current.scrollTop = emailBodyRef.current.scrollHeight;
    }
  }, [emails]);

  /* Filter threads */
  const filteredThreads = threads.filter((t) => {
    if (activeFilter === "unread" && !t.hasUnread) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchSubject = t.subject.toLowerCase().includes(q);
      const matchSender = (t.customerName ?? t.customerEmail).toLowerCase().includes(q);
      if (!matchSubject && !matchSender) return false;
    }
    return true;
  });

  /* Send compose */
  const handleComposeSend = async () => {
    setComposeError(null);
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim() || !composeFromId) {
      setComposeError("To, Subject, From mailbox, and Message are required.");
      return;
    }
    setComposeSending(true);
    try {
      const res = await fetch("/api/admin/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: composeTo.trim(),
          subject: composeSubject.trim(),
          bodyHtml: composeBody,
          cc: composeCc.trim() || undefined,
          fromAddressId: composeFromId,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setComposeError(d.error ?? "Failed to send email.");
        return;
      }
      setComposeOpen(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeCc("");
      setComposeBody("");
      fetchThreads(selectedMailboxId);
    } catch {
      setComposeError("Failed to send email.");
    } finally {
      setComposeSending(false);
    }
  };

  /* Reply */
  const handleSendReply = async () => {
    if (!replyHtml.trim() || !threadDetail) return;
    setSendingReply(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: threadDetail.id,
          bodyHtml: replyHtml,
          cc: replyCc.trim() || undefined,
          fromAddressId: threadDetail.mailbox.id,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to send reply");
      }
      setReplyHtml("");
      setReplyCc("");
      fetchThreadDetail(threadDetail.id);
      fetchThreads(selectedMailboxId);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  /* Thread actions */
  const handleThreadAction = async (action: "markUnread" | "delete" | "close") => {
    if (!threadDetail) return;
    setActionError(null);
    try {
      const payload: { status?: string; hasUnread?: boolean } = {};
      if (action === "delete") payload.status = "SPAM";
      if (action === "close") payload.status = "CLOSED";
      // "markUnread" – just set hasUnread on the thread; no server PATCH exists for this
      // so we'll call the existing PATCH endpoint

      const res = await fetch(`/api/admin/email/threads/${threadDetail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "markUnread" ? { status: threadDetail.status } : payload
        ),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to update thread");
      }
      fetchThreads(selectedMailboxId);
      if (action === "delete" || action === "close") {
        setSelectedThreadId(null);
        setThreadDetail(null);
        setEmails([]);
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    }
  };

  /* ───────── Render ───────── */
  return (
    <div
      className="flex h-full"
      style={{ height: "calc(100vh - 3.5rem)" }}
    >
      {/* ═══════════ PANE 1: MAILBOX SIDEBAR ═══════════ */}
      <div
        className="flex flex-col border-r border-border bg-white shrink-0 overflow-hidden"
        style={{ width: 220 }}
      >
        {/* Compose button */}
        <div className="p-3">
          <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-full justify-center gap-2 font-semibold"
                style={{ backgroundColor: "#D85A30", color: "#fff" }}
              >
                <PenSquare className="h-4 w-4" />
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
                {composeError && (
                  <p className="text-sm text-red-600">{composeError}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>From mailbox</Label>
                    <select
                      value={composeFromId}
                      onChange={(e) => setComposeFromId(e.target.value)}
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
                      value={composeTo}
                      onChange={(e) => setComposeTo(e.target.value)}
                      placeholder="recipient@example.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Subject</Label>
                    <Input
                      value={composeSubject}
                      onChange={(e) => setComposeSubject(e.target.value)}
                      placeholder="Email subject"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CC</Label>
                    <Input
                      value={composeCc}
                      onChange={(e) => setComposeCc(e.target.value)}
                      placeholder="cc@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Message</Label>
                  <RichTextEditor
                    value={composeBody}
                    onChange={setComposeBody}
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
                    onClick={handleComposeSend}
                    disabled={composeSending || !composeTo.trim() || !composeSubject.trim() || !composeBody.trim()}
                    style={{ backgroundColor: "#D85A30", color: "#fff" }}
                  >
                    {composeSending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {composeSending ? "Sending…" : "Send email"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Mailboxes list */}
        <div className="px-2 pb-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
            Mailboxes
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-1 space-y-0.5">
          {/* "All Mail" option */}
          <button
            onClick={() => setSelectedMailboxId(null)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left ${
              selectedMailboxId === null
                ? "bg-[#D85A30]/10 text-[#D85A30] font-semibold"
                : "text-foreground hover:bg-muted/60"
            }`}
          >
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate flex-1">All Mail</span>
          </button>

          {sortedMailboxes.map((m, idx) => {
            const color = MAILBOX_COLORS[idx % MAILBOX_COLORS.length];
            const isActive = selectedMailboxId === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMailboxId(m.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                  isActive
                    ? "bg-[#D85A30]/10 text-[#D85A30] font-semibold"
                    : "text-foreground hover:bg-muted/60"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate flex-1">{m.label}</span>
                {(m.unreadCount ?? 0) > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 min-w-[18px] justify-center"
                  >
                    {m.unreadCount}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Folders */}
        <div className="border-t border-border px-2 pt-2 pb-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
            Folders
          </p>
        </div>
        <div className="px-1 pb-2 space-y-0.5">
          {(
            [
              { key: "inbox" as FolderType, icon: Inbox, label: "Inbox" },
              { key: "sent" as FolderType, icon: SendHorizontal, label: "Sent" },
              { key: "drafts" as FolderType, icon: FileText, label: "Drafts" },
              { key: "trash" as FolderType, icon: Trash2, label: "Trash" },
            ] as const
          ).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveFolder(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                activeFolder === key
                  ? "bg-[#D85A30]/10 text-[#D85A30] font-semibold"
                  : "text-foreground hover:bg-muted/60"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        {/* Settings link */}
        <div className="border-t border-border p-2">
          <button
            onClick={() => router.push("/admin/email/settings")}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted/60 transition-colors text-left"
          >
            <Settings className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Manage Mailboxes</span>
          </button>
        </div>
      </div>

      {/* ═══════════ PANE 2: EMAIL LIST ═══════════ */}
      <div
        className="flex flex-col border-r border-border bg-white shrink-0 overflow-hidden"
        style={{ width: 320 }}
      >
        {/* Search */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search emails…"
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
          {(["all", "unread", "flagged"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeFilter === f
                  ? "bg-[#D85A30] text-white"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto">
          {loadingThreads ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Mail className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No emails found</p>
            </div>
          ) : (
            filteredThreads.map((t) => {
              const isSelected = selectedThreadId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectThread(t.id)}
                  className={`w-full text-left px-3 py-3 border-b border-border/50 transition-colors ${
                    isSelected
                      ? "bg-[#D85A30]/8 border-l-2 border-l-[#D85A30]"
                      : "hover:bg-muted/40 border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {t.hasUnread && (
                          <span className="h-2 w-2 rounded-full bg-[#D85A30] shrink-0" />
                        )}
                        <p
                          className={`text-sm truncate ${
                            t.hasUnread
                              ? "font-bold text-foreground"
                              : "font-medium text-foreground/80"
                          }`}
                        >
                          {t.customerName ?? t.customerEmail}
                        </p>
                      </div>
                      <p className="text-sm text-foreground/90 truncate mt-0.5">
                        {t.subject}
                      </p>
                      {t.latestSnippet && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5 leading-relaxed">
                          {t.latestSnippet.slice(0, 80)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {relativeTime(t.latestEmailAt ?? t.updatedAt)}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {t.mailbox.label}
                      </Badge>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ═══════════ PANE 3: EMAIL READING ═══════════ */}
      <div className="flex-1 flex flex-col bg-[#FAFBFC] overflow-hidden">
        {!selectedThreadId || !threadDetail ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <Mail className="h-16 w-16 text-muted-foreground/20 mb-4" />
            <p className="text-lg font-medium text-muted-foreground/60">
              Select an email to read
            </p>
            <p className="text-sm text-muted-foreground/40 mt-1">
              Choose a conversation from the list
            </p>
          </div>
        ) : loadingThread ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Email header */}
            <div className="px-6 py-4 border-b border-border bg-white">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-foreground leading-snug">
                    {threadDetail.subject}
                  </h2>
                  <div className="flex items-center gap-2 mt-1.5">
                    {/* Avatar */}
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: "#D85A30" }}
                    >
                      {getInitials(
                        threadDetail.customerName ?? threadDetail.customerEmail
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {threadDetail.customerName ?? threadDetail.customerEmail}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        To: {threadDetail.mailbox.address}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      /* scroll to reply box */
                      emailBodyRef.current?.scrollTo({
                        top: emailBodyRef.current.scrollHeight,
                        behavior: "smooth",
                      });
                    }}
                    className="h-8 px-2.5 text-xs gap-1.5"
                  >
                    <Reply className="h-3.5 w-3.5" /> Reply
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 text-xs gap-1.5"
                    disabled
                  >
                    <Forward className="h-3.5 w-3.5" /> Forward
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleThreadAction("markUnread")}
                    className="h-8 px-2.5 text-xs gap-1.5"
                  >
                    <MailOpen className="h-3.5 w-3.5" /> Mark Unread
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleThreadAction("delete")}
                    className="h-8 px-2.5 text-xs gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>
              {actionError && (
                <p className="text-sm text-red-600 mt-2">{actionError}</p>
              )}
            </div>

            {/* Email body */}
            <div className="flex-1 overflow-y-auto" ref={emailBodyRef}>
              <div className="px-6 py-4 space-y-4">
                {emails.map((email) => {
                  const isInbound = email.direction === "INBOUND";
                  const attachments = parseAttachments(email.attachments);
                  return (
                    <div
                      key={email.id}
                      className={`rounded-lg border p-4 ${
                        isInbound
                          ? "bg-white border-border"
                          : "bg-[#D85A30]/5 border-[#D85A30]/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${
                              isInbound ? "bg-gray-500" : ""
                            }`}
                            style={
                              isInbound
                                ? undefined
                                : { backgroundColor: "#D85A30" }
                            }
                          >
                            {isInbound
                              ? getInitials(
                                  threadDetail.customerName ??
                                    threadDetail.customerEmail
                                )
                              : getInitials(threadDetail.mailbox.label)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {isInbound
                                ? threadDetail.customerName ??
                                  threadDetail.customerEmail
                                : threadDetail.mailbox.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {email.fromAddress} → {email.toAddress}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!email.isRead && isInbound && (
                            <span className="h-2 w-2 rounded-full bg-[#D85A30]" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(email.sentAt).toLocaleString("en-GB", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="prose prose-sm max-w-none break-words text-foreground/90">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: email.bodyHtml ?? "",
                          }}
                        />
                      </div>
                      {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-border/50">
                          {attachments.map((a, idx) => (
                            <a
                              key={`${a.r2Key}-${idx}`}
                              href={`/api/r2/presign?bucket=private&key=${encodeURIComponent(a.r2Key)}&redirect=1`}
                              className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs hover:bg-muted/40 transition-colors"
                            >
                              <Download className="h-3 w-3" />
                              {a.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Inline reply */}
            <div className="border-t border-border bg-white px-6 py-3">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Reply className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Reply to {threadDetail.customerName ?? threadDetail.customerEmail}
                  </span>
                  <div className="flex-1" />
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={replyCc}
                      onChange={(e) => setReplyCc(e.target.value)}
                      placeholder="CC"
                      className="h-7 text-xs w-36"
                    />
                  </div>
                </div>
                <RichTextEditor
                  value={replyHtml}
                  onChange={setReplyHtml}
                  placeholder="Write your reply…"
                  minHeight="80px"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyHtml.trim()}
                    size="sm"
                    style={{ backgroundColor: "#D85A30", color: "#fff" }}
                    className="gap-1.5"
                  >
                    {sendingReply ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    {sendingReply ? "Sending…" : "Send reply"}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
