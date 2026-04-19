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
        corporate: { select: { id: true, companyName: true, logoImageUrl: true, brandGuidelineUrl: true, brandNotes: true } },
      },
    });

    if (!order) notFound();

    const o = order as any; // Type casting to bypass Prisma client desync lints

    const serialized = {
      ...o,
      paymentMethod: o.paymentMethod ?? null,
      paymentStatus: o.paymentStatus ?? null,
      pickupCode: o.pickupCode ?? null,
      total: o.total.toString(),
      subtotal: o.subtotal.toString(),
      tax: o.tax.toString(),
      shippingCost: o.shippingCost.toString(),
      discount: o.discount.toString(),
      createdAt: o.createdAt.toISOString(),
      estimatedDelivery: o.estimatedDelivery?.toISOString() ?? null,
      cancelledAt: o.cancelledAt?.toISOString() ?? null,
      shippedAt: o.shippedAt?.toISOString() ?? null,
      deliveredAt: o.deliveredAt?.toISOString() ?? null,
      paidAt: o.paidAt?.toISOString() ?? null,
      items: o.items.map((i: any) => {
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
      payments: o.payments.map((p: any) => ({
        ...p,
        amount: p.amount.toString(),
        paidAt: p.paidAt?.toISOString() ?? null,
      })),
      timeline: o.timeline.map((t: any) => ({
        ...t,
        timestamp: t.timestamp.toISOString(),
      })),
      delivery: o.delivery
        ? {
            ...o.delivery,
            estimatedDelivery: o.delivery.estimatedDelivery?.toISOString() ?? null,
            dispatchedAt: o.delivery.dispatchedAt?.toISOString() ?? null,
            deliveredAt: o.delivery.deliveredAt?.toISOString() ?? null,
            rescheduledTo: o.delivery.rescheduledTo?.toISOString() ?? null,
          }
        : null,
      trackingEvents: o.trackingEvents?.map((e: any) => ({ ...e, createdAt: e.createdAt.toISOString() })) ?? [],
      corporate: o.corporate ?? null,
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
