import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import { ensureUniqueOrderNumber } from "@/lib/order-utils";
import { createTrackingEvent } from "@/lib/tracking";
import { calculateOrderPriceServerSide } from "@/lib/order-price-calculator";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "STAFF"];

export async function POST(req: Request) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user?.id || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid or empty JSON body" }, { status: 400 });
    }

    const {
      customerId,
      corporateId,
      items,
      deliveryAddress,
      deliveryCounty,
      deliveryMethod: reqDeliveryMethod,
      paymentMethod,
      poReference,
      adminNotes,
    } = body as {
      customerId: string;
      corporateId?: string | null;
      items: Array<{ productId: string; variantId?: string | null; quantity: number; unitPrice: number }>;
      deliveryAddress?: string;
      deliveryCounty?: string;
      deliveryMethod?: string;
      paymentMethod?: string;
      poReference?: string | null;
      adminNotes?: string | null;
      deliveryFee?: number;
      discountAmount?: number;
    };

    if (!customerId || !items?.length) {
      return NextResponse.json(
        { error: "Customer and items are required" },
        { status: 400 }
      );
    }

    const customer = await prisma.user.findFirst({
      where: { id: customerId, role: "CUSTOMER" },
      select: { id: true, name: true, email: true, phone: true },
    });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Server-side price recalculation (CRIT-1)
    const { 
      items: itemsWithServerPrices, 
      subtotal, 
      discountAmount, 
      deliveryFee, 
      vatAmount, 
      total: calculatedTotal 
    } = await calculateOrderPriceServerSide(
      items.map(i => ({ productId: i.productId, variantId: i.variantId || undefined, quantity: i.quantity })),
      null,
      reqDeliveryMethod === 'Express' ? 'EXPRESS' : 'STANDARD',
      customerId,
      {
        corporateId: corporateId
      }
    );

    // Sentry mismatch guard
    const clientSubtotal = items.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
    if (Math.abs(clientSubtotal - subtotal) > 1) {
      console.warn(`[SECURITY] Admin price mismatch detected for customer ${customerId}. Client subtotal: ${clientSubtotal}, Server subtotal: ${subtotal}`);
    }

    let orderNumber: string;
    try {
      orderNumber = await ensureUniqueOrderNumber("SHOP");
    } catch (e) {
      console.error("Order number generation error:", e);
      return NextResponse.json(
        { error: "Unable to generate order number" },
        { status: 500 }
      );
    }

    const isNetTerms = paymentMethod === "NET_TERMS";
    const paymentStatus = isNetTerms ? "PENDING" : "AWAITING_CONFIRMATION";

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: customerId,
        corporateId: corporateId ?? null,
        poReference: poReference ?? null,
        status: "CONFIRMED",
        type: "SHOP",
        paymentMethod: paymentMethod ?? "CASH_ON_PICKUP",
        paymentStatus,
        subtotal: subtotal,
        tax: vatAmount,
        shippingCost: deliveryFee,
        discount: discountAmount,
        total: calculatedTotal,
        currency: "KES",
        notes: adminNotes ?? null,
        items: {
          create: itemsWithServerPrices.map((item) => ({
            productId: item.productId,
            productVariantId: item.variantId ?? null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
        shippingAddress: {
          create: {
            fullName: customer.name ?? "Customer",
            email: customer.email,
            phone: customer.phone ?? "",
            street: deliveryAddress ?? "",
            city: deliveryCounty ?? "",
            county: deliveryCounty ?? "",
            deliveryMethod: reqDeliveryMethod ?? undefined,
          },
        },
        timeline: {
          create: {
            status: "CONFIRMED",
            message: `Order created by admin${session.user.name ? ` (${session.user.name})` : ""}`,
            updatedBy: session.user.id,
          },
        },
      },
      include: {
        items: true,
        shippingAddress: true,
      },
    });

    try {
      await createTrackingEvent(order.id, "CONFIRMED", {
        createdBy: session.user.id,
        description: `Order manually created by ${session.user.name ?? "staff"}.`,
      });
    } catch (e) {
      console.error("Tracking event creation error:", e);
    }

    if (corporateId && isNetTerms) {
      await prisma.corporateAccount.update({
        where: { id: corporateId },
        data: { creditUsed: { increment: Math.round(calculatedTotal) } },
      });
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: Number(order.total),
      },
    });
  } catch (err: any) {
    console.error("Admin order creation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
