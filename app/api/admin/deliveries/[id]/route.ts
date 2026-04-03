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
            trackingNumber ?? delivery.trackingNumber
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

    // --- AUTOMATION: n8n Status Trigger ---
    if (status) {
      void (async () => {
        try {
          const { n8n } = await import("@/lib/n8n");
          // Trigger staff alert for completion/failure
          if (status === 'DELIVERED' || status === 'FAILED') {
            await n8n.staffAlert({
              type: 'PRODUCTION_DELAYED', // Using PRODUCTION_DELAYED as a generic status update bucket for now
              title: `🚚 Delivery ${status}: #${delivery.order.orderNumber}`,
              message: `Customer: ${customerName}\nStatus: ${status}${failureReason ? `\nReason: ${failureReason}` : ''}`,
              urgency: status === 'FAILED' ? 'high' : 'low',
              actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${delivery.orderId}`,
              targetRoles: ['STAFF', 'ADMIN']
            });
          }
          
          // Trigger global workflow (for WhatsApp/SMS)
          await n8n.deliveryStatusChanged({
            deliveryId: id,
            orderId: delivery.orderId,
            orderNumber: delivery.order.orderNumber,
            status,
            customerName,
            customerEmail,
            customerPhone: delivery.order.shippingAddress?.phone ?? undefined,
            trackingNumber: trackingNumber ?? delivery.trackingNumber,
            failureReason: failureReason ?? undefined
          });
        } catch (err) {
          console.error("Failed to trigger n8n delivery alert:", err);
        }
      })();
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Admin delivery update error:", e);
    return NextResponse.json({ error: "Failed to update delivery" }, { status: 500 });
  }
}
