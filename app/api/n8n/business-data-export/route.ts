/**
 * GET /api/n8n/business-data-export
 *
 * Exports a comprehensive business data snapshot for the monthly BI report
 * and weekly trend workflows. Returns aggregated data from the last 30 days.
 *
 * Auth: x-n8n-secret header matching N8N_WEBHOOK_SECRET
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateN8nSecret, n8nUnauthorized } from "@/lib/n8n-auth";

export async function GET(req: Request) {
  if (!validateN8nSecret(req)) return n8nUnauthorized();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    ordersThisMonth,
    ordersPrevMonth,
    newCustomersThisMonth,
    newCustomersPrevMonth,
    topProducts,
    ordersByStatus,
    lowStockProducts,
    recentReviews,
    activeCustomers,
  ] = await Promise.all([
    // Revenue this period
    prisma.order.aggregate({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { notIn: ["CANCELLED"] },
      },
      _sum: { total: true },
      _count: true,
      _avg: { total: true },
    }),

    // Revenue prev period (for MoM comparison)
    prisma.order.aggregate({
      where: {
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        status: { notIn: ["CANCELLED"] },
      },
      _sum: { total: true },
      _count: true,
    }),

    // New customers this period
    prisma.user.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        role: "CUSTOMER",
      },
    }),

    // New customers prev period
    prisma.user.count({
      where: {
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        role: "CUSTOMER",
      },
    }),

    // Top 10 products by order item count
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { createdAt: { gte: thirtyDaysAgo } } },
      _count: { productId: true },
      _sum: { quantity: true },
      orderBy: { _count: { productId: "desc" } },
      take: 10,
    }),

    // Orders by status
    prisma.order.groupBy({
      by: ["status"],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: true,
    }),

    // Low stock alerts
    prisma.product.findMany({
      where: {
        isActive: true,
        stock: { gt: 0 },
      },
      select: { id: true, name: true, sku: true, stock: true, lowStockThreshold: true },
      orderBy: { stock: "asc" },
      take: 20,
    }),

    // Recent reviews (sentiment signal)
    prisma.productReview.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { rating: true, title: true, body: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),

    // Customers who ordered in the period (for retention analysis)
    prisma.order.groupBy({
      by: ["userId"],
      where: {
        createdAt: { gte: thirtyDaysAgo },
        userId: { not: null },
        status: { notIn: ["CANCELLED"] },
      },
      _count: true,
    }),
  ]);

  // Fetch product names for top products
  const topProductIds = topProducts.map((t) => t.productId).filter(Boolean) as string[];
  const topProductDetails =
    topProductIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: topProductIds } },
          select: { id: true, name: true, basePrice: true, category: { select: { name: true } } },
        })
      : [];

  const topProductsEnriched = topProducts.map((t) => {
    const detail = topProductDetails.find((p) => p.id === t.productId);
    return {
      productId: t.productId,
      name: detail?.name ?? "Unknown",
      category: detail?.category?.name ?? "Unknown",
      basePrice: detail?.basePrice,
      orderCount: t._count.productId,
      totalQuantity: t._sum.quantity,
    };
  });

  const revenueThisMonth = Number(ordersThisMonth._sum.total ?? 0);
  const revenuePrevMonth = Number(ordersPrevMonth._sum.total ?? 0);
  const momGrowth =
    revenuePrevMonth > 0
      ? ((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth) * 100
      : null;

  const avgRating =
    recentReviews.length > 0
      ? recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length
      : null;

  return NextResponse.json({
    exportedAt: now.toISOString(),
    period: { from: thirtyDaysAgo.toISOString(), to: now.toISOString() },
    revenue: {
      thisMonth: revenueThisMonth,
      prevMonth: revenuePrevMonth,
      momGrowthPercent: momGrowth ? Number(momGrowth.toFixed(1)) : null,
      orderCount: ordersThisMonth._count,
      prevMonthOrderCount: ordersPrevMonth._count,
      avgOrderValue: ordersThisMonth._avg.total
        ? Number(ordersThisMonth._avg.total)
        : null,
    },
    customers: {
      newThisMonth: newCustomersThisMonth,
      newPrevMonth: newCustomersPrevMonth,
      activeThisMonth: activeCustomers.length,
      repeatCustomers: activeCustomers.filter((c) => c._count > 1).length,
    },
    topProducts: topProductsEnriched,
    ordersByStatus,
    lowStockAlerts: lowStockProducts.filter(
      (p) => p.stock <= p.lowStockThreshold
    ),
    reviews: {
      count: recentReviews.length,
      avgRating,
      recent: recentReviews.slice(0, 10),
    },
  });
}
