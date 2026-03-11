import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { OrderDetailClient } from "@/components/admin/order-detail-client";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSection("/admin/orders");
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: { select: { name: true, images: true, sku: true } },
          productVariant: { select: { name: true, sku: true, attributes: true, image: true } },
        },
      },
      user: { select: { id: true, name: true, email: true, phone: true } },
      shippingAddress: true,
      payments: { orderBy: { createdAt: "desc" }, include: { mpesaTransaction: true } },
      timeline: { orderBy: { timestamp: "desc" } },
    },
  });

  if (!order) notFound();

  const serialized = {
    ...order,
    total: order.total.toString(),
    subtotal: order.subtotal.toString(),
    tax: order.tax.toString(),
    shippingCost: order.shippingCost.toString(),
    discount: order.discount.toString(),
    createdAt: order.createdAt.toISOString(),
    estimatedDelivery: order.estimatedDelivery?.toISOString() ?? null,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    shippedAt: order.shippedAt?.toISOString() ?? null,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    paidAt: order.paidAt?.toISOString() ?? null,
    items: order.items.map((i) => ({
      ...i,
      unitPrice: i.unitPrice.toString(),
    })),
    payments: order.payments.map((p) => ({
      ...p,
      amount: p.amount.toString(),
      paidAt: p.paidAt?.toISOString() ?? null,
    })),
    timeline: order.timeline.map((t) => ({
      ...t,
      timestamp: t.timestamp.toISOString(),
    })),
  };

  return <OrderDetailClient orderId={id} initialOrder={serialized} />;
}
