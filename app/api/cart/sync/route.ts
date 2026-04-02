/**
 * POST /api/cart/sync
 * Sync client cart (Zustand) to DB for authenticated users. Used by abandoned-cart cron.
 * Fire-and-forget: 200 on success; no session → 200 (guest carts not synced).
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const cartItemSchema = z.union([
  z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    quantity: z.number().min(1),
    unitPrice: z.number(),
    name: z.string(),
    slug: z.string(),
    type: z.literal("SHOP").optional(),
  }),
  z.object({
    type: z.literal("CATALOGUE"),
    catalogueItemId: z.string(),
    name: z.string(),
    slug: z.string(),
    materialCode: z.string(),
    materialName: z.string(),
    colourHex: z.string(),
    colourName: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number(),
  }),
]);

const bodySchema = z.object({
  items: z.array(cartItemSchema),
  couponCode: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: true });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { items, couponCode: _couponCode } = parsed.data;
  void _couponCode; // reserved for future coupon application
  const userId = session.user.id;
  const email = session.user.email ?? undefined;

  try {
    const itemsJson = items as object[];
    const existing = await prisma.cart.findFirst({
      where: { userId, convertedAt: null },
    });
    if (existing) {
      await prisma.cart.update({
        where: { id: existing.id },
        data: {
          items: itemsJson,
          lastActivityAt: new Date(),
          updatedAt: new Date(),
          ...(email && { email }),
        },
      });
    } else {
      await prisma.cart.create({
        data: {
          userId,
          email: email ?? null,
          items: itemsJson,
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
  } catch (e) {
    console.error("Cart sync error:", e);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
