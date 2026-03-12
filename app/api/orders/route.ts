import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureUniqueOrderNumber } from "@/lib/order-utils";
import { createTrackingEvent } from "@/lib/tracking";
import { calculateCartTotals } from "@/lib/cart-calculations";
import { z } from "zod";

const createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().optional(),
      variantId: z.string().optional(),
      catalogueItemId: z.string().optional(),
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
  shippingCost: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  notes: z.string().optional(),
  pickupLocationId: z.string().optional(),
  preferredCourierId: z.string().optional(),
  deliveryNotes: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  let body: unknown;
  try {
    body = await req.json();
  } catch (e) {
    console.error("Orders POST: invalid or empty JSON body", e);
    return NextResponse.json(
      { error: "Invalid request body. Please refresh and try again." },
      { status: 400 }
    );
  }
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { items, shippingAddress: reqAddress, shippingCost: reqShipping = 0, discount: reqDiscount = 0, notes, pickupLocationId, preferredCourierId, deliveryNotes } = parsed.data;
  const isPickup = reqAddress.deliveryMethod?.toLowerCase() === "pickup";

  let orderCourierId: string | null = null;
  if (preferredCourierId && !isPickup) {
    const courier = await prisma.courier.findFirst({ where: { id: preferredCourierId, isActive: true } });
    if (courier) orderCourierId = courier.id;
  }

  let shippingAddress = reqAddress;
  let orderPickupLocationId: string | null = null;
  if (isPickup && pickupLocationId) {
    const location = await prisma.pickupLocation.findUnique({ where: { id: pickupLocationId, isActive: true } });
    if (location) {
      orderPickupLocationId = location.id;
      const notesLine = [location.instructions, deliveryNotes].filter(Boolean).join("; ");
      shippingAddress = {
        ...reqAddress,
        street: notesLine ? `${location.street}${location.postalCode ? `, ${location.postalCode}` : ""} — ${notesLine}` : `${location.street}${location.postalCode ? `, ${location.postalCode}` : ""}`,
        city: location.city,
        county: location.county,
        postalCode: location.postalCode ?? undefined,
      };
    }
  }

  // Prices are VAT-inclusive — use same calculation as cart/checkout
  const { subtotalInclVat, vatAmount, total } = calculateCartTotals(
    items.map((i) => ({ unitPrice: i.unitPrice, quantity: i.quantity })),
    reqShipping,
    reqDiscount
  );
  const subtotal = subtotalInclVat;
  const tax = vatAmount;
  const shippingCost = reqShipping;
  const discount = reqDiscount;

  const hasPOD = items.some((i) => i.catalogueItemId);
  const orderType = hasPOD ? "POD" : "SHOP";
  let orderNumber: string;
  try {
    orderNumber = await ensureUniqueOrderNumber(orderType);
  } catch (e) {
    console.error("Order number generation error:", e);
    return NextResponse.json(
      { error: "Unable to generate order number. Please try again." },
      { status: 500 }
    );
  }

  try {
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: session?.user?.id ?? null,
        status: "PENDING",
        type: orderType,
        subtotal,
        tax,
        shippingCost,
        discount,
        total,
        currency: "KES",
        notes: [notes, deliveryNotes].filter(Boolean).join(" — ") || undefined,
        pickupLocationId: orderPickupLocationId,
        courierId: orderCourierId ?? undefined,
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

    // Save shipping address to user's profile (SavedAddress) when logged in and delivery is not pickup
    const isPickupDelivery = reqAddress.deliveryMethod?.toLowerCase() === "pickup";
    if (session?.user?.id && !isPickupDelivery && order.shippingAddress) {
      try {
        const count = await prisma.savedAddress.count({ where: { userId: session.user.id } });
        if (count < 5) {
          const line1 = (order.shippingAddress.street ?? "").trim();
          const city = (order.shippingAddress.city ?? "").trim();
          const county = (order.shippingAddress.county ?? "").trim();
          if (line1 && city && county) {
            const existing = await prisma.savedAddress.findFirst({
              where: {
                userId: session.user.id,
                line1,
                city,
                county,
              },
            });
            if (!existing) {
              await prisma.savedAddress.create({
                data: {
                  userId: session.user.id,
                  label: "Home",
                  recipientName: order.shippingAddress.fullName?.trim() || undefined,
                  phone: order.shippingAddress.phone?.trim() || undefined,
                  line1,
                  line2: undefined,
                  city,
                  county,
                  isDefault: count === 0,
                },
              });
            }
          }
        }
      } catch (e) {
        console.error("Save address to profile:", e);
        // non-fatal
      }
    }

    return NextResponse.json({ order });
  } catch (e) {
    console.error("Order create error:", e);
    return NextResponse.json(
      { error: "Failed to create order. Please try again." },
      { status: 500 }
    );
  }
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
