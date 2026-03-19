"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/admin/email/rich-text-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatKES } from "@/lib/utils";
import { getInitials, nameToHue, formatDateForDisplay, formatDateTimeForDisplay } from "@/lib/admin-utils";
import { Mail, Plus, MessageSquare, ShoppingBag, FileText, Upload, StickyNote, Activity, Building2 } from "lucide-react";

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: Date;
  payments: { provider: string; amount: number; status: string }[];
  refunds: { amount: number; status: string; reason: string | null }[];
};

type QuoteRow = {
  id: string;
  status: string;
  estimatedCost: number | null;
  createdAt: Date;
  validUntil: Date | null;
};

type GetAQuoteRow = {
  id: string;
  quoteNumber: string;
  type: string;
  status: string;
  quotedAmount: number | null;
  createdAt: Date;
  projectName: string | null;
};

type UploadRow = {
  id: string;
  originalName: string;
  fileType: string;
  status: string;
  createdAt: Date;
  url: string;
};

type AuditRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  timestamp: Date;
};

type CustomerEmailMessage = {
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
};

type CustomerEmailThread = {
  id: string;
  subject: string;
  status: "OPEN" | "CLOSED" | "SPAM";
  hasUnread: boolean;
  updatedAt: string;
  mailbox: { id: string; label: string; address: string };
  emails: CustomerEmailMessage[];
};

type CustomerEmailApiResponse = {
  customer: { id: string; name: string | null; email: string };
  threads: CustomerEmailThread[];
  mailboxes: { id: string; label: string; address: string }[];
};

export type CustomerDetailData = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: Date;
  emailVerified: Date | null;
  preferredLanguage: string | null;
  loyaltyPoints: number;
  orders: OrderRow[];
  ordersCount: number;
  totalSpent: number;
  totalRefunded: number;
  addresses: { id: string; label: string; street: string; city: string }[];
  corporateAccount: {
    id: string;
    accountNumber: string;
    companyName: string;
    tradingName: string | null;
    tier: string;
    status: string;
    discountPercent: number;
    creditLimit: number;
    creditUsed: number;
    paymentTerms: string;
    kraPin: string;
    industry: string;
  } | null;
  corporateRole: string | null;
  quotes: QuoteRow[];
  getAQuoteQuotes: GetAQuoteRow[];
  uploads: UploadRow[];
  auditLogs: AuditRow[];
};

const QUOTE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  EXPIRED: "Expired",
  REJECTED: "Rejected",
};

const GET_A_QUOTE_STATUS_LABELS: Record<string, string> = {
  new: "New",
  reviewing: "Under review",
  quoted: "Quoted",
  accepted: "Accepted",
  rejected: "Rejected",
  in_production: "In production",
  completed: "Completed",
  cancelled: "Cancelled",
};

const QUOTE_TYPE_LABELS: Record<string, string> = {
  large_format: "Large Format",
  three_d_print: "3D Print",
  design_and_print: "I have an idea",
};

export function CustomerDetailClient({ data }: { data: CustomerDetailData }) {
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "quotes" | "uploads" | "email" | "notes" | "activity">("overview");
  const displayName = data.name ?? "Customer";
  const hue = nameToHue(data.email);
  const avgOrder = data.ordersCount > 0 ? data.totalSpent / data.ordersCount : 0;

  const [emailData, setEmailData] = useState<CustomerEmailApiResponse | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [composeSubject, setComposeSubject] = useState(`Regarding your account at PrintHub`);
  const [composeCc, setComposeCc] = useState("");
  const [composeBodyHtml, setComposeBodyHtml] = useState("<p>Hi,</p><p></p><p>Best regards,<br/>PrintHub Team</p>");
  const [composeMailboxId, setComposeMailboxId] = useState("");

  const draftKey = `customer-email-draft:${data.id}`;

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: FileText },
    { id: "orders" as const, label: "Orders", icon: ShoppingBag },
    { id: "quotes" as const, label: "Quotes", icon: FileText },
    { id: "uploads" as const, label: "Uploads", icon: Upload },
    { id: "email" as const, label: "Email", icon: Mail },
    { id: "notes" as const, label: "Notes", icon: StickyNote },
    { id: "activity" as const, label: "Activity", icon: Activity },
  ];

  useEffect(() => {
    if (activeTab !== "email") return;
    let cancelled = false;
    const run = async () => {
      setEmailLoading(true);
      setEmailError(null);
      try {
        const res = await fetch(`/api/admin/customers/${data.id}/emails`);
        const body = (await res.json().catch(() => null)) as CustomerEmailApiResponse | null;
        if (!res.ok || !body) {
          if (!cancelled) setEmailError("Failed to load customer email threads.");
          return;
        }
        if (cancelled) return;
        setEmailData(body);
        if (!selectedThreadId && body.threads[0]?.id) setSelectedThreadId(body.threads[0].id);
        if (!composeMailboxId && body.mailboxes[0]?.id) setComposeMailboxId(body.mailboxes[0].id);
      } catch {
        if (!cancelled) setEmailError("Failed to load customer email threads.");
      } finally {
        if (!cancelled) setEmailLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [activeTab, data.id, selectedThreadId, composeMailboxId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        subject?: string;
        cc?: string;
        bodyHtml?: string;
        mailboxId?: string;
      };
      if (parsed.subject) setComposeSubject(parsed.subject);
      if (parsed.cc) setComposeCc(parsed.cc);
      if (parsed.bodyHtml) setComposeBodyHtml(parsed.bodyHtml);
      if (parsed.mailboxId) setComposeMailboxId(parsed.mailboxId);
    } catch {
      // ignore draft parse issues
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.id]);

  useEffect(() => {
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          subject: composeSubject,
          cc: composeCc,
          bodyHtml: composeBodyHtml,
          mailboxId: composeMailboxId || undefined,
        })
      );
    } catch {
      // ignore localStorage write issues
    }
  }, [draftKey, composeSubject, composeCc, composeBodyHtml, composeMailboxId]);

  const selectedThread = useMemo(
    () => emailData?.threads.find((t) => t.id === selectedThreadId) ?? null,
    [emailData, selectedThreadId]
  );

  const handleSendCustomerEmail = async () => {
    if (!composeBodyHtml.trim()) return;
    setSendingEmail(true);
    setEmailError(null);
    try {
      const res = await fetch(`/api/admin/customers/${data.id}/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: selectedThread?.id ?? undefined,
          subject: composeSubject,
          bodyHtml: composeBodyHtml,
          cc: composeCc.trim() ? composeCc.trim() : undefined,
          fromAddressId: composeMailboxId || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEmailError(body.error ?? "Failed to send email.");
        return;
      }

      const refreshed = await fetch(`/api/admin/customers/${data.id}/emails`);
      const refreshedBody = (await refreshed.json().catch(() => null)) as CustomerEmailApiResponse | null;
      if (refreshed.ok && refreshedBody) {
        setEmailData(refreshedBody);
        const nextThreadId =
          typeof body.threadId === "string"
            ? body.threadId
            : refreshedBody.threads[0]?.id ?? null;
        setSelectedThreadId(nextThreadId);
      }
    } catch {
      setEmailError("Failed to send email.");
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="px-4 py-4 md:px-8 md:py-6">
      <AdminBreadcrumbs
        items={[
          { label: "Customers", href: "/admin/customers" },
          { label: displayName },
        ]}
      />

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className="h-12 w-12 rounded-full shrink-0 flex items-center justify-center text-white text-lg font-semibold"
            style={{ backgroundColor: `hsl(${hue}, 60%, 45%)` }}
          >
            {getInitials(data.name)}
          </div>
          <div>
            <h1 className="text-[24px] font-bold text-[#111]">{displayName}</h1>
            <p className="text-[14px] text-[#6B7280]">{data.email}</p>
            <p className="text-[13px] text-[#6B7280]">
              Joined {new Date(data.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SelectStatus />
          <Button variant="outline" size="sm" onClick={() => setActiveTab("email")}>
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link
              href={
                data.corporateAccount
                  ? `/admin/orders/new?customerId=${data.id}&corporateId=${data.corporateAccount.id}`
                  : `/admin/orders/new?customerId=${data.id}`
              }
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Order
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveTab("notes")}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Add Note
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">More</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Export data</DropdownMenuItem>
              <DropdownMenuItem>Mark as VIP</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete account</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Card className="bg-white border-[#E5E7EB]">
          <CardContent className="p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[#6B7280]">Total Orders</p>
            <p className="text-2xl font-bold text-[#111] mt-1">{data.ordersCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-[#E5E7EB]">
          <CardContent className="p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[#6B7280]">Total Spent</p>
            <p className="text-2xl font-bold text-[#111] mt-1">{formatKES(data.totalSpent)}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-[#E5E7EB]">
          <CardContent className="p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[#6B7280]">Avg Order Value</p>
            <p className="text-2xl font-bold text-[#111] mt-1">{data.ordersCount > 0 ? formatKES(avgOrder) : "—"}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-[#E5E7EB]">
          <CardContent className="p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[#6B7280]">Loyalty Points</p>
            <p className="text-2xl font-bold text-[#111] mt-1">{data.loyaltyPoints} pts</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex border-b border-[#E5E7EB] gap-1 mt-8 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-[#6B7280] hover:text-[#111]"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "overview" && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card className="bg-white border-[#E5E7EB]">
                <CardHeader>
                  <CardTitle className="text-[14px] font-semibold uppercase tracking-wider text-[#111]">
                    Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Full Name</span>
                    <span className="text-[#111]">{data.name ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Email</span>
                    <span className="text-[#111]">{data.email} {data.emailVerified ? "✓ Verified" : ""}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Phone</span>
                    <span className="text-[#111]">{data.phone ?? "—"}</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-[#E5E7EB]">
                <CardHeader>
                  <CardTitle className="text-[14px] font-semibold uppercase tracking-wider text-[#111]">
                    Addresses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.addresses.length === 0 ? (
                    <p className="text-sm text-[#6B7280]">No saved addresses.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {data.addresses.map((a) => (
                        <li key={a.id}>{a.label}: {a.street}, {a.city}</li>
                      ))}
                    </ul>
                  )}
                  <Button variant="outline" size="sm" className="mt-2">Add Address</Button>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card className="bg-white border-[#E5E7EB]">
                <CardHeader>
                  <CardTitle className="text-[14px] font-semibold uppercase tracking-wider text-[#111]">
                    Account Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-[#6B7280]">Status</span><span>Active</span></div>
                  <div className="flex justify-between"><span className="text-[#6B7280]">Role</span><span>Customer</span></div>
                  <div className="flex justify-between"><span className="text-[#6B7280]">Joined</span><span>{formatDateForDisplay(data.createdAt)}</span></div>
                  <div className="flex justify-between"><span className="text-[#6B7280]">Last order</span><span>{data.ordersCount === 0 ? "Never" : "—"}</span></div>
                </CardContent>
              </Card>
              <Card className="bg-white border-[#E5E7EB]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[14px] font-semibold uppercase tracking-wider text-[#111]">
                      Corporate Account
                    </CardTitle>
                    {data.corporateAccount && (
                      <Link
                        href={`/admin/corporate/${data.corporateAccount.id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        View account →
                      </Link>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {data.corporateAccount ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {data.corporateAccount.companyName}
                          </p>
                          <p className="text-xs font-mono text-muted-foreground">
                            {data.corporateAccount.accountNumber}
                          </p>
                        </div>
                        <span
                          className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${getTierBadgeClass(data.corporateAccount.tier)}`}
                        >
                          {data.corporateAccount.tier}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-border/50 py-2 text-xs">
                        <span className="text-muted-foreground">Role</span>
                        <span className="font-medium">{data.corporateRole ?? "MEMBER"}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-border/50 py-2 text-xs">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="font-medium text-primary">
                          {data.corporateAccount.discountPercent > 0
                            ? `${data.corporateAccount.discountPercent}% off`
                            : "None"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-border/50 py-2 text-xs">
                        <span className="text-muted-foreground">Payment terms</span>
                        <span className="font-medium">{data.corporateAccount.paymentTerms}</span>
                      </div>
                      {data.corporateAccount.creditLimit > 0 && (
                        <div className="border-t border-border/50 pt-3">
                          <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                            <span>Credit used</span>
                            <span>
                              {formatKES(data.corporateAccount.creditUsed)} /{" "}
                              {formatKES(data.corporateAccount.creditLimit)}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full transition-all ${getCreditBarColor(
                                data.corporateAccount.creditUsed,
                                data.corporateAccount.creditLimit
                              )}`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.round(
                                    (data.corporateAccount.creditUsed /
                                      data.corporateAccount.creditLimit) *
                                      100
                                )
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 border-t border-border/50 pt-3">
                        <Link
                          href={`/admin/corporate/${data.corporateAccount.id}`}
                          className="flex-1 rounded-lg border border-border py-1.5 text-center text-xs text-muted-foreground hover:bg-muted"
                        >
                          Full account
                        </Link>
                        <Link
                          href={`/admin/corporate/${data.corporateAccount.id}?tab=invoices`}
                          className="flex-1 rounded-lg border border-border py-1.5 text-center text-xs text-muted-foreground hover:bg-muted"
                        >
                          Invoices
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">Not applied.</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Set up corporate account
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <Card className="bg-white border-[#E5E7EB]">
            <CardContent className="p-0">
              {data.orders.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-[#6B7280]">No orders yet</p>
                  <Button asChild className="mt-2">
                    <Link
                      href={
                        data.corporateAccount
                          ? `/admin/orders/new?customerId=${data.id}&corporateId=${data.corporateAccount.id}`
                          : `/admin/orders/new?customerId=${data.id}`
                      }
                    >
                      Create Order for this customer
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#F3F4F6] border-b border-[#E5E7EB] sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280] uppercase">Order #</th>
                        <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280] uppercase">Status</th>
                        <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280] uppercase">Total</th>
                        <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280] uppercase">Payments</th>
                        <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280] uppercase">Date</th>
                        <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280] uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.orders.map((o) => (
                        <tr key={o.id} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB]">
                          <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                          <td className="px-4 py-3">{o.status}</td>
                          <td className="px-4 py-3">{formatKES(o.total)}</td>
                          <td className="px-4 py-3">
                            {o.payments.length === 0 ? "—" : o.payments.map((p) => `${p.provider} ${formatKES(p.amount)}`).join(", ")}
                          </td>
                          <td className="px-4 py-3 text-[#6B7280]">{formatDateTimeForDisplay(o.createdAt)}</td>
                          <td className="px-4 py-3">
                            <Link href={`/admin/orders/${o.id}`} className="text-primary hover:underline">View</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "quotes" && (
          <Card className="bg-white border-[#E5E7EB]">
            <CardContent className="p-0">
              {data.getAQuoteQuotes.length === 0 && data.quotes.length === 0 ? (
                <p className="py-12 text-center text-[#6B7280]">No quotes yet</p>
              ) : (
                <div className="space-y-6 p-4">
                  {data.getAQuoteQuotes.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#374151] mb-2">Quote requests (Get a Quote / I have an idea)</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-[#F3F4F6] border-b border-[#E5E7EB]">
                            <tr>
                              <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280] uppercase">Quote #</th>
                              <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280] uppercase">Type</th>
                              <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280] uppercase">Amount</th>
                              <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280] uppercase">Status</th>
                              <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280] uppercase">Created</th>
                              <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280] uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.getAQuoteQuotes.map((q) => (
                              <tr key={q.id} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB]">
                                <td className="px-4 py-3 font-mono font-medium">{q.quoteNumber}</td>
                                <td className="px-4 py-3 text-[#6B7280]">{QUOTE_TYPE_LABELS[q.type] ?? q.type}</td>
                                <td className="px-4 py-3">{q.quotedAmount != null ? formatKES(q.quotedAmount) : "—"}</td>
                                <td className="px-4 py-3"><Badge variant="secondary">{GET_A_QUOTE_STATUS_LABELS[q.status] ?? q.status.replace("_", " ")}</Badge></td>
                                <td className="px-4 py-3 text-[#6B7280]">{formatDateForDisplay(q.createdAt)}</td>
                                <td className="px-4 py-3">
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/admin/quotes/${q.id}`}>View</Link>
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {data.quotes.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#374151] mb-2">Print quotes</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-[#F3F4F6] border-b border-[#E5E7EB]">
                            <tr>
                              <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280] uppercase">Quote #</th>
                              <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280] uppercase">Amount</th>
                              <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280] uppercase">Status</th>
                              <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280] uppercase">Created</th>
                              <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280] uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.quotes.map((q) => (
                              <tr key={q.id} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB]">
                                <td className="px-4 py-3 font-mono">{q.id.slice(-8)}</td>
                                <td className="px-4 py-3">{q.estimatedCost != null ? formatKES(q.estimatedCost) : "—"}</td>
                                <td className="px-4 py-3"><Badge variant="secondary">{QUOTE_STATUS_LABELS[q.status] ?? q.status}</Badge></td>
                                <td className="px-4 py-3 text-[#6B7280]">{formatDateForDisplay(q.createdAt)}</td>
                                <td className="px-4 py-3"><Button variant="ghost" size="sm">View</Button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "uploads" && (
          <Card className="bg-white border-[#E5E7EB]">
            <CardContent className="p-0">
              {data.uploads.length === 0 ? (
                <p className="py-12 text-center text-[#6B7280]">No uploads yet</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4">
                  {data.uploads.map((u) => (
                    <div key={u.id} className="border border-[#E5E7EB] rounded-lg p-3">
                      <p className="text-sm font-medium truncate">{u.originalName}</p>
                      <p className="text-xs text-[#6B7280]">{u.fileType} · {formatDateForDisplay(u.createdAt)}</p>
                      <Badge variant="secondary" className="mt-2 text-xs">{u.status}</Badge>
                      <div className="mt-2 flex gap-1">
                        <Button variant="outline" size="sm" asChild><a href={u.url} download>Download</a></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "email" && (
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
            <Card className="bg-white border-[#E5E7EB]">
              <CardHeader>
                <CardTitle className="text-[14px] font-semibold uppercase tracking-wider text-[#111]">
                  Correspondence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto">
                {emailLoading ? (
                  <p className="text-sm text-muted-foreground">Loading emails...</p>
                ) : emailData?.threads.length ? (
                  emailData.threads.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedThreadId(t.id)}
                      className={`w-full rounded-md border p-3 text-left transition-colors ${
                        selectedThreadId === t.id ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{t.subject}</p>
                        <Badge variant="outline" className="shrink-0">
                          {t.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t.mailbox.label} · {new Date(t.updatedAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No email threads yet for this customer.</p>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="bg-white border-[#E5E7EB]">
                <CardHeader>
                  <CardTitle className="text-[14px] font-semibold uppercase tracking-wider text-[#111]">
                    Thread messages
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {selectedThread?.emails?.length ? (
                    selectedThread.emails.map((m) => (
                      <div
                        key={m.id}
                        className={`rounded-md border p-3 ${m.direction === "INBOUND" ? "bg-slate-50" : "bg-primary/5 border-primary/20"}`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p className="text-xs font-medium">
                            {m.direction === "INBOUND" ? m.fromAddress : m.toAddress}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(m.sentAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                        </div>
                        <div
                          className="prose prose-sm max-w-none break-words"
                          dangerouslySetInnerHTML={{ __html: m.bodyHtml ?? "" }}
                        />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {selectedThread ? "No messages in this thread yet." : "Select a thread to view correspondence."}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white border-[#E5E7EB]">
                <CardHeader>
                  <CardTitle className="text-[14px] font-semibold uppercase tracking-wider text-[#111]">
                    Compose email
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {emailError && <p className="text-sm text-red-600">{emailError}</p>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">From mailbox</label>
                      <select
                        value={composeMailboxId}
                        onChange={(e) => setComposeMailboxId(e.target.value)}
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm w-full"
                      >
                        <option value="">Select mailbox</option>
                        {(emailData?.mailboxes ?? []).map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label} ({m.address})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">CC</label>
                      <Input
                        value={composeCc}
                        onChange={(e) => setComposeCc(e.target.value)}
                        placeholder="name@domain.com, other@domain.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Subject</label>
                    <Input
                      value={composeSubject}
                      onChange={(e) => setComposeSubject(e.target.value)}
                      placeholder="Subject"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Message</label>
                    <RichTextEditor
                      value={composeBodyHtml}
                      onChange={setComposeBodyHtml}
                      placeholder="Write your message…"
                    />
                    <p className="text-xs text-muted-foreground">Draft is auto-saved locally in your browser.</p>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSendCustomerEmail}
                      disabled={sendingEmail || !composeBodyHtml.trim() || !composeMailboxId}
                    >
                      {sendingEmail ? "Sending..." : "Send email"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "notes" && (
          <Card className="bg-white border-[#E5E7EB]">
            <CardContent className="p-4">
              <p className="text-sm text-[#6B7280]">Internal staff notes (customer never sees these).</p>
              <Button className="mt-4">Add Note</Button>
              <p className="mt-4 text-sm text-[#6B7280]">No notes yet.</p>
            </CardContent>
          </Card>
        )}

        {activeTab === "activity" && (
          <Card className="bg-white border-[#E5E7EB]">
            <CardContent className="p-0">
              {data.auditLogs.length === 0 ? (
                <p className="py-12 text-center text-[#6B7280]">No activity yet</p>
              ) : (
                <ul className="divide-y divide-[#E5E7EB]">
                  {data.auditLogs.map((log) => (
                    <li key={log.id} className="px-4 py-3 flex items-start gap-3 text-sm">
                      <span className="text-[#6B7280] shrink-0">{formatDateTimeForDisplay(log.timestamp)}</span>
                      <span><span className="font-medium">{log.action}</span> {log.entity} {log.entityId ?? ""}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function getTierBadgeClass(tier: string): string {
  const map: Record<string, string> = {
    STANDARD: "bg-muted text-muted-foreground",
    SILVER: "bg-slate-100 text-slate-700",
    GOLD: "bg-amber-50 text-amber-700",
    PLATINUM: "bg-purple-50 text-purple-700",
  };
  return map[tier] ?? "bg-muted text-muted-foreground";
}

function getCreditBarColor(used: number, limit: number): string {
  const pct = limit > 0 ? (used / limit) * 100 : 0;
  if (pct >= 80) return "bg-destructive";
  if (pct >= 60) return "bg-amber-400";
  return "bg-green-500";
}

function SelectStatus() {
  return (
    <select
      className="h-9 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#111]"
      defaultValue="active"
    >
      <option value="active">Active</option>
      <option value="suspended">Suspended</option>
      <option value="banned">Banned</option>
    </select>
  );
}
