import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { OrdersListClient } from "@/components/admin/orders-list-client";

const PRINT_JOB_TYPES = ["LARGE_FORMAT", "THREE_D_PRINT", "CUSTOM_PRINT"] as const;
const SHOP_TYPE = "SHOP" as const;
const QUOTE_TYPE = "QUOTE" as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdminSection("/admin/orders");
  const { tab } = await searchParams;

  const [orders, typeCounts] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      where:
        tab === "shop"
          ? { type: SHOP_TYPE }
          : tab === "print-jobs"
            ? { type: { in: [...PRINT_JOB_TYPES] } }
            : tab === "quotes"
              ? { type: QUOTE_TYPE }
              : undefined,
      include: {
        user: { select: { name: true, email: true } },
        payments: { take: 1, orderBy: { createdAt: "desc" }, select: { status: true } },
      },
    }),
    prisma.order.groupBy({
      by: ["type"],
      _count: { id: true },
    }),
  ]);

  const countByType = Object.fromEntries(typeCounts.map((r) => [r.type, r._count.id]));
  const shopCount = countByType["SHOP"] ?? 0;
  const printJobsCount =
    (countByType["LARGE_FORMAT"] ?? 0) +
    (countByType["THREE_D_PRINT"] ?? 0) +
    (countByType["CUSTOM_PRINT"] ?? 0);
  const quotesCount = countByType["QUOTE"] ?? 0;
  const allCount = Object.values(countByType).reduce((a, b) => a + b, 0);

  const ordersSerialized = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    type: o.type,
    status: o.status,
    total: Number(o.total),
    createdAt: o.createdAt.toLocaleDateString(),
    user: o.user,
    payments: o.payments,
  }));

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
          counts={{ all: allCount, shop: shopCount, printJobs: printJobsCount, quotes: quotesCount }}
        />
      </Suspense>
    </div>
  );
}
