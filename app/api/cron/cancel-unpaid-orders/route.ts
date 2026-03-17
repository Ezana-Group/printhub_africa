/**
 * GET /api/cron/cancel-unpaid-orders
 * Auto-cancel orders that have been unpaid for 30+ minutes (excludes manual/pickup).
 * Secured by CRON_SECRET. Set CRON_CANCEL_UNPAID_ORDERS_ENABLED=true to run.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { restoreOrderStock } from "@/lib/order-stock";
import * as Sentry from "@sentry/nextjs";

function checkCronAuth(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = req.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const headerSecret = req.headers.get("x-cron-secret");
  return bearer === secret || headerSecret === secret;
}

const UNPAID_TIMEOUT_MINUTES = 30;

export async function GET(req: Request) {
  if (!checkCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.CRON_CANCEL_UNPAID_ORDERS_ENABLED !== "true") {
    return NextResponse.json({ ok: true, cancelled: 0, orderIds: [] });
  }

  const cutoff = new Date(Date.now() - UNPAID_TIMEOUT_MINUTES * 60 * 1000);

  const unpaidOrders = await prisma.order.findMany({
    where: {
      status: { not: "CANCELLED" },
      createdAt: { lt: cutoff },
      payments: {
        some: {
          status: "PENDING",
          provider: { notIn: ["BANK_TRANSFER", "CASH_ON_PICKUP"] },
        },
      },
    },
    include: {
      payments: { where: { status: "PENDING" }, take: 1 },
    },
  });

  const orderIds: string[] = [];

  for (const order of unpaidOrders) {
    const payment = order.payments[0];
    if (!payment || payment.provider === "BANK_TRANSFER" || payment.provider === "CASH_ON_PICKUP") continue;

    try {
      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancelReason: "Payment not received within 30 minutes",
          },
        }),
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        }),
        prisma.orderTimeline.create({
          data: {
            orderId: order.id,
            status: "CANCELLED",
            message: "Order automatically cancelled — payment not received within 30 minutes",
          },
        }),
      ]);
      try {
        await restoreOrderStock(order.id);
      } catch (restoreErr) {
        console.error("Restore stock on cancel error:", order.id, restoreErr);
      }
      orderIds.push(order.id);
      Sentry.captureMessage(`Unpaid order auto-cancelled: ${order.orderNumber}`, "info");
    } catch (e) {
      console.error("Cancel unpaid order error:", order.id, e);
    }
  }

  return NextResponse.json({ ok: true, cancelled: orderIds.length, orderIds });
}
