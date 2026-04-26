"use client";

/**
 * /admin/whatsapp
 *
 * WhatsApp Business inbox embedded in the admin panel.
 * Calls the Next.js proxy at /api/admin/whatsapp/[...path]
 * which forwards to the standalone WhatsApp Express service.
 * No separate login needed — uses the admin session.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Search,
  RefreshCw,
  ChevronLeft,
  Bot,
  User,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Conversation {
  _id?: string;
  customerPhone: string;
  customerName: string;
  channel?: "whatsapp" | "messenger" | "instagram";
  lastMessage: string;
  lastMessageAt: string;
  lastDirection: "inbound" | "outbound";
  unreadCount: number;
  agentActive: boolean;
}

interface Message {
  _id: string;
  direction: "inbound" | "outbound";
  type: string;
  content: string;
  status: "pending" | "sent" | "delivered" | "read" | "failed";
  createdAt: string;
  channel?: "whatsapp" | "messenger" | "instagram";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const diff = now.getTime() - d.getTime();
  if (diff < 7 * 86_400_000) {
    return d.toLocaleDateString([], { weekday: "short" });
  }
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

function formatBubbleTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateDivider(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now.getTime() - 86_400_000);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function initials(name: string) {
  if (!name || name === "Unknown") return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function typeLabel(type: string) {
  const map: Record<string, string> = {
    image: "🖼 Image",
    document: "📄 Document",
    audio: "🎵 Audio",
    video: "🎬 Video",
    location: "📍 Location",
    sticker: "😊 Sticker",
  };
  return map[type] ?? `[${type}]`;
}

const STATUS_ICONS: Record<string, { icon: string; cls: string }> = {
  sent:      { icon: "✓",  cls: "text-muted-foreground" },
  delivered: { icon: "✓✓", cls: "text-muted-foreground" },
  read:      { icon: "✓✓", cls: "text-blue-500" },
  failed:    { icon: "✗",  cls: "text-red-500" },
  pending:   { icon: "◷",  cls: "text-muted-foreground" },
};

const POLL_MS      = 3_000;
const LIST_POLL_MS = 10_000;

// ─── Component ────────────────────────────────────────────────────────────────

export default function WhatsAppInboxPage() {
  // ── State ────────────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filtered, setFiltered]           = useState<Conversation[]>([]);
  const [search, setSearch]               = useState("");
  const [activePhone, setActivePhone]     = useState<string | null>(null);
  const [messages, setMessages]           = useState<Message[]>([]);
  const [activeName, setActiveName]       = useState("");
  const [activeChannel, setActiveChannel] = useState<"whatsapp" | "messenger" | "instagram">("whatsapp");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [agentActive, setAgentActive]     = useState(false);
  const [compose, setCompose]             = useState("");
  const [sending, setSending]             = useState(false);
  const [loadingConvs, setLoadingConvs]   = useState(true);
  const [loadingMsgs, setLoadingMsgs]     = useState(false);
  const [convError, setConvError]         = useState<string | null>(null);
  const [chatError, setChatError]         = useState<string | null>(null);
  const [totalUnread, setTotalUnread]     = useState(0);
  const [sidebarOpen, setSidebarOpen]     = useState(true); // mobile toggle

  const messagesEndRef   = useRef<HTMLDivElement>(null);
  const pollRef          = useRef<ReturnType<typeof setInterval> | null>(null);
  const listPollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMsgDateRef   = useRef<Date | null>(null);
  const composeRef       = useRef<HTMLTextAreaElement>(null);

  // ── API helper ───────────────────────────────────────────────────────────
  async function apiFetch(path: string, opts: RequestInit = {}) {
    const res = await fetch(`/api/admin/whatsapp/${path}`, {
      ...opts,
      headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    return res.json();
  }

  // ── Load conversations ───────────────────────────────────────────────────
  const loadConversations = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoadingConvs(true);
      const data = await apiFetch("conversations?limit=50");
      const convs: Conversation[] = data.conversations ?? [];
      setConversations(convs);
      setConvError(null);
    } catch (err: any) {
      if (!silent) setConvError(err.message);
    } finally {
      if (!silent) setLoadingConvs(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await apiFetch("stats");
      setTotalUnread(data.totalUnread ?? 0);
    } catch {
      /* non-fatal */
    }
  }, []);

  // ── Filter conversations by search ──────────────────────────────────────
  useEffect(() => {
    const q = search.toLowerCase().trim();
    setFiltered(
      q
        ? conversations.filter(
            (c) =>
              c.customerName?.toLowerCase().includes(q) ||
              c.customerPhone?.includes(q) ||
              c.lastMessage?.toLowerCase().includes(q)
          )
        : conversations
    );
  }, [search, conversations]);

  // Auto-open the most recent conversation on first load.
  useEffect(() => {
    if (!activePhone && conversations.length > 0) {
      openConversation(conversations[0].customerPhone);
    }
    // Intentionally only reacts to conversation list updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, activePhone]);

  // ── Mount: load convs + start list-poll ─────────────────────────────────
  useEffect(() => {
    loadConversations();
    loadStats();
    listPollRef.current = setInterval(() => {
      loadConversations(true);
      loadStats();
    }, LIST_POLL_MS);
    return () => {
      if (listPollRef.current) clearInterval(listPollRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadConversations, loadStats]);

  // ── Open a conversation ──────────────────────────────────────────────────
  async function openConversation(phone: string) {
    if (activePhone === phone) return;
    if (pollRef.current) clearInterval(pollRef.current);
    setActivePhone(phone);
    lastMsgDateRef.current = null;
    setMessages([]);
    setAgentActive(false);
    setChatError(null);
    setLoadingMsgs(true);
    setSidebarOpen(false); // mobile: show chat

    try {
      const data = await apiFetch(`conversations/${phone}?limit=60`);
      setActiveName(data.conversation?.customerName ?? phone);
      setActiveChannel(data.conversation?.channel ?? "whatsapp");
      setActiveConversationId(data.conversation?._id ?? null);
      setAgentActive(!!data.conversation?.agentActive);
      const msgs: Message[] = data.messages ?? [];
      setMessages(msgs);
      if (msgs.length) {
        lastMsgDateRef.current = new Date(msgs[msgs.length - 1].createdAt);
      }
    } catch (err: any) {
      setChatError(err.message);
    } finally {
      setLoadingMsgs(false);
    }

    markRead(phone);

    pollRef.current = setInterval(() => pollNew(phone), POLL_MS);
  }

  // ── Poll for new messages ────────────────────────────────────────────────
  async function pollNew(phone: string) {
    try {
      const since = lastMsgDateRef.current
        ? lastMsgDateRef.current.toISOString()
        : new Date(Date.now() - 5000).toISOString();
      const data = await apiFetch(
        `conversations/${phone}/poll?since=${encodeURIComponent(since)}`
      );
      const newMsgs: Message[] = data.messages ?? [];
      if (newMsgs.length) {
        setMessages((prev) => [...prev, ...newMsgs]);
        lastMsgDateRef.current = new Date(
          newMsgs[newMsgs.length - 1].createdAt
        );
        markRead(phone);
        loadConversations(true);
        loadStats();
      }
    } catch {
      /* non-fatal */
    }
  }

  // ── Mark read ────────────────────────────────────────────────────────────
  async function markRead(phone: string) {
    try {
      await apiFetch(`conversations/${phone}/read`, { method: "POST" });
      setConversations((prev) =>
        prev.map((c) =>
          c.customerPhone === phone ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch {
      /* non-fatal */
    }
  }

  // ── Scroll to bottom when messages change ────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ─────────────────────────────────────────────────────────
  async function sendMessage() {
    const text = compose.trim();
    if (!text || !activePhone || sending) return;

    setSending(true);
    setCompose("");
    if (composeRef.current) composeRef.current.style.height = "auto";

    // Optimistic
    const temp: Message = {
      _id: `temp-${Date.now()}`,
      direction: "outbound",
      type: "text",
      content: text,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, temp]);

    try {
      await apiFetch("send", {
        method: "POST",
        body: JSON.stringify({
          to: activePhone,
          message: text,
          channel: activeChannel,
          conversationId: activeConversationId,
        }),
      });
      setAgentActive(true);
      loadConversations(true);
    } catch (err: any) {
      const errMsg: Message = {
        _id: `err-${Date.now()}`,
        direction: "outbound",
        type: "error",
        content: `❌ Send failed: ${err.message}`,
        status: "failed",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  }

  // ── Auto-grow textarea ────────────────────────────────────────────────────
  function handleComposeInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setCompose(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  }

  function handleComposeKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ── Render messages with date dividers ────────────────────────────────────
  function renderMessages() {
    let lastDate = "";
    return messages.map((msg) => {
      const msgDate = new Date(msg.createdAt).toDateString();
      const showDivider = msgDate !== lastDate;
      if (showDivider) lastDate = msgDate;

      const statusInfo =
        msg.direction === "outbound"
          ? (STATUS_ICONS[msg.status] ?? STATUS_ICONS.sent)
          : null;

      const isError = msg.type === "error";

      return (
        <div key={msg._id}>
          {showDivider && (
            <div className="my-3 flex items-center justify-center">
              <span className="rounded-full bg-white/80 px-3 py-0.5 text-xs text-muted-foreground shadow-sm">
                {formatDateDivider(msg.createdAt)}
              </span>
            </div>
          )}
          <div
            className={cn(
              "flex flex-col",
              msg.direction === "outbound" ? "items-end" : "items-start"
            )}
          >
            <div
              className={cn(
                "max-w-[72%] rounded-lg px-3 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap",
                msg.direction === "outbound"
                  ? isError
                    ? "bg-red-100 text-red-700 rounded-tr-sm"
                    : "bg-[#dcf8c6] text-foreground rounded-tr-sm"
                  : "bg-white text-foreground rounded-tl-sm shadow-sm"
              )}
            >
              {msg.content || typeLabel(msg.type)}
            </div>
            <div className="mt-0.5 flex items-center gap-1 px-1 text-[10px] text-muted-foreground">
              <span>{formatBubbleTime(msg.createdAt)}</span>
              {statusInfo && (
                <span className={cn("text-[11px]", statusInfo.cls)}>
                  {statusInfo.icon}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    });
  }

  // ── JSX ────────────────────────────────────────────────────────────────
  return (
    // Fill the parent main element (fixed left-56 top-14 right-0 bottom-0)
    <div className="flex h-full w-full overflow-hidden">
      {/* ── Sidebar: conversation list ── */}
      <aside
        className={cn(
          "flex w-full flex-col border-r border-border bg-card transition-transform md:w-80 md:translate-x-0 md:flex-shrink-0",
          // Mobile: slide in/out
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "absolute inset-y-0 left-0 z-10 md:relative md:inset-auto"
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between border-b border-border bg-[#075e54] px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#25d366]" />
            <span className="font-semibold text-sm">WhatsApp Inbox</span>
          </div>
          <div className="flex items-center gap-2">
            {totalUnread > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#25d366] px-1.5 text-[10px] font-bold text-[#075e54]">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
            <button
              onClick={() => { loadConversations(); loadStats(); }}
              className="rounded p-1 hover:bg-white/15 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="border-b border-border px-3 py-2">
          <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex items-center justify-center gap-2 p-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : convError ? (
            <div className="p-4">
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">Cannot reach WhatsApp service</p>
                  <p className="text-xs mt-0.5">{convError}</p>
                  <p className="text-xs mt-1 text-red-500">
                    Is the WhatsApp Express service running? Check{" "}
                    <code className="font-mono">WHATSAPP_SERVICE_URL</code>.
                  </p>
                </div>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {search ? "No results" : "No conversations yet"}
            </div>
          ) : (
            filtered.map((conv) => {
              const isActive = conv.customerPhone === activePhone;
              return (
                <button
                  key={conv.customerPhone}
                  onClick={() => openConversation(conv.customerPhone)}
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors",
                    isActive
                      ? "bg-primary/10"
                      : "hover:bg-muted"
                  )}
                >
                  {/* Avatar */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#128c7e] text-sm font-bold text-white">
                    {initials(conv.customerName)}
                  </div>
                  {/* Body */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {conv.customerName || conv.customerPhone}
                      </span>
                      <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
                        {(conv.channel || "whatsapp")}
                      </span>
                      <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between">
                      <span className="truncate text-xs text-muted-foreground">
                        {conv.lastDirection === "outbound" ? "→ " : ""}
                        {conv.lastMessage}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="ml-2 flex h-4 min-w-[16px] shrink-0 items-center justify-center rounded-full bg-[#25d366] px-1 text-[10px] font-bold text-white">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Chat panel ── */}
      <div
        className={cn(
          "flex flex-1 flex-col bg-[#efeae2]",
          // Mobile: show only when sidebar is closed
          "absolute inset-y-0 left-0 right-0 md:relative md:inset-auto",
          sidebarOpen ? "hidden md:flex" : "flex"
        )}
      >
        {!activePhone ? (
          // Empty state
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
            <MessageSquare className="h-14 w-14 opacity-20" />
            <p className="text-base font-medium">Select a conversation</p>
            <p className="text-sm">
              Pick a contact on the left to start messaging
            </p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-border bg-[#075e54] px-4 py-3 text-white">
              {/* Mobile back button */}
              <button
                onClick={() => {
                  setSidebarOpen(true);
                  if (pollRef.current) clearInterval(pollRef.current);
                  setActivePhone(null);
                }}
                className="md:hidden rounded p-1 hover:bg-white/15 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25d366] text-sm font-bold text-[#075e54]">
                {initials(activeName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-semibold text-sm">
                  {activeName || activePhone}
                </p>
                <p className="text-xs opacity-75">
                  {activeChannel === "whatsapp" ? `+${activePhone}` : activePhone}
                </p>
              </div>
              {agentActive && (
                <span className="flex items-center gap-1 rounded-full bg-[#25d366] px-2 py-0.5 text-[10px] font-bold text-[#075e54]">
                  <User className="h-3 w-3" />
                  Agent active
                </span>
              )}
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
              {loadingMsgs ? (
                <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading messages…</span>
                </div>
              ) : chatError ? (
                <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{chatError}</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No messages yet
                </div>
              ) : (
                renderMessages()
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Compose area */}
            <div className="flex items-end gap-2 border-t border-border bg-[#f0f2f5] px-3 py-2">
              <textarea
                ref={composeRef}
                rows={1}
                placeholder="Type a message…"
                value={compose}
                onChange={handleComposeInput}
                onKeyDown={handleComposeKeyDown}
                className="flex-1 resize-none rounded-2xl border-0 bg-white px-4 py-2 text-sm outline-none placeholder:text-muted-foreground max-h-[120px] overflow-y-auto leading-relaxed"
              />
              <button
                onClick={sendMessage}
                disabled={!compose.trim() || sending}
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
                  compose.trim() && !sending
                    ? "bg-[#128c7e] text-white hover:bg-[#075e54]"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
