import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

/** GET /api/admin/orders/[id]/timeline — chronological events for order */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "orders_view" });
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const [order, auditLogs] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: {
        payments: { orderBy: { createdAt: "asc" }, include: { mpesaTransaction: true } },
        timeline: { orderBy: { timestamp: "asc" } },
      },
    }),
    prisma.auditLog.findMany({
      where: { entity: "Order", entityId: id },
      orderBy: { timestamp: "asc" },
      include: { user: { select: { email: true, name: true } } },
    }),
  ]);

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  type TimelineEvent = {
    label: string;
    detail?: string | null;
    timestamp: Date;
    type: "info" | "success" | "error" | "action";
    actor?: string | null;
  };

  const events: TimelineEvent[] = [
    {
      label: order.userId ? "Order placed" : "Order placed (guest checkout)",
      timestamp: order.createdAt,
      type: "info",
    },
    ...order.payments.map((p) => {
      const mpesa = p.mpesaTransaction;
      const success = p.status === "COMPLETED";
      return {
        label: success ? "Payment received" : "Payment failed",
        detail: success
          ? (mpesa?.mpesaReceiptNumber ? `M-Pesa receipt: ${mpesa.mpesaReceiptNumber}` : "Paid")
          : (mpesa?.resultDesc ?? order.mpesaFailureReason ?? "Payment not completed"),
        timestamp: (p.paidAt ?? p.createdAt) as Date,
        type: (success ? "success" : "error") as "success" | "error",
      };
    }),
    ...order.timeline.map((t) => ({
      label: t.message ?? t.status,
      timestamp: t.timestamp,
      type: "action" as const,
      actor: t.updatedBy ?? undefined,
    })),
    ...auditLogs.map((log) => ({
      label: log.action,
      detail: log.details ?? undefined,
      timestamp: log.timestamp,
      type: "action" as const,
      actor: log.user?.email ?? log.user?.name ?? undefined,
    })),
    ...(order.shippedAt
      ? [
          {
            label: "Order shipped",
            detail: order.trackingNumber ? `Tracking: ${order.trackingNumber}` : null,
            timestamp: order.shippedAt,
            type: "success" as const,
          },
        ]
      : []),
    ...(order.deliveredAt
      ? [
          {
            label: "Order delivered",
            timestamp: order.deliveredAt,
            type: "success" as const,
          },
        ]
      : []),
  ];

  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return NextResponse.json(events);
}
