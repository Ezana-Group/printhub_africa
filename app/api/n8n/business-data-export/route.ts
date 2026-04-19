import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-n8n-secret") ?? "";
  if (secret !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const now = new Date();
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Orders data
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: firstOfLastMonth, lt: firstOfThisMonth } },
      include: {
        payments: { where: { status: "COMPLETED" } },
        items: { include: { product: { select: { name: true, categoryId: true } } } },
      },
    });

    const totalRevenue = orders
      .flatMap((o) => o.payments)
      .reduce((s, p) => s + Number(p.amount), 0);

    // Product performance
    const productRevMap: Record<string, { name: string; revenue: number; qty: number }> = {};
    for (const order of orders) {
      for (const item of order.items) {
        if (item.productId && item.product) {
          if (!productRevMap[item.productId]) {
            productRevMap[item.productId] = { name: item.product.name, revenue: 0, qty: 0 };
          }
          productRevMap[item.productId].revenue += Number(item.unitPrice) * item.quantity;
          productRevMap[item.productId].qty += item.quantity;
        }
      }
    }
    const topProducts = Object.entries(productRevMap)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(([id, v]) => ({ id, ...v }));

    // Customer stats
    const [newCustomers, returningOrders] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: firstOfLastMonth, lt: firstOfThisMonth }, role: "CUSTOMER" },
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: firstOfLastMonth, lt: firstOfThisMonth },
          user: { orders: { some: { createdAt: { lt: firstOfLastMonth } } } },
        },
      }),
    ]);

    // Quotes
    const [totalQuotes, acceptedQuotes] = await Promise.all([
      prisma.quote.count({ where: { createdAt: { gte: firstOfLastMonth, lt: firstOfThisMonth } } }),
      prisma.quote.count({
        where: {
          createdAt: { gte: firstOfLastMonth, lt: firstOfThisMonth },
          status: "accepted",
        },
      }),
    ]);

    // Payment method breakdown
    const paymentBreakdown = await prisma.payment.groupBy({
      by: ["provider"],
      where: { status: "COMPLETED", createdAt: { gte: firstOfLastMonth, lt: firstOfThisMonth } },
      _sum: { amount: true },
      _count: { id: true },
    });

    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    return NextResponse.json({
      period: {
        from: firstOfLastMonth.toISOString(),
        to: firstOfThisMonth.toISOString(),
      },
      orders: {
        total: orders.length,
        totalRevenue,
        averageOrderValue: avgOrderValue,
        byStatus: Object.entries(
          orders.reduce((acc, o) => {
            acc[o.status] = (acc[o.status] ?? 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([status, count]) => ({ status, count })),
      },
      products: { topByRevenue: topProducts },
      customers: {
        newThisMonth: newCustomers,
        returningOrderCount: returningOrders,
        quoteTotal: totalQuotes,
        quoteAccepted: acceptedQuotes,
        quoteConversionRate:
          totalQuotes > 0 ? Math.round((acceptedQuotes / totalQuotes) * 100) : 0,
      },
      payments: {
        breakdown: paymentBreakdown.map((p) => ({
          provider: p.provider,
          total: Number(p._sum.amount ?? 0),
          count: p._count.id,
        })),
      },
    });
  } catch (err) {
    console.error("[business-data-export]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
