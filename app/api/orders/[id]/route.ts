import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTrackingEvent } from "@/lib/tracking";
import { z } from "zod";

const cancelSchema = z.object({
  action: z.literal("cancel"),
  cancelReason: z.string().max(500).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const order = await prisma.order.findFirst({
      where: { id, userId: session.user.id },
      include: {
        items: {
          include: {
            product: { select: { name: true, slug: true, images: true } },
          },
        },
        shippingAddress: true,
      },
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      ...order,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      shippingCost: Number(order.shippingCost),
      discount: Number(order.discount),
      total: Number(order.total),
      items: order.items.map((i) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        product: i.product,
      })),
    });
  } catch (e) {
    console.error("Order detail error:", e);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

/** PATCH: Customer cancel own order (only PENDING or CONFIRMED). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = cancelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    const order = await prisma.order.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const allowed = ["PENDING", "CONFIRMED"];
    if (!allowed.includes(order.status)) {
      return NextResponse.json(
        { error: "Order can no longer be cancelled" },
        { status: 400 }
      );
    }
    await prisma.order.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: parsed.data.cancelReason ?? null,
      },
    });
    await createTrackingEvent(order.id, "CANCELLED", {
      description: parsed.data.cancelReason
        ? `Cancelled by customer. Reason: ${parsed.data.cancelReason}`
        : "Cancelled by customer.",
    });
    return NextResponse.json({ success: true, status: "CANCELLED" });
  } catch (e) {
    console.error("Order cancel error:", e);
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
  }
}
