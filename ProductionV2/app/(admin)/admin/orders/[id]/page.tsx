import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { OrderActions } from "@/components/admin/order-actions";
import { OrderTrackingCard } from "@/components/admin/order-tracking-card";

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
      user: true,
      items: { include: { product: true } },
      shippingAddress: true,
      payments: true,
      refunds: true,
      timeline: { orderBy: { timestamp: "desc" } },
      trackingEvents: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) notFound();

  const totalPaid = order.payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Order {order.orderNumber}</h1>
        <Badge variant={order.status === "PENDING" ? "destructive" : "secondary"}>
          {order.status}
        </Badge>
      </div>

      <OrderActions
        orderId={id}
        currentStatus={order.status}
        orderTotal={Number(order.total)}
        totalPaid={totalPaid}
      />

      <OrderTrackingCard
        orderId={id}
        orderNumber={order.orderNumber}
        events={order.trackingEvents}
      />

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Order summary</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            {order.items.map((i) => (
              <div key={i.id} className="flex justify-between text-sm">
                <span>
                  {i.product?.name ?? "Custom"} × {i.quantity}
                </span>
                <span>{formatPrice(Number(i.unitPrice) * i.quantity)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (16%)</span>
                <span>{formatPrice(Number(order.tax))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>{formatPrice(Number(order.shippingCost))}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(Number(order.total))}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Customer</h2>
            </CardHeader>
            <CardContent>
              <p>{order.user?.name ?? "Guest"}</p>
              <p className="text-sm text-muted-foreground">{order.user?.email}</p>
              {order.user?.phone && (
                <p className="text-sm">{order.user.phone}</p>
              )}
            </CardContent>
          </Card>

          {order.shippingAddress && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold">Shipping address</h2>
              </CardHeader>
              <CardContent className="text-sm">
                <p>{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.street}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.county}
                </p>
                <p>{order.shippingAddress.phone}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Payment history</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.payments.length > 0 ? (
            <div className="space-y-2">
              {order.payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <span>{p.provider}</span>
                  <span>{formatPrice(Number(p.amount))}</span>
                  <Badge variant={p.status === "COMPLETED" ? "default" : "secondary"}>
                    {p.status}
                  </Badge>
                  {p.paidAt && (
                    <span className="text-sm text-muted-foreground">
                      {p.paidAt.toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No payments yet</p>
          )}
          {order.refunds.length > 0 && (
            <div className="pt-2 border-t">
              <p className="font-medium text-sm mb-2">Refunds</p>
              {order.refunds.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-1 text-sm">
                  <span>{formatPrice(Number(r.amount))}</span>
                  <Badge variant="outline">{r.status}</Badge>
                  {r.reason && <span className="text-muted-foreground">{r.reason}</span>}
                  {r.processedAt && (
                    <span className="text-muted-foreground">{r.processedAt.toLocaleString()}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Timeline</h2>
        </CardHeader>
        <CardContent>
          {order.timeline.length > 0 ? (
            <div className="space-y-2">
              {order.timeline.map((t) => (
                <div key={t.id} className="flex gap-4 text-sm">
                  <span className="text-muted-foreground w-32">
                    {t.timestamp.toLocaleString()}
                  </span>
                  <span>{t.status}</span>
                  {t.message && (
                    <span className="text-muted-foreground">{t.message}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No timeline events</p>
          )}
        </CardContent>
      </Card>

      <Button asChild variant="outline">
        <Link href="/admin/orders">Back to orders</Link>
      </Button>
    </div>
  );
}
