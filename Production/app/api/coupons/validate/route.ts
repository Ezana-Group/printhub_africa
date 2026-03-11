import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Public API: validate a coupon code for a given cart subtotal.
 * Used by the cart page when the customer clicks "Apply".
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    const subtotal = typeof body.subtotal === "number" ? body.subtotal : 0;

    if (!code) {
      return NextResponse.json({ valid: false, error: "Please enter a coupon code." }, { status: 200 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      return NextResponse.json({ valid: false, error: "This coupon code is not valid." }, { status: 200 });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ valid: false, error: "This coupon is no longer active." }, { status: 200 });
    }

    const now = new Date();
    if (coupon.startDate > now) {
      return NextResponse.json({ valid: false, error: "This coupon is not yet valid." }, { status: 200 });
    }
    if (coupon.expiryDate < now) {
      return NextResponse.json({ valid: false, error: "This coupon has expired." }, { status: 200 });
    }

    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ valid: false, error: "This coupon has reached its usage limit." }, { status: 200 });
    }

    const minOrder = coupon.minOrderAmount != null ? Number(coupon.minOrderAmount) : 0;
    if (subtotal < minOrder) {
      return NextResponse.json(
        {
          valid: false,
          error: minOrder > 0
            ? `Minimum order amount for this coupon is KES ${minOrder.toLocaleString()}.`
            : "Order total is too low for this coupon.",
        },
        { status: 200 }
      );
    }

    const value = Number(coupon.value);
    let discount = 0;

    switch (coupon.type) {
      case "PERCENTAGE":
        discount = Math.round((subtotal * value) / 100);
        break;
      case "FIXED":
        discount = Math.min(value, subtotal);
        break;
      case "FREE_SHIPPING":
        discount = 0;
        break;
      default:
        discount = 0;
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      type: coupon.type,
      discount,
      message:
        coupon.type === "FREE_SHIPPING"
          ? "Free shipping will be applied at checkout."
          : `You save KES ${discount.toLocaleString()}.`,
    });
  } catch (e) {
    console.error("Coupon validate error:", e);
    return NextResponse.json({ valid: false, error: "Could not validate coupon." }, { status: 500 });
  }
}
