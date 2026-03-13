/**
 * POST /api/account/data/export — KDPA data portability: export user data as JSON
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const [user, orders, addresses, refunds, supportTickets] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        loyaltyPoints: true,
      },
    }),
    prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { product: { select: { name: true, slug: true } } } },
        shippingAddress: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.savedAddress.findMany({ where: { userId } }),
    prisma.refund.findMany({
      where: { order: { userId } },
      include: { order: { select: { orderNumber: true } } },
    }),
    prisma.supportTicket.findMany({
      where: { userId },
      include: { messages: { where: { isInternal: false }, select: { message: true, senderType: true, createdAt: true } } },
    }),
  ]);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    userId: user.id,
    profile: {
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt,
      loyaltyPoints: user.loyaltyPoints,
    },
    orders: orders.map((o) => ({
      orderNumber: o.orderNumber,
      status: o.status,
      total: Number(o.total),
      currency: o.currency,
      createdAt: o.createdAt,
      items: o.items.map((i) => ({ name: i.product?.name, quantity: i.quantity, unitPrice: Number(i.unitPrice) })),
      shippingAddress: o.shippingAddress,
    })),
    savedAddresses: addresses,
    refunds: refunds.map((r) => ({
      refundNumber: r.refundNumber,
      orderNumber: r.order?.orderNumber,
      amount: Number(r.amount),
      status: r.status,
      createdAt: r.createdAt,
    })),
    supportTickets: supportTickets.map((t) => ({
      ticketNumber: t.ticketNumber,
      subject: t.subject,
      status: t.status,
      createdAt: t.createdAt,
      messages: t.messages,
    })),
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="printhub-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
