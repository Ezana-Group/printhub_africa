import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 60;

const DISPLAY_THRESHOLDS = {
  totalOrders: 1000,
  totalClients: 500,
};

const FOUNDING_DATE = "2020-01-01";

/**
 * GET /api/stats/public
 * Returns anonymized business statistics for public marketing pages.
 * Includes thresholds to hide low numbers.
 */
export async function GET() {
  try {
    const COMPLETED_STATUSES: OrderStatus[] = ["DELIVERED", "CONFIRMED"];

    const [orderCount, clientCount, machineCount, staffCount] = await Promise.all([
      // totalOrders: count of all orders where status is DELIVERED or CONFIRMED
      prisma.order.count({
        where: { status: { in: COMPLETED_STATUSES } },
      }),
      // totalClients: count of distinct users where role is CUSTOMER and they have at least one completed order
      prisma.user.count({
        where: {
          role: "CUSTOMER",
          orders: {
            some: { status: { in: COMPLETED_STATUSES } },
          },
        },
      }),
      // totalMachines: count from the PrinterAsset table
      prisma.printerAsset.count({
        where: { isActive: true },
      }),
      // staffCount: count of users where role is STAFF, ADMIN, or SUPER_ADMIN
      prisma.user.count({
        where: {
          role: { in: ["STAFF", "ADMIN", "SUPER_ADMIN"] },
          status: "ACTIVE",
        },
      }),
    ]);

    // yearsInBusiness: computed from founding date to today
    const foundingDate = new Date(FOUNDING_DATE);
    const today = new Date();
    const yearsInBusiness = Math.max(0, today.getFullYear() - foundingDate.getFullYear());

    const stats = {
      totalOrders: orderCount >= DISPLAY_THRESHOLDS.totalOrders ? orderCount : null,
      totalClients: clientCount >= DISPLAY_THRESHOLDS.totalClients ? clientCount : null,
      yearsInBusiness,
      totalMachines: machineCount,
      staffCount,
    };

    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("Public stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
