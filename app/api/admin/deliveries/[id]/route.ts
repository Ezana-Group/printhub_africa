import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { createTrackingEvent } from "@/lib/tracking";
import {
  sendDeliveryDispatchedEmail,
  sendDeliveryDeliveredEmail,
  sendDeliveryFailedEmail,
} from "@/lib/email";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["PENDING", "DISPATCHED", "IN_TRANSIT", "DELIVERED", "FAILED"]).optional(),
  trackingNumber: z.string().max(100).optional(),
  assignedCourierId: z.string().nullable().optional(),
  failureReason: z.string().max(500).optional(),
  rescheduledTo: z.string().datetime().nullable().optional(),
});

/**
 * PATCH /api/admin/deliveries/[id] — update delivery (mark dispatched, delivered, failed, assign courier, reschedule)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "orders_edit" });
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        assignedCourier: { select: { name: true } },
        deliveryZone: { select: { name: true } },
        order: {
          include: {
            shippingAddress: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
    });
    if (!delivery) return NextResponse.json({ error: "Delivery not found" }, { status: 404 });

    const { status, trackingNumber, assignedCourierId, failureReason, rescheduledTo } = parsed.data;
    const updateData: Record<string, unknown> = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === "DISPATCHED") updateData.dispatchedAt = new Date();
      if (status === "DELIVERED") updateData.deliveredAt = new Date();
      if (status === "FAILED" && failureReason) updateData.failureReason = failureReason;
    }
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (assignedCourierId !== undefined) updateData.assignedCourierId = assignedCourierId;
    if (failureReason !== undefined) updateData.failureReason = failureReason;
    if (rescheduledTo !== undefined) updateData.rescheduledTo = rescheduledTo ? new Date(rescheduledTo) : null;

    await prisma.delivery.update({
      where: { id },
      data: updateData,
    });

    const orderId = delivery.orderId;
    if (status === "DISPATCHED" || status === "DELIVERED") {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          ...(status === "DISPATCHED" && { status: "SHIPPED", shippedAt: new Date(), trackingNumber: trackingNumber ?? undefined }),
          ...(status === "DELIVERED" && { status: "DELIVERED", deliveredAt: new Date() }),
        },
      });
      await createTrackingEvent(
        orderId,
        status === "DISPATCHED" ? "SHIPPED" : "DELIVERED",
        {
          description: trackingNumber ? `Tracking: ${trackingNumber}` : undefined,
          isPublic: true,
          createdBy: session.user?.id,
        }
      );
    }

    const customerEmail =
      delivery.order.shippingAddress?.email ??
      (delivery.order.user?.email as string | undefined) ??
      null;
    const customerName =
      delivery.order.shippingAddress?.fullName ??
      (delivery.order.user?.name as string | undefined) ??
      "Customer";

    if (customerEmail) {
      try {
        if (status === "DISPATCHED") {
          await sendDeliveryDispatchedEmail(
            customerEmail,
            delivery.order.orderNumber,
            trackingNumber ?? delivery.trackingNumber,
            {
              courierName: delivery.assignedCourier?.name ?? null,
              deliveryMethod: delivery.method ?? null,
              estimatedDeliveryDate: delivery.estimatedDelivery ?? null,
              deliveryZone: delivery.deliveryZone?.name ?? null,
            }
          );
        } else if (status === "DELIVERED") {
          await sendDeliveryDeliveredEmail(customerEmail, delivery.order.orderNumber);
        } else if (status === "FAILED") {
          await sendDeliveryFailedEmail(
            customerEmail,
            delivery.order.orderNumber,
            failureReason ?? undefined
          );
        }
      } catch (e) {
        console.error("Delivery notification email error:", e);
      }
    }

    if (status && (status === 'DELIVERED' || status === 'FAILED')) {
      void (async () => {
        try {
          const { sendAdminAlert } = await import("@/lib/email");
          await sendAdminAlert({
            event: "Payment Received",
            subject: `Delivery ${status}: Order #${delivery.order.orderNumber}`,
            html: `<p>Delivery for <strong>#${delivery.order.orderNumber}</strong> marked <strong>${status}</strong>.<br>Customer: ${customerName}${failureReason ? `<br>Reason: ${failureReason}` : ''}<br><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${delivery.orderId}">View order</a></p>`,
          });
        } catch (err) {
          console.error("Admin alert (delivery status) failed:", err);
        }
      })();
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Admin delivery update error:", e);
    return NextResponse.json({ error: "Failed to update delivery" }, { status: 500 });
  }
}
