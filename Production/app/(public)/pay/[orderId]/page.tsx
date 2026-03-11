import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PayOrderClient } from "./pay-order-client";

export default async function PayOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { orderId } = await params;
  const { token } = await searchParams;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      total: true,
      status: true,
      paymentLinkToken: true,
      paymentLinkExpiresAt: true,
    },
  });

  if (!order) notFound();

  const valid =
    token &&
    order.paymentLinkToken === token &&
    order.paymentLinkExpiresAt &&
    new Date(order.paymentLinkExpiresAt) > new Date();

  if (!valid) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold text-foreground">Link expired or invalid</h1>
          <p className="text-muted-foreground mt-2">
            This payment link has expired or is invalid. Please contact support or request a new
            link.
          </p>
        </div>
      </div>
    );
  }

  if (order.status === "CONFIRMED" || order.status === "DELIVERED") {
    return (
      <div className="min-h-[40vh] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold text-foreground">Order already paid</h1>
          <p className="text-muted-foreground mt-2">
            Order {order.orderNumber} has already been paid. Thank you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PayOrderClient
      orderId={order.id}
      orderNumber={order.orderNumber}
      totalKes={Number(order.total)}
    />
  );
}
