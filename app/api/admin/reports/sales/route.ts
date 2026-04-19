import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval } from "date-fns";

export async function GET(req: Request) {
  const auth = await requireAdminApi({ permission: "reports_view" });
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30", 10);
  
  const to = endOfDay(new Date());
  const from = startOfDay(subDays(to, days - 1));

  try {
    // 1. Fetch Orders in range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        status: { not: "CANCELLED" as const }
      },
      select: {
        id: true,
        total: true,
        subtotal: true,
        tax: true,
        shippingCost: true,
        createdAt: true,
        status: true,
      }
    });

    // 2. Fetch Completed Payments in range (for actual revenue)
    const payments = await prisma.payment.findMany({
      where: {
        paidAt: { gte: from, lte: to },
        status: "COMPLETED" as const
      },
      select: {
        amount: true,
        paidAt: true
      }
    });

    // 3. Aggregate Metrics
    const totalGross = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalOrders = orders.length;
    const totalTax = orders.reduce((sum, o) => sum + Number(o.tax), 0);
    const totalShipping = orders.reduce((sum, o) => sum + Number(o.shippingCost), 0);
    const netRevenue = totalGross - totalTax - totalShipping;

    // 4. Daily Breakdown for Charts
    const dayInterval = eachDayOfInterval({ start: from, end: to });
    const dailyData = dayInterval.map(date => {
      const dateStr = format(date, "yyyy-MM-dd");
      
      const dayPayments = payments.filter(p => p.paidAt && format(p.paidAt, "yyyy-MM-dd") === dateStr);
      const dayOrders = orders.filter(o => format(o.createdAt, "yyyy-MM-dd") === dateStr);
      
      return {
        date: format(date, "MMM dd"),
        fullDate: dateStr,
        revenue: dayPayments.reduce((sum, p) => sum + Number(p.amount), 0),
        orders: dayOrders.length,
      };
    });

    return NextResponse.json({
      metrics: {
        totalGross,
        netRevenue,
        totalTax,
        totalShipping,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalGross / totalOrders : 0,
      },
      chartData: dailyData,
    });
  } catch (e) {
    console.error("[REPORTS_SALES_API]", e);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
