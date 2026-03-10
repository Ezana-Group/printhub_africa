"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { ShoppingCart, Printer, FileText } from "lucide-react";

export type OrderType = "SHOP" | "CUSTOM_PRINT" | "LARGE_FORMAT" | "THREE_D_PRINT" | "QUOTE";

type OrderRow = {
  id: string;
  orderNumber: string;
  type: OrderType;
  status: string;
  total: number;
  createdAt: string;
  user?: { name: string | null; email: string } | null;
  payments: { status: string }[];
};

const ORDER_TYPE_CONFIG: Record<OrderType, { label: string; variant: "secondary" | "default" | "outline" | "destructive"; icon?: React.ComponentType<{ className?: string }> }> = {
  SHOP: { label: "Shop", variant: "secondary", icon: ShoppingCart },
  LARGE_FORMAT: { label: "Large Format", variant: "default", icon: Printer },
  THREE_D_PRINT: { label: "3D Print", variant: "outline", icon: Printer },
  CUSTOM_PRINT: { label: "3D Print", variant: "outline", icon: Printer },
  QUOTE: { label: "Quote", variant: "secondary", icon: FileText },
};

function OrderTypeBadge({ type }: { type: OrderType }) {
  const config = ORDER_TYPE_CONFIG[type] ?? { label: type, variant: "secondary" as const };
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="gap-1">
      {Icon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}

export function OrdersListClient({
  orders,
  counts,
}: {
  orders: OrderRow[];
  counts: { all: number; shop: number; printJobs: number; quotes: number };
}) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "all";

  const tabs = [
    { id: "all", label: "All Orders", count: counts.all },
    { id: "shop", label: "Shop", count: counts.shop },
    { id: "print-jobs", label: "Print Jobs", count: counts.printJobs },
    { id: "quotes", label: "Quotes", count: counts.quotes },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-border flex-wrap">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={t.id === "all" ? "/admin/orders" : `/admin/orders?tab=${t.id}`}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            <span className="text-muted-foreground">({t.count})</span>
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium">Order #</th>
                  <th className="text-left p-4 font-medium">Type</th>
                  <th className="text-left p-4 font-medium">Customer</th>
                  <th className="text-left p-4 font-medium">Total</th>
                  <th className="text-left p-4 font-medium">Payment</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b hover:bg-muted/30">
                    <td className="p-4 font-mono">{o.orderNumber}</td>
                    <td className="p-4">
                      <OrderTypeBadge type={o.type} />
                    </td>
                    <td className="p-4">{o.user?.name ?? o.user?.email ?? "Guest"}</td>
                    <td className="p-4">{formatPrice(o.total)}</td>
                    <td className="p-4">
                      <Badge variant={o.payments[0]?.status === "COMPLETED" ? "default" : "secondary"}>
                        {o.payments[0]?.status ?? "—"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={o.status === "PENDING" ? "destructive" : "outline"}>{o.status}</Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">{o.createdAt}</td>
                    <td className="p-4">
                      <Link href={`/admin/orders/${o.id}`} className="text-primary hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && (
            <p className="p-8 text-center text-muted-foreground">No orders in this category</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
