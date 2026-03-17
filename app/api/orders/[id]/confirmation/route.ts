import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/orders/[id]/confirmation
 * Returns order details for the confirmation page.
 * Allowed: order owner (userId) or any request for CONFIRMED orders (guest checkout).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id: orderId } = await params;
  if (!orderId) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: { select: { name: true } } } },
      shippingAddress: true,
      payments: { where: { provider: "PESAPAL" }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const isOwner = session?.user?.id && order.userId === session.user.id;
  const isConfirmed = order.status === "CONFIRMED";
  if (!isOwner && !isConfirmed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pesapalPayment = order.payments[0];
  const pesapalOrderTrackingId =
    pesapalPayment?.status === "PENDING" && (pesapalPayment.pesapalRef ?? pesapalPayment.providerTransactionId)
      ? (pesapalPayment.pesapalRef ?? pesapalPayment.providerTransactionId) ?? undefined
      : undefined;

  return NextResponse.json({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    shippingCost: Number(order.shippingCost),
    discount: Number(order.discount),
    total: Number(order.total),
    currency: order.currency,
    createdAt: order.createdAt,
    items: order.items.map((i) => ({
      id: i.id,
      productName: i.product?.name ?? "Item",
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      total: Number(i.unitPrice) * i.quantity,
    })),
    shippingAddress: order.shippingAddress
      ? {
          fullName: order.shippingAddress.fullName,
          email: order.shippingAddress.email,
          phone: order.shippingAddress.phone,
          street: order.shippingAddress.street,
          city: order.shippingAddress.city,
          county: order.shippingAddress.county,
          postalCode: order.shippingAddress.postalCode,
          deliveryMethod: order.shippingAddress.deliveryMethod,
        }
      : null,
    ...(pesapalOrderTrackingId && { pesapalOrderTrackingId }),
  });
}
