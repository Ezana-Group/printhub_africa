import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX = 10;

// In-memory rate limit (per IP). For production consider Redis.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry) return false;
  if (now > entry.resetAt) {
    rateLimitMap.delete(ip);
    return false;
  }
  return entry.count >= RATE_LIMIT_MAX;
}

function recordRequest(ip: string): void {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return;
  }
  entry.count++;
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a few minutes." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get("order")?.trim()?.toUpperCase();
  const email = searchParams.get("email")?.trim()?.toLowerCase();
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!orderNumber && !email) {
    return NextResponse.json(
      { error: "Provide order number (order=) or email (email=)" },
      { status: 400 }
    );
  }
  if (!userId && orderNumber && !email) {
    return NextResponse.json(
      { error: "Email required to track by order number (or sign in)" },
      { status: 400 }
    );
  }

  recordRequest(ip);

  // Logged-in: look up by order number (ownership validated). Guest: order + email.
  const order = await prisma.order.findFirst({
    where: userId && orderNumber
      ? { orderNumber, userId }
      : orderNumber && email
        ? { orderNumber, shippingAddress: { email } }
        : email
          ? { shippingAddress: { email } }
          : { id: "impossible" },
    include: {
      shippingAddress: true,
      courier: { select: { id: true, name: true, phone: true, trackingUrl: true } },
      trackingEvents: {
        where: { isPublic: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // If only email provided, don't expose order details unless we have a single match
  if (email && !orderNumber) {
    const count = await prisma.order.count({
      where: { shippingAddress: { email } },
    });
    if (count > 1) {
      return NextResponse.json(
        { error: "Multiple orders found. Please provide your order number." },
        { status: 400 }
      );
    }
  }

  const itemCount = await prisma.orderItem.count({ where: { orderId: order.id } });

  return NextResponse.json({
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      placedAt: order.createdAt,
      itemCount,
      total: Number(order.total),
      estimatedDelivery: order.estimatedDelivery,
      deliveryType: order.shippingAddress?.deliveryMethod ?? "standard",
      trackingNumber: order.trackingNumber ?? undefined,
      courier: order.courier
        ? {
            name: order.courier.name,
            phone: order.courier.phone ?? undefined,
            trackingUrl: order.courier.trackingUrl ?? undefined,
          }
        : undefined,
    },
    events: order.trackingEvents.map((e) => ({
      status: e.status,
      title: e.title,
      description: e.description,
      location: e.location,
      courierRef: e.courierRef,
      createdAt: e.createdAt,
    })),
  });
}
