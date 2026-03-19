import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

/**
 * GET /api/admin/deliveries — list deliveries (pending, dispatched, in transit, delivered, failed)
 * Query: status=PENDING|DISPATCHED|IN_TRANSIT|DELIVERED|FAILED
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminApi({ permission: "orders_view" });
  if (auth instanceof NextResponse) return auth;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  try {
    const deliveries = await prisma.delivery.findMany({
      where: status ? { status: status as "PENDING" | "DISPATCHED" | "IN_TRANSIT" | "DELIVERED" | "FAILED" } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            shippingAddress: true,
            user: { select: { name: true, email: true, phone: true } },
          },
        },
        assignedCourier: { select: { id: true, name: true, trackingUrl: true } },
        deliveryZone: { select: { name: true } },
      },
    });
    return NextResponse.json(
      deliveries.map((d) => ({
        ...d,
        order: d.order
          ? {
              ...d.order,
              total: Number(d.order.total),
            }
          : null,
        estimatedDelivery: d.estimatedDelivery?.toISOString() ?? null,
        dispatchedAt: d.dispatchedAt?.toISOString() ?? null,
        deliveredAt: d.deliveredAt?.toISOString() ?? null,
        rescheduledTo: d.rescheduledTo?.toISOString() ?? null,
      }))
    );
  } catch (e) {
    console.error("Admin deliveries list error:", e);
    return NextResponse.json({ error: "Failed to fetch deliveries" }, { status: 500 });
  }
}
