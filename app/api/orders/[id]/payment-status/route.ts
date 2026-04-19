import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/orders/[id]/payment-status
 * Returns order payment/status for polling (e.g. after M-Pesa STK push).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsCustomer);
  const { id: orderId } = await params;
  if (!orderId) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true, userId: true, payments: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } } },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  // Allow owner or unauthenticated (guest checkout) to poll
  if (order.userId && order.userId !== session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let status: "PENDING" | "CONFIRMED" | "PAYMENT_FAILED" = "PENDING";
  if (order.status === "CONFIRMED") status = "CONFIRMED";
  else if (order.status === "CANCELLED") status = "PAYMENT_FAILED";
  else if (order.payments[0]?.status === "FAILED") status = "PAYMENT_FAILED";

  return NextResponse.json({ status });
}
