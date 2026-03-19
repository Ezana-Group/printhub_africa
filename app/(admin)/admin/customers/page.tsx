import { prisma } from "@/lib/prisma";
import { CustomersAdminClient } from "@/components/admin/customers-admin-client";
import { requireAdminSection } from "@/lib/admin-route-guard";

export default async function AdminCustomersPage() {
  await requireAdminSection("/admin/customers");
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      _count: { select: { orders: true } },
      orders: {
        include: {
          payments: true,
        },
      },
      primaryCorporateAccount: { select: { id: true } },
    },
  });

  const totalSpentByUserId: Record<string, number> = {};
  const lastOrderByUserId: Record<string, Date | null> = {};
  for (const u of customers) {
    let sum = 0;
    let lastOrder: Date | null = null;
    for (const o of u.orders) {
      if (o.createdAt && (!lastOrder || o.createdAt > lastOrder)) lastOrder = o.createdAt;
      for (const p of o.payments) {
        if (p.status === "COMPLETED") sum += Number(p.amount);
      }
    }
    totalSpentByUserId[u.id] = sum;
    lastOrderByUserId[u.id] = lastOrder;
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  let activeThisMonth = 0;
  let newThisMonth = 0;
  let corporateCount = 0;
  for (const u of customers) {
    const lastOrder = lastOrderByUserId[u.id];
    if (lastOrder && lastOrder >= startOfMonth) activeThisMonth++;
    if (u.createdAt >= startOfMonth) newThisMonth++;
    if (u.primaryCorporateAccount) corporateCount++;
  }

  const allSpents = Object.values(totalSpentByUserId).filter((s) => s > 0).sort((a, b) => b - a);
  const top10PercentThreshold = allSpents.length > 0 ? allSpents[Math.max(0, Math.floor(allSpents.length * 0.1))] ?? 0 : 0;

  const rows = customers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    createdAt: u.createdAt,
    ordersCount: u._count.orders,
    totalSpent: totalSpentByUserId[u.id] ?? 0,
    lastOrderAt: lastOrderByUserId[u.id] ?? null,
    isTopSpender: (totalSpentByUserId[u.id] ?? 0) >= top10PercentThreshold && top10PercentThreshold > 0,
    isCorporate: !!u.primaryCorporateAccount,
  }));

  return (
    <CustomersAdminClient
      customers={rows}
      kpis={{
        total: customers.length,
        activeThisMonth,
        newThisMonth,
        corporate: corporateCount,
      }}
    />
  );
}
