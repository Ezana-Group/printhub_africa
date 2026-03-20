"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SmartTextEditor } from "@/components/admin/smart-text-editor";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Download,
  Flag,
  Send,
  Loader2,
} from "lucide-react";

type EmailAttachment = {
  name: string;
  r2Key: string;
  size?: number;
  mimeType?: string;
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

type ThreadRow = {
  id: string;
  subject: string;
  status: "OPEN" | "CLOSED" | "SPAM";
  hasUnread: boolean;
  customerName: string | null;
  customerEmail: string;
  updatedAt: string;
  mailbox: { id: string; label: string; address: string };
};

type CurrentUser = {
  id?: string;
  role?: string;
  permissions?: string[];
};

type ThreadDetails = {
  id: string;
  subject: string;
  status: "OPEN" | "CLOSED" | "SPAM";
  hasUnread: boolean;
  customerName: string | null;
  customerEmail: string;
  assignedToId: string | null;
  mailbox: { id: string; label: string; address: string };
};

function statusBadgeVariant(status: ThreadDetails["status"]): { variant: string; className: string } {
  switch (status) {
    case "OPEN":
      return { variant: "secondary", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" };
    case "CLOSED":
      return { variant: "secondary", className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300" };
    case "SPAM":
      return { variant: "secondary", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" };
    default:
      return { variant: "secondary", className: "" };
  }
}

export function EmailThreadClient({
  thread,
  emails,
  currentUser,
  sidebarThreads,
  mailboxes,
  assignees,
  initialFilters,
}: {
  thread: ThreadDetails;
  emails: EmailRow[];
  currentUser: CurrentUser;
  sidebarThreads: ThreadRow[];
  mailboxes: { id: string; label: string; address: string }[];
  assignees: { id: string; name: string | null; email: string }[];
  initialFilters: { status: "OPEN" | "CLOSED" | "SPAM"; mailboxId?: string; assignedToId?: string };
}) {
  const router = useRouter();

  const [bodyHtml, setBodyHtml] = useState("");
  const [cc, setCc] = useState("");
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isAdminRole = currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN";

  const [spamDialogOpen, setSpamDialogOpen] = useState(false);

  const tabsValue = initialFilters.status;

  const canManage = isAdminRole || (currentUser.permissions ?? []).includes("email_manage");

  const pushSidebarFilters = (next: Partial<typeof initialFilters>) => {
    const sp = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");

    const merged = { ...initialFilters, ...next };
    if (merged.status) sp.set("status", merged.status);
    if (merged.mailboxId) sp.set("mailboxId", merged.mailboxId);
    else sp.delete("mailboxId");
    if (merged.assignedToId) sp.set("assignedToId", merged.assignedToId);
    else sp.delete("assignedToId");

    // Keep the selected thread visible while updating the sidebar.
    const qs = sp.toString();
    router.push(`/admin/email/thread/${thread.id}${qs ? `?${qs}` : ""}`);
  };

  const attachmentsForEmail = (attachments: unknown): EmailAttachment[] => {
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
  };

  const handlePatch = async (payload: { status?: ThreadDetails["status"]; assignedToId?: string | null }) => {
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/email/threads/${thread.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to update thread");
      }
      router.refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to update thread");
    }
  };

  const handleSendReply = async () => {
    setActionError(null);
    if (!bodyHtml.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/email/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: thread.id,
          bodyHtml,
          cc: cc.trim() ? cc.trim() : undefined,
          fromAddressId: thread.mailbox.id,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to send reply");
      }
      setBodyHtml("");
      setCc("");
      router.refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const badge = statusBadgeVariant(thread.status);

  const actionStatusLabel =
    thread.status === "OPEN" ? "Close" : thread.status === "CLOSED" ? "Reopen" : "Reopen";
  const actionStatusTarget: ThreadDetails["status"] = thread.status === "OPEN" ? "CLOSED" : "OPEN";

  const spamTarget: ThreadDetails["status"] = thread.status === "SPAM" ? "OPEN" : "SPAM";

  const mailboxOptions = mailboxes.map((m) => ({ value: m.id, label: m.label }));
  const assigneeOptions = [
    { value: "", label: "Unassigned" },
    ...assignees.map((a) => ({
      value: a.id,
      label: a.name ?? a.email,
    })),
  ];

  const unreadDotColorClass = "bg-blue-500";

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Sidebar */}
        <div className="lg:w-[360px] shrink-0 space-y-3">
          <div className="rounded-xl border bg-background p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="font-semibold">Threads</p>
                <p className="text-xs text-muted-foreground">Filter and select a conversation.</p>
              </div>
              <Badge variant="secondary" className="gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500" /> {sidebarThreads.length}
              </Badge>
            </div>

            <Tabs
              defaultValue={tabsValue}
              onValueChange={(v) => pushSidebarFilters({ status: v as ThreadDetails["status"] })}
            >
              <TabsList>
                <TabsTrigger value="OPEN">OPEN</TabsTrigger>
                <TabsTrigger value="CLOSED">CLOSED</TabsTrigger>
                <TabsTrigger value="SPAM">SPAM</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Mailbox</Label>
                <Select
                  value={initialFilters.mailboxId ?? ""}
                  onChange={(e) => pushSidebarFilters({ mailboxId: e.target.value || undefined })}
                  options={[
                    { value: "", label: "All mailboxes" },
                    ...mailboxOptions,
                  ]}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Assignee</Label>
                <Select
                  value={initialFilters.assignedToId ?? ""}
                  onChange={(e) => pushSidebarFilters({ assignedToId: e.target.value || undefined })}
                  options={assigneeOptions}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {sidebarThreads.map((t) => (
              <Link key={t.id} href={`/admin/email/thread/${t.id}`} className="block">
                <Card
                  className={`cursor-pointer hover:bg-muted/40 transition-colors ${
                    t.id === thread.id ? "border-primary/60" : ""
                  }`}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        {t.hasUnread ? (
                          <span className={`h-2.5 w-2.5 rounded-full ${unreadDotColorClass}`} />
                        ) : (
                          <span className="h-2.5 w-2.5 rounded-full bg-transparent border border-border mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium truncate">{t.customerName ?? t.customerEmail}</p>
                          <p className="text-sm text-muted-foreground truncate" title={t.subject}>
                            {t.subject}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(t.updatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{t.mailbox.label}</Badge>
                      <Badge variant="outline">{t.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}

            {sidebarThreads.length === 0 && (
              <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
                No threads match the selected filters.
              </div>
            )}
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 space-y-4">
          <div className="rounded-xl border bg-white p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold">{thread.subject}</h2>
                  <Badge variant="secondary" className={badge.className}>
                    {thread.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {thread.customerName ?? thread.customerEmail} · Replying via <span className="font-mono">{thread.mailbox.address}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {canManage && (
                  <>
                    {/* Assignee selector */}
                    {isAdminRole && (
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Assignee</Label>
                        <Select
                          value={thread.assignedToId ?? ""}
                          onChange={(e) => handlePatch({ assignedToId: e.target.value ? e.target.value : null })}
                          options={assigneeOptions}
                        />
                      </div>
                    )}

                    <Button
                      variant="outline"
                      onClick={() => handlePatch({ status: actionStatusTarget })}
                      disabled={!canManage}
                    >
                      {actionStatusLabel}
                    </Button>

                    <Dialog open={spamDialogOpen} onOpenChange={setSpamDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant={thread.status === "SPAM" ? "secondary" : "destructive"}
                          onClick={() => setSpamDialogOpen(true)}
                          disabled={!canManage}
                        >
                          <Flag className="h-4 w-4 mr-2" />
                          {thread.status === "SPAM" ? "Not spam" : "Mark as spam"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{thread.status === "SPAM" ? "Reopen thread?" : "Mark as spam?"}</DialogTitle>
                          <DialogDescription>
                            This will update the thread status and mark inbound emails as read.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setSpamDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button
                            variant={thread.status === "SPAM" ? "secondary" : "destructive"}
                            onClick={() => {
                              void handlePatch({ status: spamTarget });
                              setSpamDialogOpen(false);
                            }}
                          >
                            {thread.status === "SPAM" ? "Reopen" : "Spam"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            </div>

            {actionError && <p className="text-sm text-red-600">{actionError}</p>}
          </div>

          {/* Message list */}
          <div className="space-y-3">
            {emails.map((m) => {
              const isInbound = m.direction === "INBOUND";
              const attachments = attachmentsForEmail(m.attachments);
              return (
                <div
                  key={m.id}
                  className={`flex ${isInbound ? "justify-start" : "justify-end"}`}
                >
                  <Card
                    className={`max-w-[900px] w-full sm:w-auto border ${
                      isInbound ? "bg-slate-50" : "bg-primary/5 border-primary/20"
                    }`}
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {isInbound ? "INBOUND" : "OUTBOUND"}
                            </Badge>
                            <p className="text-sm font-medium text-foreground">
                              {isInbound ? (thread.customerName ?? thread.customerEmail) : thread.mailbox.label}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(m.sentAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                        </div>
                        {!m.isRead && isInbound && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                      </div>

                      <div className="prose prose-sm max-w-none break-words">
                        <div
                          dangerouslySetInnerHTML={{ __html: m.bodyHtml ?? "" }}
                        />
                      </div>

                      {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {attachments.map((a, idx) => (
                            <a
                              key={`${a.r2Key}-${idx}`}
                              href={`/api/r2/presign?bucket=private&key=${encodeURIComponent(a.r2Key)}&redirect=1`}
                              className="inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs hover:bg-muted/40"
                            >
                              <Download className="h-3.5 w-3.5" />
                              {a.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Reply composer */}
          <div className="rounded-xl border bg-white p-4 space-y-3">
            <h3 className="font-semibold text-lg">Reply</h3>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
              <div className="space-y-2">
                <Label>Message</Label>
                <SmartTextEditor
                  value={bodyHtml}
                  onChange={setBodyHtml}
                  placeholder="Write your reply…"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cc">CC (comma-separated)</Label>
                <Input
                  id="cc"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="cc1@email.com, cc2@email.com"
                />
                <div className="pt-3">
                  <Button
                    onClick={handleSendReply}
                    disabled={sending || !bodyHtml.trim() || !canManage}
                    className="w-full"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    {sending ? "Sending…" : "Send reply"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {!(canManage || isAdminRole) && (
            <p className="text-sm text-muted-foreground">
              You don’t have permission to send or manage this thread.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

