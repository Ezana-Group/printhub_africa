"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { FinanceBusinessCostsForm } from "./finance-business-costs-form";

type PaymentRow = {
  id: string;
  orderNumber: string;
  provider: string;
  amount: number;
  status: string;
  createdAt: string;
};

export function FinanceTabs({
  payments,
  totalRevenue,
  orderCount,
  totalOrderValue,
  deliveredValue,
}: {
  payments: PaymentRow[];
  totalRevenue: number;
  orderCount: number;
  totalOrderValue: number;
  deliveredValue: number;
}) {
  const [tab, setTab] = useState<"business-costs" | "revenue">("business-costs");
  const hasPayments = payments.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-border">
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

      {tab === "business-costs" && <FinanceBusinessCostsForm />}

      {tab === "revenue" && (
        <>
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
                        <th className="text-left p-4 font-medium">Provider</th>
                        <th className="text-left p-4 font-medium">Amount</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className="border-b hover:bg-muted/30">
                          <td className="p-4 font-mono">
                            <Link href={`/admin/orders?q=${p.orderNumber}`} className="text-primary hover:underline">
                              {p.orderNumber}
                            </Link>
                          </td>
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
                  <p className="text-muted-foreground mb-2">No payment transactions yet.</p>
                  <p className="text-sm text-muted-foreground">
                    Payments appear here when customers pay for orders. Check{" "}
                    <Link href="/admin/orders" className="text-primary hover:underline">Orders</Link> to see order totals and status.
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
