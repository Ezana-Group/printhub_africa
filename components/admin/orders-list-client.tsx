"use client";

import { useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPrice } from "@/lib/utils";
import { ShoppingCart, Printer, FileText, ShoppingBag, Download } from "lucide-react";
import { TableToolbar, type FilterConfig } from "@/components/admin/ui/TableToolbar";
import { TablePagination } from "@/components/admin/ui/TablePagination";
import { TableEmptyState } from "@/components/admin/ui/TableEmptyState";
import { useTableUrlState } from "@/hooks/useTableUrlState";

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
  CUSTOM_PRINT: { label: "Custom Print", variant: "outline", icon: Printer },
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

const STATUS_OPTIONS = [
  "PENDING", "CONFIRMED", "PROCESSING", "PRINTING", "QUALITY_CHECK",
  "READY_FOR_COLLECTION", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED",
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    PROCESSING: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
    SHIPPED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    REFUNDED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  };
  const c = map[status] ?? "bg-muted text-muted-foreground";
  return <Badge variant="secondary" className={c}>{status.replace(/_/g, " ")}</Badge>;
}

export function OrdersListClient({
  orders: initialOrders,
  counts,
  kpis = { totalOrders: 0, revenue: 0, pending: 0, thisMonthRevenue: 0 },
}: {
  orders: OrderRow[];
  counts: { all: number; shop: number; printJobs: number; quotes: number };
  kpis?: { totalOrders: number; revenue: number; pending: number; thisMonthRevenue: number };
}) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "all";
  const url = useTableUrlState({ defaultPerPage: 25 });
  const statusFilter = url.get("status", "");
  const paymentFilter = url.get("payment", "");
  const amountFilter = url.get("amount", "");

  const filteredAndSorted = useMemo(() => {
    let list = [...initialOrders];
    const q = url.q.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          (o.user?.name?.toLowerCase().includes(q)) ||
          (o.user?.email?.toLowerCase().includes(q))
      );
    }
    if (statusFilter) list = list.filter((o) => o.status === statusFilter);
    if (paymentFilter) list = list.filter((o) => (o.payments[0]?.status ?? "") === paymentFilter);
    if (amountFilter === "under1k") list = list.filter((o) => o.total < 1000);
    else if (amountFilter === "1k-5k") list = list.filter((o) => o.total >= 1000 && o.total <= 5000);
    else if (amountFilter === "5k-20k") list = list.filter((o) => o.total > 5000 && o.total <= 20000);
    else if (amountFilter === "over20k") list = list.filter((o) => o.total > 20000);
    const field = url.sort || "createdAt";
    const dir = url.dir === "desc" ? 1 : -1;
    list.sort((a, b) => {
      if (field === "createdAt") return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      if (field === "total") return dir * (a.total - b.total);
      return 0;
    });
    return list;
  }, [initialOrders, url.q, statusFilter, paymentFilter, amountFilter, url.sort, url.dir]);

  const paginated = useMemo(() => {
    const start = (url.page - 1) * url.perPage;
    return filteredAndSorted.slice(start, start + url.perPage);
  }, [filteredAndSorted, url.page, url.perPage]);

  const filters: FilterConfig[] = useMemo(
    () => [
      {
        key: "status",
        label: "Status",
        options: [{ value: "", label: "All" }, ...STATUS_OPTIONS.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))],
        value: statusFilter,
        onChange: (v) => url.set({ status: v || undefined, page: 1 }),
      },
      {
        key: "payment",
        label: "Payment",
        options: [
          { value: "", label: "All" },
          { value: "COMPLETED", label: "Paid" },
          { value: "PENDING", label: "Pending" },
          { value: "FAILED", label: "Failed" },
          { value: "REFUNDED", label: "Refunded" },
        ],
        value: paymentFilter,
        onChange: (v) => url.set({ payment: v || undefined, page: 1 }),
      },
      {
        key: "amount",
        label: "Amount",
        options: [
          { value: "", label: "Any" },
          { value: "under1k", label: "Under KES 1K" },
          { value: "1k-5k", label: "KES 1K–5K" },
          { value: "5k-20k", label: "KES 5K–20K" },
          { value: "over20k", label: "Over KES 20K" },
        ],
        value: amountFilter,
        onChange: (v) => url.set({ amount: v || undefined, page: 1 }),
      },
    ],
    [statusFilter, paymentFilter, amountFilter, url]
  );

  const hasActiveFilters = url.q !== "" || statusFilter !== "" || paymentFilter !== "" || amountFilter !== "";

  const tabs = [
    { id: "all", label: "All Orders", count: counts.all },
    { id: "shop", label: "Shop", count: counts.shop },
    { id: "print-jobs", label: "Print Jobs", count: counts.printJobs },
    { id: "quotes", label: "Quotes", count: counts.quotes },
  ];

  const exportCsv = useCallback(() => {
    const csv = ["Order #,Type,Customer,Total,Payment,Status,Date"];
    filteredAndSorted.forEach((o) => {
      csv.push([o.orderNumber, o.type, o.user?.name ?? o.user?.email ?? "Guest", o.total, o.payments[0]?.status ?? "", o.status, o.createdAt].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","));
    });
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "orders-export.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }, [filteredAndSorted]);

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Total Orders</p>
            <p className="text-xl font-semibold">{kpis.totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="text-xl font-semibold">{formatPrice(kpis.revenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-xl font-semibold">{kpis.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">This Month</p>
            <p className="text-xl font-semibold">{formatPrice(kpis.thisMonthRevenue)}</p>
          </CardContent>
        </Card>
      </div>

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

      <TableToolbar
        searchPlaceholder="Search by order #, customer name, email..."
        searchValue={url.q}
        onSearch={url.setSearch}
        filters={filters}
        sortOptions={[{ label: "Date", value: "createdAt" }, { label: "Total", value: "total" }]}
        currentSort={url.sort || "createdAt"}
        currentSortDir={url.dir}
        onSortChange={url.setSort}
        totalCount={initialOrders.length}
        filteredCount={filteredAndSorted.length}
        onClearFilters={url.clearFilters}
        hasActiveFilters={hasActiveFilters}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export ▾</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportCsv}>Export as CSV</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-background">
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
                {paginated.map((o) => (
                  <tr key={o.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => window.location.href = `/admin/orders/${o.id}`}>
                    <td className="p-4 font-mono text-primary font-medium">{o.orderNumber}</td>
                    <td className="p-4">
                      <OrderTypeBadge type={o.type} />
                    </td>
                    <td className="p-4">{o.user?.name ?? o.user?.email ?? "Guest"}</td>
                    <td className="p-4 font-medium">{formatPrice(o.total)}</td>
                    <td className="p-4">
                      <Badge variant={o.payments[0]?.status === "COMPLETED" ? "default" : "secondary"} className={o.payments[0]?.status === "COMPLETED" ? "bg-green-600" : ""}>
                        {o.payments[0]?.status ?? "—"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="p-4 text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}</td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/admin/orders/${o.id}`} className="text-primary hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredAndSorted.length === 0 && (
            <TableEmptyState
              icon={ShoppingBag}
              title={initialOrders.length === 0 ? "No orders yet" : "No orders match your filters"}
              description={initialOrders.length === 0 ? "Orders will appear here once customers start buying." : "Try adjusting your filters or search."}
              actionLabel={hasActiveFilters ? "Clear filters" : undefined}
              onAction={hasActiveFilters ? url.clearFilters : undefined}
            />
          )}
          {filteredAndSorted.length > 0 && (
            <TablePagination
              totalCount={filteredAndSorted.length}
              page={url.page}
              perPage={url.perPage}
              onPageChange={url.setPage}
              onPerPageChange={url.setPerPage}
              perPageOptions={[10, 25, 50, 100]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
