import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPickupConfirmationEmail } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  orderId: z.string(),
});

function generatePickupCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
  const { orderId } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { shippingAddress: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const isOwner =
    session?.user?.id && order.userId === session.user.id;
  const guestEmail = order.shippingAddress?.email;
  if (!isOwner && !guestEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (isOwner === false && session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.status === "CONFIRMED" || order.status === "DELIVERED") {
    return NextResponse.json(
      { error: "Order already paid" },
      { status: 400 }
    );
  }

  const totalKes = Number(order.total);
  const pickupCode = generatePickupCode();

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: "CASH_ON_PICKUP",
      amount: order.total,
      currency: "KES",
      status: "PENDING",
      reference: order.orderNumber,
    },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentMethod: "CASH_ON_PICKUP",
      paymentStatus: "PENDING",
      status: "CONFIRMED",
      pickupCode,
    },
  });

  const customerEmail =
    guestEmail ?? (session?.user?.email as string | undefined);
  if (customerEmail) {
    await sendPickupConfirmationEmail(
      customerEmail,
      order.orderNumber,
      pickupCode,
      totalKes
    );
  }

  return NextResponse.json({
    success: true,
    payment: {
      id: payment.id,
      status: payment.status,
    },
    pickupCode,
  });
}
