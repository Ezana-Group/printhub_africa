"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { FinanceBusinessCostsForm } from "./finance-business-costs-form";
import { ShoppingCart, Printer, Handshake } from "lucide-react";

type PaymentRow = {
  id: string;
  orderNumber: string;
  orderType: string;
  provider: string;
  amount: number;
  status: string;
  createdAt: string;
};

type RevenueByLine = { shop: number; printServices: number; corporate: number };
type CountsByLine = { shop: number; printServices: number; corporate: number };

export function FinanceTabs({
  payments,
  totalRevenue,
  orderCount,
  totalOrderValue,
  deliveredValue,
  revenueByLine = { shop: 0, printServices: 0, corporate: 0 },
  countsByLine = { shop: 0, printServices: 0, corporate: 0 },
  canEditFinance = true,
}: {
  payments: PaymentRow[];
  totalRevenue: number;
  orderCount: number;
  totalOrderValue: number;
  deliveredValue: number;
  revenueByLine?: RevenueByLine;
  countsByLine?: CountsByLine;
  canEditFinance?: boolean;
}) {
  const [tab, setTab] = useState<"overview" | "business-costs" | "revenue">("overview");
  const [revenueFilter, setRevenueFilter] = useState<"all" | "shop" | "print" | "corporate">("all");

  const filteredPayments =
    revenueFilter === "all"
      ? payments
      : revenueFilter === "shop"
        ? payments.filter((p) => p.orderType === "SHOP")
        : revenueFilter === "print"
          ? payments.filter((p) => ["LARGE_FORMAT", "THREE_D_PRINT", "CUSTOM_PRINT"].includes(p.orderType))
          : payments.filter((p) => p.orderType === "QUOTE");

  const hasPayments = filteredPayments.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-border flex-wrap">
        <button
          type="button"
          onClick={() => setTab("overview")}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "overview" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setTab("business-costs")}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "business-costs" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Business costs
        </button>
        <button
          type="button"
          onClick={() => setTab("revenue")}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "revenue" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Revenue
        </button>
      </div>

      {tab === "overview" && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold text-sm text-muted-foreground">Shop</h2>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatPrice(revenueByLine.shop)}</p>
                <p className="text-xs text-muted-foreground mt-1">{countsByLine.shop} orders this month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <Printer className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold text-sm text-muted-foreground">Print services</h2>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatPrice(revenueByLine.printServices)}</p>
                <p className="text-xs text-muted-foreground mt-1">{countsByLine.printServices} jobs this month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <Handshake className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold text-sm text-muted-foreground">Corporate</h2>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatPrice(revenueByLine.corporate)}</p>
                <p className="text-xs text-muted-foreground mt-1">{countsByLine.corporate} invoices this month</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Total revenue (this month): <strong className="text-foreground">{formatPrice(totalRevenue)}</strong>
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {tab === "business-costs" && <FinanceBusinessCostsForm canEdit={canEditFinance} />}

      {tab === "revenue" && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="revenue-filter-select" className="text-sm text-muted-foreground">Filter:</label>
            <select
              id="revenue-filter-select"
              value={revenueFilter}
              onChange={(e) => setRevenueFilter(e.target.value as typeof revenueFilter)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            >
              <option value="all">All lines</option>
              <option value="shop">Shop only</option>
              <option value="print">Print services only</option>
              <option value="corporate">Corporate only</option>
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-sm text-muted-foreground">Total revenue (paid)</h2>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p>
                <p className="text-xs text-muted-foreground mt-1">From completed payments</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-sm text-muted-foreground">Orders</h2>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{orderCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total value {formatPrice(totalOrderValue)} · Delivered {formatPrice(deliveredValue)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-sm text-muted-foreground">Transactions</h2>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{payments.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Payment records (last 50)</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h2 className="font-semibold">Recent transactions</h2>
            </CardHeader>
            <CardContent className="p-0">
              {hasPayments ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-medium">Order</th>
                        <th className="text-left p-4 font-medium">Type</th>
                        <th className="text-left p-4 font-medium">Provider</th>
                        <th className="text-left p-4 font-medium">Amount</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((p) => (
                        <tr key={p.id} className="border-b hover:bg-muted/30">
                          <td className="p-4 font-mono">
                            <Link href={`/admin/orders?q=${p.orderNumber}`} className="text-primary hover:underline">
                              {p.orderNumber}
                            </Link>
                          </td>
                          <td className="p-4 text-muted-foreground">{p.orderType}</td>
                          <td className="p-4">{p.provider}</td>
                          <td className="p-4">{formatPrice(p.amount)}</td>
                          <td className="p-4">{p.status}</td>
                          <td className="p-4 text-muted-foreground">{p.createdAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground mb-2">No payment transactions in this filter.</p>
                  <p className="text-sm text-muted-foreground">
                    Change the filter or check{" "}
                    <Link href="/admin/orders" className="text-primary hover:underline">Orders</Link>.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
