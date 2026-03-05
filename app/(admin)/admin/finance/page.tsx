import { prisma } from "@/lib/prisma";
import { FinanceTabs } from "@/components/admin/finance-tabs";
import { requireAdminSection } from "@/lib/admin-route-guard";

export default async function AdminFinancePage() {
  await requireAdminSection("/admin/finance");
  const [payments, allOrders, deliveredOrders] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { order: { select: { orderNumber: true } } },
    }),
    prisma.order.aggregate({
      _count: { id: true },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      _count: { id: true },
      _sum: { total: true },
      where: { status: { in: ["DELIVERED", "SHIPPED"] } },
    }),
  ]);

  const completed = payments.filter((p) => p.status === "COMPLETED");
  const totalRevenue = completed.reduce((s, p) => s + Number(p.amount), 0);
  const orderCount = allOrders._count.id ?? 0;
  const totalOrderValue = Number(allOrders._sum.total ?? 0);
  const deliveredValue = Number(deliveredOrders._sum.total ?? 0);

  const paymentsSerialized = payments.map((p) => ({
    id: p.id,
    orderNumber: p.order.orderNumber,
    provider: p.provider,
    amount: Number(p.amount),
    status: p.status,
    createdAt: p.createdAt.toLocaleString(),
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Finance</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Business costs (rent, labour, VAT, profit targets) and revenue. Calculators use these settings for pricing.
        </p>
      </div>

      <FinanceTabs
        payments={paymentsSerialized}
        totalRevenue={totalRevenue}
        orderCount={orderCount}
        totalOrderValue={totalOrderValue}
        deliveredValue={deliveredValue}
      />
    </div>
  );
}
