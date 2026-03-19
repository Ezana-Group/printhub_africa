/**
 * PATCH /api/checkout/cart — Save cart for abandoned-cart recovery.
 * Body: { sessionId?, email?, phone?, items? }
 * If sessionId not provided, creates a new cart and returns cartId + sessionId.
 * When user completes step 1 (contact), call with email + phone + items to record for recovery emails.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  sessionId: z.string().optional(),
  cartId: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().optional(),
        variantId: z.string().optional(),
        catalogueItemId: z.string().optional(),
        quantity: z.number().min(0),
        unitPrice: z.number(),
        name: z.string().optional(),
        slug: z.string().optional(),
        type: z.string().optional(),
      })
    )
    .optional(),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const { sessionId, cartId, email, phone, items } = parsed.data;

  const userId = session?.user?.id ?? null;

  // Find existing cart by cartId, sessionId, or userId
  let cart = null;
  if (cartId) {
    cart = await prisma.cart.findFirst({
      where: { id: cartId, convertedAt: null },
    });
  }
  if (!cart && sessionId) {
    cart = await prisma.cart.findFirst({
      where: { sessionId, convertedAt: null },
    });
  }
  if (!cart && userId) {
    cart = await prisma.cart.findFirst({
      where: { userId, convertedAt: null },
    });
  }

  const now = new Date();
  const updateData: {
    userId?: string | null;
    sessionId?: string | null;
    email?: string | null;
    phone?: string | null;
    items?: import("@prisma/client").Prisma.InputJsonValue;
    lastActivityAt?: Date;
  } = { lastActivityAt: now };

  if (userId != null) updateData.userId = userId;
  if (sessionId != null) updateData.sessionId = sessionId;
  if (email !== undefined) updateData.email = email || null;
  if (phone !== undefined) updateData.phone = phone || null;
  if (items !== undefined) updateData.items = items ?? [];

  if (cart) {
    const updated = await prisma.cart.update({
      where: { id: cart.id },
      data: updateData,
    });
    return NextResponse.json({
      cartId: updated.id,
      sessionId: updated.sessionId ?? updated.id,
    });
  }

  // Create new cart
  const newCart = await prisma.cart.create({
    data: {
      userId: userId ?? undefined,
      sessionId: sessionId ?? undefined,
      email: updateData.email ?? undefined,
      phone: updateData.phone ?? undefined,
      items: (updateData.items as object) ?? [],
      lastActivityAt: now,
    },
  });
  return NextResponse.json({
    cartId: newCart.id,
    sessionId: newCart.sessionId ?? newCart.id,
  });
}
