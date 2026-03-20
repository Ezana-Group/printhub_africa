import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 60;


/**
 * GET /api/stats/public
 * Returns anonymized business statistics for public marketing pages.
 * Includes thresholds to hide low numbers.
 */
export async function GET() {
  try {
    const COMPLETED_STATUSES: OrderStatus[] = ["DELIVERED", "CONFIRMED"];

    const [orderCount, clientCount, machineCount, staffCount, settings] = await Promise.all([
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
      // fetch settings for dynamic thresholds and founding date
      prisma.businessSettings.findUnique({
        where: { id: "default" },
        select: {
          foundingDate: true,
          statsOrdersThreshold: true,
          statsClientsThreshold: true,
        },
      }) as unknown as {
        foundingDate: Date | null;
        statsOrdersThreshold: number | null;
        statsClientsThreshold: number | null;
      } | null,
    ]);

    // yearsInBusiness: computed from founding date to today
    const foundingDate = settings?.foundingDate ? new Date(settings.foundingDate) : new Date("2020-01-01");
    const today = new Date();
    const yearsInBusiness = Math.max(0, today.getFullYear() - foundingDate.getFullYear());

    const orderThreshold = settings?.statsOrdersThreshold ?? 1000;
    const clientThreshold = settings?.statsClientsThreshold ?? 500;

    const stats = {
      totalOrders: orderCount >= orderThreshold ? orderCount : null,
      totalClients: clientCount >= clientThreshold ? clientCount : null,
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
