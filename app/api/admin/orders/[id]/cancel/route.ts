/**
 * POST /api/admin/orders/[id]/cancel — admin cancel order with reason
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTrackingEvent } from "@/lib/tracking";
import { restoreStockForOrder } from "@/lib/stock";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { ADMIN_CANCEL_ALLOWED_STATUSES } from "@/lib/cancellation";
import { sendOrderCancelledEmail } from "@/lib/email";
import { z } from "zod";

const bodySchema = z.object({
  reason: z.string().min(1).max(500),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "orders_edit" });
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;
  const { id: orderId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: { select: { email: true } }, shippingAddress: { select: { email: true } } },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status === "CANCELLED") {
    return NextResponse.json({ error: "Order already cancelled" }, { status: 400 });
  }
  if (!ADMIN_CANCEL_ALLOWED_STATUSES.includes(order.status as typeof ADMIN_CANCEL_ALLOWED_STATUSES[number])) {
    return NextResponse.json(
      { error: `Cannot cancel order in status ${order.status}` },
      { status: 400 }
    );
  }
  try {
    await restoreStockForOrder(orderId);
  } catch (e) {
    console.error("Stock restore on admin cancel:", e);
  }
  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: parsed.data.reason,
      },
    }),
    prisma.cancellation.upsert({
      where: { orderId },
      create: {
        orderId,
        reason: parsed.data.reason,
        cancelledBy: "admin",
      },
      update: { reason: parsed.data.reason, cancelledBy: "admin" },
    }),
  ]);
  await createTrackingEvent(orderId, "CANCELLED", {
    description: `Cancelled by admin. Reason: ${parsed.data.reason}`,
    createdBy: session.user?.id,
  });
  const customerEmail = order.user?.email ?? order.shippingAddress?.email;
  if (customerEmail) {
    sendOrderCancelledEmail(customerEmail, order.orderNumber, parsed.data.reason).catch((e) =>
      console.error("Cancel email error:", e)
    );
  }
  return NextResponse.json({ success: true, status: "CANCELLED" });
}
