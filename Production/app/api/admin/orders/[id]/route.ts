import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { createTrackingEvent } from "@/lib/tracking";
import { awardLoyaltyPoints } from "@/lib/loyalty";
import { writeAudit } from "@/lib/audit";

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PRINTING",
  "QUALITY_CHECK",
  "READY_FOR_COLLECTION",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

const updateSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  trackingNumber: z.string().max(100).optional(),
  carrier: z.string().max(50).optional(),
  cancelReason: z.string().max(200).optional(),
  timelineMessage: z.string().max(500).optional(),
});

/** GET /api/admin/orders/[id] — full order with items, user, shipping, payments (incl. mpesa) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "orders_view" });
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
      include: {
      items: {
        include: {
          product: { select: { name: true, images: true, sku: true } },
          productVariant: { select: { name: true, sku: true, attributes: true, image: true } },
          catalogueItem: {
            select: {
              name: true,
              sku: true,
              photos: { take: 1, select: { url: true } },
            },
          },
        },
      },
      user: { select: { id: true, name: true, email: true, phone: true } },
      shippingAddress: true,
      payments: { orderBy: { createdAt: "desc" }, include: { mpesaTransaction: true } },
      timeline: { orderBy: { timestamp: "desc" } },
      trackingEvents: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "orders_edit" });
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;
  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { status, trackingNumber, carrier, cancelReason, timelineMessage } = parsed.data;
  try {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const updateData: {
      status?: string;
      trackingNumber?: string;
      shippedAt?: Date;
      deliveredAt?: Date;
      cancelledAt?: Date;
      cancelReason?: string;
    } = {};
    if (status != null) {
      updateData.status = status;
      if (status === "SHIPPED") updateData.shippedAt = new Date();
      if (status === "DELIVERED") updateData.deliveredAt = new Date();
      if (status === "CANCELLED") {
        updateData.cancelledAt = new Date();
        if (cancelReason) updateData.cancelReason = cancelReason;
      }
    }
    if (trackingNumber != null) updateData.trackingNumber = trackingNumber;
    if (Object.keys(updateData).length > 0) {
      await prisma.order.update({
        where: { id },
        data: updateData,
      });
      await prisma.orderTimeline.create({
        data: {
          orderId: id,
          status: status ?? order.status,
          message:
            status != null
              ? `Status updated to ${status}${trackingNumber ? ` · Tracking: ${trackingNumber}` : ""}`
              : "Updated",
          updatedBy: session.user?.email ?? session.user?.id ?? undefined,
        },
      });
      await writeAudit({
        userId: session.user?.id,
        action: `ORDER_${status ?? "UPDATE"}`,
        target: "Order",
        targetId: id,
        details: timelineMessage ?? (trackingNumber ? `Tracking: ${trackingNumber}` : undefined),
        request: req,
      });
      if (status != null) {
        await createTrackingEvent(id, status, {
          createdBy: session.user?.id ?? undefined,
        });
      }
      if (status === "DELIVERED") {
        awardLoyaltyPoints(id).catch((e) => console.error("Loyalty award failed:", e));
      }
    }
    if (timelineMessage != null && timelineMessage.trim()) {
      await prisma.orderTimeline.create({
        data: {
          orderId: id,
          status: order.status,
          message: timelineMessage.trim(),
          updatedBy: session.user?.email ?? session.user?.id ?? undefined,
        },
      });
    }
    const updated = await prisma.order.findUnique({
      where: { id },
      include: {
        timeline: { orderBy: { timestamp: "desc" } },
        trackingEvents: { orderBy: { createdAt: "desc" } },
      },
    });
    return NextResponse.json({ order: updated });
  } catch (e) {
    console.error("Admin update order error:", e);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
