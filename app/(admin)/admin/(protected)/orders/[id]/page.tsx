export const dynamic = 'force-dynamic'
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { OrderDetailClient } from "@/components/admin/order-detail-client";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {

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
      delivery: { include: { assignedCourier: true, deliveryZone: true } },
      deliveryZone: true,
      trackingEvents: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) notFound();

  const serialized = {
    ...order,
    paymentMethod: order.paymentMethod ?? null,
    paymentStatus: order.paymentStatus ?? null,
    pickupCode: order.pickupCode ?? null,
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
    items: order.items.map((i) => {
      const attrs = i.productVariant?.attributes;
      const attributes =
        attrs != null && typeof attrs === "object" && !Array.isArray(attrs)
          ? (attrs as Record<string, unknown>)
          : undefined;
      return {
        ...i,
        unitPrice: i.unitPrice.toString(),
        productVariant: i.productVariant
          ? { ...i.productVariant, attributes }
          : null,
      };
    }),
    payments: order.payments.map((p) => ({
      ...p,
      amount: p.amount.toString(),
      paidAt: p.paidAt?.toISOString() ?? null,
    })),
    timeline: order.timeline.map((t) => ({
      ...t,
      timestamp: t.timestamp.toISOString(),
    })),
    delivery: order.delivery
      ? {
          ...order.delivery,
          estimatedDelivery: order.delivery.estimatedDelivery?.toISOString() ?? null,
          dispatchedAt: order.delivery.dispatchedAt?.toISOString() ?? null,
          deliveredAt: order.delivery.deliveredAt?.toISOString() ?? null,
          rescheduledTo: order.delivery.rescheduledTo?.toISOString() ?? null,
        }
      : null,
    trackingEvents: order.trackingEvents?.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() })) ?? [],
  };

  return <OrderDetailClient orderId={id} initialOrder={serialized} />;

  } catch (error) {
    console.error("Data load failed in page.tsx:", error);
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          <h2 className="font-bold text-lg mb-2">Service Temporarily Unavailable</h2>
          <p className="text-sm">We are experiencing issues connecting to our database. Please try refreshing the page in a few moments.</p>
        </div>
      </div>
    );
  }
}
