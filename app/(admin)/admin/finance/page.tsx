export const dynamic = 'force-dynamic'
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import { FinanceTabs } from "@/components/admin/finance-tabs";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { hasFinanceAccess } from "@/lib/admin-permissions";

export default async function AdminFinancePage() {
  try {

  await requireAdminSection("/admin/finance");
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role ?? "STAFF";
  const permissions = (session?.user as { permissions?: string[] })?.permissions ?? [];
  const canEditFinance = hasFinanceAccess(role, permissions, true);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [payments, allOrders, deliveredOrders, paymentsWithType] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { order: { select: { orderNumber: true, type: true } } },
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
    prisma.payment.findMany({
      where: { status: "COMPLETED", createdAt: { gte: startOfMonth } },
      include: { order: { select: { type: true } } },
    }),
  ]);

  const totalRevenue = paymentsWithType
    .filter((p) => p.status === "COMPLETED")
    .reduce((s, p) => s + Number(p.amount), 0);
  const orderCount = allOrders._count.id ?? 0;
  const totalOrderValue = Number(allOrders._sum.total ?? 0);
  const deliveredValue = Number(deliveredOrders._sum.total ?? 0);

  const revenueByLine = paymentsWithType.reduce(
    (acc, p) => {
      const type = p.order?.type ?? "SHOP";
      const amount = Number(p.amount);
      if (type === "SHOP") acc.shop += amount;
      else if (type === "QUOTE") acc.corporate += amount;
      else acc.printServices += amount; // LARGE_FORMAT, THREE_D_PRINT, CUSTOM_PRINT
      return acc;
    },
    { shop: 0, printServices: 0, corporate: 0 }
  );

  const countsByLine = paymentsWithType.reduce(
    (acc, p) => {
      const type = p.order?.type ?? "SHOP";
      if (type === "SHOP") acc.shop += 1;
      else if (type === "QUOTE") acc.corporate += 1;
      else acc.printServices += 1;
      return acc;
    },
    { shop: 0, printServices: 0, corporate: 0 }
  );

  const paymentsSerialized = payments
    .filter((p) => p.order != null)
    .map((p) => ({
      id: p.id,
      orderNumber: p.order!.orderNumber,
      orderType: p.order?.type ?? "SHOP",
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
        revenueByLine={revenueByLine}
        countsByLine={countsByLine}
        canEditFinance={canEditFinance}
      />
    </div>
  );

  } catch (error) {
    console.error("Data load failed in page.tsx:", error);
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          <h2 className="font-bold text-lg mb-2">Service Temporarily Unavailable</h2>
          <p className="text-sm">We are experiencing issues connecting to our database. Please try refreshing the page in a few moments.</p>
        </div>
      </div>
    );
  }
}
