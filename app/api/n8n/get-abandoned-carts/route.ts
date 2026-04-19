import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyN8nWebhook } from "@/lib/n8n-verify";

/**
 * Endpoint for n8n's Abandoned Cart Detector (Cron).
 */
export async function GET(req: NextRequest) {
  try {
    const isValid = await verifyN8nWebhook(req);
    if (!isValid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const carts = await prisma.cart.findMany({
      where: {
        updatedAt: {
          lt: new Date(Date.now() - 55 * 60 * 1000), // more than 55 mins
          gt: new Date(Date.now() - 73 * 60 * 60 * 1000), // less than 73 hours
        },
        items: { some: {} },
        customer: { isNot: null }, // must have a customer
        // we can filter where last reminder sent is older than X or null
        // order status must be pending/not created (assuming Cart is separate from created order)
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    const payload = carts.map((cart) => ({
      cartId: cart.id,
      customerId: cart.customerId!,
      customerEmail: cart.customer!.email,
      customerPhone: cart.customer!.phone || null,
      customerName: `${cart.customer?.firstName ?? ""} ${cart.customer?.lastName ?? ""}`.trim() || cart.customer!.email,
      items: cart.items.map((item) => ({
        name: item.product?.name ?? "Custom Item",
        price: Number(item.unitPrice),
        imageUrl: item.product?.imageUrls?.[0] ?? undefined,
      })),
      totalValue: Number(cart.totalKes),
      cartUrl: `https://printhub.africa/cart?id=${cart.id}`,
      abandonedAt: cart.updatedAt.toISOString(),
      // Simple logic to determine which reminder to send
      reminderNumber: cart.recoveryEmailSent3At ? 0 : cart.recoveryEmailSent2At ? 3 : cart.recoveryEmailSent1At ? 2 : 1,
    })).filter(c => c.reminderNumber > 0);

    return NextResponse.json({ carts: payload });
  } catch (err) {
    console.error("[get-abandoned-carts] Error fetching carts:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
