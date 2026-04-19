import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { prisma } from "@/lib/prisma";
import { createTrackingEvent } from "@/lib/tracking";
import { restoreStockForOrder } from "@/lib/stock";
import { sendOrderCancelledEmail } from "@/lib/email";
import { z } from "zod";

const cancelSchema = z.object({
  action: z.literal("cancel"),
  cancelReason: z.string().max(500).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const order = await prisma.order.findFirst({
      where: { id, userId: session.user.id },
      include: {
        items: {
          include: {
            product: { select: { name: true, slug: true, images: true, productionFiles: true } },
          },
        },
        shippingAddress: true,
        delivery: { include: { assignedCourier: { select: { name: true, trackingUrl: true, phone: true } } } },
        trackingEvents: { orderBy: { createdAt: "desc" } },
        invoices: { select: { id: true, invoiceNumber: true, issuedAt: true }, orderBy: { issuedAt: "desc" } },
        refunds: { select: { id: true, refundNumber: true, amount: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" } },
      },
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const fileIds = order.items.map((item) => item.uploadedFileId).filter(Boolean) as string[];
    let uploadedFiles: any[] = [];
    if (fileIds.length > 0) {
      uploadedFiles = await prisma.uploadedFile.findMany({
        where: { id: { in: fileIds } },
      });
    }
    return NextResponse.json({
      ...order,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      shippingCost: Number(order.shippingCost),
      discount: Number(order.discount),
      total: Number(order.total),
      estimatedDelivery: order.estimatedDelivery?.toISOString() ?? null,
      shippedAt: order.shippedAt?.toISOString() ?? null,
      deliveredAt: order.deliveredAt?.toISOString() ?? null,
      items: order.items.map((i) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        product: i.product,
        uploadedFile: i.uploadedFileId ? uploadedFiles.find((uf) => uf.id === i.uploadedFileId) || null : null,
      })),
      delivery: order.delivery
        ? {
            ...order.delivery,
            status: order.delivery.status,
            estimatedDelivery: order.delivery.estimatedDelivery?.toISOString() ?? null,
            dispatchedAt: order.delivery.dispatchedAt?.toISOString() ?? null,
            deliveredAt: order.delivery.deliveredAt?.toISOString() ?? null,
            rescheduledTo: order.delivery.rescheduledTo?.toISOString() ?? null,
            assignedCourier: order.delivery.assignedCourier,
          }
        : null,
      trackingEvents: order.trackingEvents.map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
      })),
      invoices: order.invoices?.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        issuedAt: inv.issuedAt.toISOString(),
      })) ?? [],
      refunds: order.refunds?.map((r) => ({
        id: r.id,
        refundNumber: r.refundNumber ?? null,
        amount: Number(r.amount),
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })) ?? [],
    });
  } catch (e) {
    console.error("Order detail error:", e);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

/** PATCH: Customer cancel own order (only PENDING or CONFIRMED). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = cancelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    const order = await prisma.order.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const allowed = ["PENDING", "CONFIRMED"];
    if (!allowed.includes(order.status)) {
      return NextResponse.json(
        { error: "Order can no longer be cancelled" },
        { status: 400 }
      );
    }
    const reason = parsed.data.cancelReason ?? "Cancelled by customer";
    try {
      await restoreStockForOrder(id);
    } catch (e) {
      console.error("Stock restore on customer cancel:", e);
    }
    await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: reason,
        },
      }),
      prisma.cancellation.upsert({
        where: { orderId: id },
        create: {
          orderId: id,
          reason,
          cancelledBy: session.user.id,
        },
        update: { reason, cancelledBy: session.user.id },
      }),
    ]);
    await createTrackingEvent(order.id, "CANCELLED", {
      description: reason
        ? `Cancelled by customer. Reason: ${parsed.data.cancelReason}`
        : "Cancelled by customer.",
    });
    const customerEmail = session.user?.email;
    if (typeof customerEmail === "string" && customerEmail) {
      sendOrderCancelledEmail(customerEmail, order.orderNumber, reason).catch((e) =>
        console.error("Cancel email error:", e)
      );
    }
    return NextResponse.json({ success: true, status: "CANCELLED" });
  } catch (e) {
    console.error("Order cancel error:", e);
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
  }
}
