import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/notify-me
 * Register a user for back-in-stock notifications.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, phone, productId } = await req.json();

    if (!productId || (!email && !phone)) {
      return NextResponse.json(
        { error: "Product ID and either Email or Phone are required" },
        { status: 400 }
      );
    }

    // Upsert to avoid duplicates for the same product + (email or phone)
    // @ts-ignore
    await prisma.stockNotification.upsert({
      where: {
        id: `notify-${productId}-${email || phone}`,
      },
      update: {
        email: email || undefined,
        phone: phone || undefined,
        notifiedAt: null, // Reset if they already signed up before
      },
      create: {
        id: `notify-${productId}-${email || phone}`,
        productId,
        email: email || null,
        phone: phone || null,
      },
    });

    return NextResponse.json({ success: true, message: "Notification registered" });
  } catch (error) {
    console.error("Notify Me Error:", error);
    return NextResponse.json(
      { error: "Failed to register notification" },
      { status: 500 }
    );
  }
}
