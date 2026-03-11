import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureUniqueOrderNumber, calculateTax } from "@/lib/order-utils";
import { createTrackingEvent } from "@/lib/tracking";
import { z } from "zod";

const createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().optional(),
      variantId: z.string().optional(),
      quantity: z.number().min(1),
      unitPrice: z.number(),
      customizations: z.record(z.string(), z.unknown()).optional(),
      instructions: z.string().optional(),
    })
  ),
  shippingAddress: z.object({
    fullName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    street: z.string(),
    city: z.string(),
    county: z.string(),
    postalCode: z.string().optional(),
    deliveryMethod: z.string().optional(),
  }),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const parsed = createOrderSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { items, shippingAddress, notes } = parsed.data;

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const tax = calculateTax(subtotal);
  const shippingCost = 0; // TODO: calculate by county
  const discount = 0;
  const total = subtotal + tax + shippingCost - discount;

  const orderNumber = await ensureUniqueOrderNumber();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: session?.user?.id ?? null,
      status: "PENDING",
      type: "SHOP",
      subtotal,
      tax,
      shippingCost,
      discount,
      total,
      currency: "KES",
      notes,
      items: {
        create: items.map((i) => ({
          productId: i.productId ?? null,
          productVariantId: i.variantId ?? null,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          customizations: (i.customizations ?? undefined) as object | undefined,
          instructions: i.instructions ?? undefined,
        })),
      },
      shippingAddress: {
        create: shippingAddress,
      },
    },
    include: {
      items: true,
      shippingAddress: true,
    },
  });

  await createTrackingEvent(order.id, "PENDING");

  return NextResponse.json({ order });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        items: { include: { product: { select: { name: true, slug: true } } } },
        shippingAddress: true,
      },
    });
    return NextResponse.json(
      orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: Number(o.total),
        currency: o.currency,
        createdAt: o.createdAt,
        itemCount: o.items.length,
      }))
    );
  } catch (e) {
    console.error("Orders list error:", e);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
