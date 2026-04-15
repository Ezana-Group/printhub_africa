/**
 * GET /api/n8n/get-customer-context?phone=<e164>
 *
 * Called by the WhatsApp auto-reply workflow to give Claude context about
 * the customer before generating a response.
 *
 * Returns: name, email, order count, last order status, loyalty points.
 * Sensitive fields (password hash, TOTP secret, etc.) are never returned.
 *
 * Auth: x-printhub-signature header matching N8N_WEBHOOK_SECRET
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateN8nSecret, n8nUnauthorized } from "@/lib/n8n-auth";

export async function GET(req: Request) {
  if (!validateN8nSecret(req)) return n8nUnauthorized();

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone")?.trim();

  if (!phone) {
    return NextResponse.json({ error: "phone query param required" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { phone },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      loyaltyPoints: true,
      createdAt: true,
      orders: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) {
    return NextResponse.json({
      found: false,
      phone,
      context: "New contact — no account found. Invite them to register at printhub.africa.",
    });
  }

  const lastOrder = user.orders[0] ?? null;

  return NextResponse.json({
    found: true,
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    loyaltyPoints: user.loyaltyPoints,
    memberSince: user.createdAt,
    totalOrders: user.orders.length,
    lastOrder: lastOrder
      ? {
          orderNumber: lastOrder.orderNumber,
          status: lastOrder.status,
          total: lastOrder.total,
          date: lastOrder.createdAt,
        }
      : null,
    recentOrders: user.orders,
  });
}
