import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { prisma } from "@/lib/prisma";
import { ensureUniqueOrderNumber } from "@/lib/order-utils";
import { createTrackingEvent } from "@/lib/tracking";
import { calculateOrderPriceServerSide } from "@/lib/order-price-calculator";
import { reserveOrderStock } from "@/lib/order-stock";
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
  deliveryZoneId: z.string().optional(),
  estimatedDelivery: z.string().datetime().optional(),
  cartId: z.string().optional(),
  corporateId: z.string().optional(),
  isNetTerms: z.boolean().optional(),
  poReference: z.string().max(200).optional(),
  loyaltyPoints: z.number().min(0).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptionsCustomer);
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
  const { 
    items, 
    shippingAddress: reqAddress, 
    shippingCost: reqShipping = 0, 
    discount: reqDiscount = 0, 
    notes, 
    pickupLocationId, 
    preferredCourierId, 
    deliveryNotes, 
    deliveryZoneId: reqDeliveryZoneId, 
    estimatedDelivery: reqEstimatedDelivery, 
    cartId: reqCartId, 
    corporateId: reqCorporateId, 
    isNetTerms: reqIsNetTerms, 
    poReference: reqPoReference,
    loyaltyPoints: reqLoyaltyPoints = 0
  } = parsed.data;

  const isPickup = reqAddress.deliveryMethod?.toLowerCase() === "pickup";
  const isShipping = !isPickup && (reqAddress.deliveryMethod === "Standard" || reqAddress.deliveryMethod === "Express");
  const deliveryMethod = reqAddress.deliveryMethod === "Express" ? "EXPRESS" : "STANDARD";

  let loyaltyDiscountKes = 0;
  if (reqLoyaltyPoints > 0 && session?.user?.id) {
    try {
      const config = await prisma.loyaltySettings.findUnique({ where: { id: "default" } });
      loyaltyDiscountKes = Math.floor(reqLoyaltyPoints * (config?.kesPerPointRedeemed ?? 1));
    } catch (e) {
      console.error("Loyalty config fetch error on order create:", e);
    }
  }

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

  // Re-validate stock before creating order
  for (const item of items) {
    if (!item.productId) continue;
    const inv = await prisma.inventory.findFirst({
      where: { productId: item.productId, productVariantId: item.variantId ?? null },
    });
    if (inv) {
      const available = inv.quantity - inv.reservedQuantity;
      if (item.quantity > available) {
        return NextResponse.json({ error: `Insufficient stock for one or more items. Max: ${available}.` }, { status: 409 });
      }
      continue;
    }
    let stock = 0;
    if (item.variantId) {
      const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId }, select: { stock: true } });
      stock = variant?.stock ?? 0;
    } else {
      const product = await prisma.product.findUnique({ where: { id: item.productId }, select: { stock: true } });
      stock = product?.stock ?? 0;
    }
    if (item.quantity > stock) {
      return NextResponse.json({ error: `Insufficient stock. Max: ${stock}.` }, { status: 409 });
    }
  }

  // Server-side price recalculation (CRIT-1)
  const { 
    items: itemsWithServerPrices, 
    subtotal, 
    discountAmount: effectiveDiscount, 
    deliveryFee: shippingCost, 
    vatAmount, 
    total: calculatedTotal 
  } = await calculateOrderPriceServerSide(
    items.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
    null, // coupon handling can be expanded here if implemented
    isPickup ? 'PICKUP' : (reqAddress.deliveryMethod === 'Express' ? 'EXPRESS' : 'STANDARD'),
    session?.user?.id,
    {
      loyaltyPoints: reqLoyaltyPoints,
      corporateId: reqCorporateId
    }
  );

  // Sentry mismatch guard
  const clientTotal = Number(parsed.data.items.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0)) + 
                      Number(reqShipping || 0) - 
                      Number(reqDiscount || 0);
  
  if (Math.abs(clientTotal - calculatedTotal) > 1) {
    console.error(`[SECURITY_CRITICAL] Price mismatch detected for user ${session?.user?.id || 'GUEST'}. Client total: ${clientTotal}, Server total: ${calculatedTotal}. Possible manipulation attempt.`);
    // Log to a dedicated security audit log
    await prisma.auditLog.create({
      data: {
        userId: session?.user?.id || 'GUEST',
        action: 'ORDER_PRICE_MISMATCH',
        entity: 'Order',
        after: { clientTotal, serverTotal: calculatedTotal, items: parsed.data.items } as any,
      }
    }).catch(err => console.error("Failed to log price mismatch:", err));
  }

  const vatAmountResult = vatAmount;
  const total = calculatedTotal;


  const hasPOD = items.some((i) => i.catalogueItemId);
  const orderType = hasPOD ? "POD" : "SHOP";
  let orderNumber: string;
  try {
    orderNumber = await ensureUniqueOrderNumber(orderType);
  } catch (e) {
    console.error("Order number error:", e);
    return NextResponse.json({ error: "Failed to generate order number" }, { status: 500 });
  }

  let orderEstimatedDelivery: Date | undefined;
  if (reqEstimatedDelivery) {
    try { orderEstimatedDelivery = new Date(reqEstimatedDelivery); } catch {}
  }

  let orderDeliveryZoneId: string | null = null;
  if (isShipping && reqDeliveryZoneId) {
    const zone = await prisma.deliveryZone.findFirst({ where: { id: reqDeliveryZoneId, isActive: true } });
    if (zone) orderDeliveryZoneId = zone.id;
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const reserve = await reserveOrderStock(
        items.filter((i) => i.productId).map((i) => ({ productId: i.productId!, variantId: i.variantId, quantity: i.quantity })),
        tx
      );
      if (!reserve.ok) throw new Error(reserve.error);

      if (reqLoyaltyPoints > 0 && session?.user?.id) {
        const { redeemLoyaltyPoints } = await import("@/lib/loyalty");
        const res = await redeemLoyaltyPoints(session.user.id, reqLoyaltyPoints, orderNumber);
        if (!res.ok) throw new Error(res.error ?? "Loyalty points redemption failed");
      }

      for (const item of items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { soldThisMonth: { increment: item.quantity } } as any,
          });
        }
      }

      return tx.order.create({
        data: {
          orderNumber,
          userId: session?.user?.id ?? null,
          status: "PENDING",
          type: orderType,
          subtotal: subtotal,
          tax: vatAmountResult,
          shippingCost: shippingCost,
          discount: effectiveDiscount,
          total: calculatedTotal,
          currency: "KES",
          notes: [notes, deliveryNotes].filter(Boolean).join(" — ") || undefined,
          pickupLocationId: orderPickupLocationId,
          courierId: orderCourierId ?? undefined,
          deliveryZoneId: orderDeliveryZoneId ?? undefined,
          estimatedDelivery: orderEstimatedDelivery ?? undefined,
          corporateId: reqCorporateId ?? undefined,
          isNetTerms: reqIsNetTerms || undefined,
          poReference: reqPoReference ?? undefined,
          placedBy: session?.user?.id ?? undefined,
          items: {
            create: itemsWithServerPrices.map((i, index) => {
              const originalItem = items[index];
              return {
                productId: i.productId ?? null,
                productVariantId: i.variantId ?? null,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                customizations: (originalItem.customizations ?? undefined) as any,
                instructions: originalItem.instructions ?? undefined,
              };
            }),
          },
          shippingAddress: { create: shippingAddress },
          ...(isShipping && {
            delivery: {
              create: {
                deliveryZoneId: orderDeliveryZoneId ?? undefined,
                method: deliveryMethod,
                status: "PENDING",
                estimatedDelivery: orderEstimatedDelivery ?? undefined,
                assignedCourierId: orderCourierId ?? undefined,
              },
            },
          }),
        },
        include: { items: true, shippingAddress: true, delivery: true },
      });
    });

    await createTrackingEvent(order.id, "PENDING");

    if (reqCartId) {
      try { await prisma.cart.updateMany({ where: { id: reqCartId, convertedAt: null }, data: { convertedAt: new Date() } }); } catch {}
    }

    return NextResponse.json({ order });
  } catch (e) {
    console.error("Order create error:", e);
    const msg = e instanceof Error ? e.message : "Failed to create order";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
