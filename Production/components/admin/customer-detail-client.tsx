"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPrice } from "@/lib/utils";
import { getInitials, nameToHue, formatDateForDisplay, formatDateTimeForDisplay } from "@/lib/admin-utils";
import { Mail, Plus, MessageSquare, ShoppingBag, FileText, Upload, StickyNote, Activity } from "lucide-react";

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
  corporateAccount: { companyName: string; kraPin: string | null } | null;
  quotes: QuoteRow[];
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

export function CustomerDetailClient({ data }: { data: CustomerDetailData }) {
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "quotes" | "uploads" | "notes" | "activity">("overview");
  const displayName = data.name ?? "Customer";
  const hue = nameToHue(data.email);
  const avgOrder = data.ordersCount > 0 ? data.totalSpent / data.ordersCount : 0;

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: FileText },
    { id: "orders" as const, label: "Orders", icon: ShoppingBag },
    { id: "quotes" as const, label: "Quotes", icon: FileText },
    { id: "uploads" as const, label: "Uploads", icon: Upload },
    { id: "notes" as const, label: "Notes", icon: StickyNote },
    { id: "activity" as const, label: "Activity", icon: Activity },
  ];

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
          <Button variant="outline" size="sm">
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/orders/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Link>
          </Button>
          <Button variant="outline" size="sm">
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
            <p className="text-2xl font-bold text-[#111] mt-1">{formatPrice(data.totalSpent)}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-[#E5E7EB]">
          <CardContent className="p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[#6B7280]">Avg Order Value</p>
            <p className="text-2xl font-bold text-[#111] mt-1">{data.ordersCount > 0 ? formatPrice(avgOrder) : "—"}</p>
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
                  <CardTitle className="text-[14px] font-semibold uppercase tracking-wider text-[#111]">
                    Corporate Account
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.corporateAccount ? (
                    <p className="text-sm">{data.corporateAccount.companyName}</p>
                  ) : (
                    <>
                      <p className="text-sm text-[#6B7280]">Not applied.</p>
                      <Button variant="outline" size="sm" className="mt-2">Set up corporate account</Button>
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
                    <Link href="/admin/orders/new">Create Order for this customer</Link>
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
                          <td className="px-4 py-3">{formatPrice(o.total)}</td>
                          <td className="px-4 py-3">
                            {o.payments.length === 0 ? "—" : o.payments.map((p) => `${p.provider} ${formatPrice(p.amount)}`).join(", ")}
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
              {data.quotes.length === 0 ? (
                <p className="py-12 text-center text-[#6B7280]">No quotes yet</p>
              ) : (
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
                          <td className="px-4 py-3">{q.estimatedCost != null ? formatPrice(q.estimatedCost) : "—"}</td>
                          <td className="px-4 py-3"><Badge variant="secondary">{QUOTE_STATUS_LABELS[q.status] ?? q.status}</Badge></td>
                          <td className="px-4 py-3 text-[#6B7280]">{formatDateForDisplay(q.createdAt)}</td>
                          <td className="px-4 py-3"><Button variant="ghost" size="sm">View</Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
