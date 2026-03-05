import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api-guard";

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PRINTING",
  "QUALITY_CHECK",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

const updateSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  timelineMessage: z.string().max(500).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "orders_edit" });
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;
  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { status, timelineMessage } = parsed.data;
  try {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (status != null) {
      await prisma.order.update({
        where: { id },
        data: { status },
      });
      await prisma.orderTimeline.create({
        data: {
          orderId: id,
          status,
          message: `Status updated to ${status}`,
          updatedBy: session.user?.email ?? session.user?.id ?? undefined,
        },
      });
    }
    if (timelineMessage != null && timelineMessage.trim()) {
      await prisma.orderTimeline.create({
        data: {
          orderId: id,
          status: order.status,
          message: timelineMessage.trim(),
          updatedBy: session.user?.email ?? session.user?.id ?? undefined,
        },
      });
    }
    const updated = await prisma.order.findUnique({
      where: { id },
      include: { timeline: { orderBy: { timestamp: "desc" } } },
    });
    return NextResponse.json({ order: updated });
  } catch (e) {
    console.error("Admin update order error:", e);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
