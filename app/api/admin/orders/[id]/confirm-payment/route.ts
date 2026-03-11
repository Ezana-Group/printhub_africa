import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail, sendPaymentRejectedEmail } from "@/lib/email";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { writeAudit } from "@/lib/audit";

const schema = z.object({
  action: z.enum(["CONFIRM", "REJECT"]),
  reference: z.string().max(100).optional(),
  pickupCode: z.string().max(10).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "orders_edit" });
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;
  const userId = (session.user as { id?: string })?.id ?? null;
  const { id: orderId } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { action } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
      shippingAddress: true,
    },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const latestPayment = order.payments[0];
  if (!latestPayment) {
    return NextResponse.json({ error: "No payment record" }, { status: 400 });
  }

  const customerEmail =
    order.shippingAddress?.email ??
    (order.userId
      ? (await prisma.user.findUnique({ where: { id: order.userId }, select: { email: true } }))?.email
      : null);

  if (action === "CONFIRM") {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: latestPayment.id },
        data: {
          status: "COMPLETED",
          manualVerifiedBy: userId ?? undefined,
          manualVerifiedAt: new Date(),
          paidAt: new Date(),
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: {
          status: "CONFIRMED",
          paymentStatus: "CONFIRMED",
          paidAt: new Date(),
        },
      }),
    ]);

    if (customerEmail) {
      await sendOrderConfirmationEmail(
        customerEmail,
        order.orderNumber,
        Number(order.total),
        order.currency ?? "KES"
      );
    }

    await writeAudit({
      userId: userId ?? undefined,
      action: "ORDER_PAYMENT_CONFIRMED",
      entity: "Order",
      entityId: orderId,
      details: `Manual payment confirmed for order ${order.orderNumber}`,
      request: req,
    });

    return NextResponse.json({ success: true });
  }

  if (action === "REJECT") {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: latestPayment.id },
        data: {
          status: "FAILED",
          failureReason: "Reference not found by staff",
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "FAILED" },
      }),
    ]);

    if (customerEmail && latestPayment.manualReference) {
      await sendPaymentRejectedEmail(
        customerEmail,
        order.orderNumber,
        latestPayment.manualReference
      );
    }

    await writeAudit({
      userId: userId ?? undefined,
      action: "ORDER_PAYMENT_REJECTED",
      entity: "Order",
      entityId: orderId,
      details: `Manual payment rejected for order ${order.orderNumber}`,
      request: req,
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
