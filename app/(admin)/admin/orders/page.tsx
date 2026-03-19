import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { OrdersListClient } from "@/components/admin/orders-list-client";

const PRINT_JOB_TYPES = ["LARGE_FORMAT", "THREE_D_PRINT", "CUSTOM_PRINT"] as const;
const SHOP_TYPE = "SHOP" as const;
const QUOTE_TYPE = "QUOTE" as const;

/** Print Jobs tab: orders that are print-service types OR any order with status PRINTING (e.g. shop orders sent to production). */
const printJobsWhere = {
  OR: [
    { type: { in: [...PRINT_JOB_TYPES] } },
    { status: "PRINTING" as const },
  ],
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdminSection("/admin/orders");
  const { tab } = await searchParams;

  const [orders, typeCounts, printJobsCountResult, allForKpis] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      where:
        tab === "shop"
          ? { type: SHOP_TYPE }
          : tab === "print-jobs"
            ? printJobsWhere
            : tab === "quotes"
              ? { type: QUOTE_TYPE }
              : undefined,
      include: {
        user: { select: { name: true, email: true } },
        payments: { take: 1, orderBy: { createdAt: "desc" }, select: { status: true } },
        items: {
          select: {
            quantity: true,
            product: { select: { sku: true } },
            productVariant: { select: { sku: true } },
          },
        },
      },
    }),
    prisma.order.groupBy({
      by: ["type"],
      _count: { id: true },
    }),
    prisma.order.count({ where: printJobsWhere }),
    prisma.order.findMany({
      select: { id: true, total: true, status: true, createdAt: true, payments: { take: 1, orderBy: { createdAt: "desc" }, select: { status: true } } },
    }),
  ]);

  const countByType = Object.fromEntries(typeCounts.map((r) => [r.type, r._count.id]));
  const shopCount = countByType["SHOP"] ?? 0;
  const quotesCount = countByType["QUOTE"] ?? 0;
  const allCount = Object.values(countByType).reduce((a, b) => a + b, 0);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const revenue = allForKpis
    .filter((o) => o.payments[0]?.status === "COMPLETED")
    .reduce((s, o) => s + Number(o.total), 0);
  const pendingCount = allForKpis.filter((o) => o.status === "PENDING").length;
  const thisMonthRevenue = allForKpis
    .filter((o) => o.createdAt >= startOfMonth && o.payments[0]?.status === "COMPLETED")
    .reduce((s, o) => s + Number(o.total), 0);

  const ordersSerialized = orders.map((o) => {
    const skuParts: string[] = [];
    o.items.forEach((item) => {
      const sku = item.productVariant?.sku ?? item.product?.sku ?? null;
      if (sku) {
        const qty = item.quantity;
        skuParts.push(qty > 1 ? `${sku}×${qty}` : sku);
      }
    });
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      type: o.type,
      status: o.status,
      total: Number(o.total),
      createdAt: o.createdAt.toISOString(),
      user: o.user,
      payments: o.payments,
      skus: skuParts,
      skuSummary: skuParts.length ? skuParts.join(", ") : null,
    };
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">
          All orders — shop, print jobs, and quotes. Use tabs to filter by type.
        </p>
      </div>
      <Suspense fallback={<div className="animate-pulse h-64 bg-muted/50 rounded-md" />}>
        <OrdersListClient
          orders={ordersSerialized}
          counts={{ all: allCount, shop: shopCount, printJobs: printJobsCountResult, quotes: quotesCount }}
          kpis={{ totalOrders: allCount, revenue, pending: pendingCount, thisMonthRevenue }}
        />
      </Suspense>
    </div>
  );
}
