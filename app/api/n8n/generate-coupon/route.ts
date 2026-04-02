import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyN8nWebhook } from "@/lib/n8n-verify";

/**
 * Used by n8n to generate a unique discount code for abandoned cart recovery.
 */
export async function POST(req: NextRequest) {
  try {
    const isValid = await verifyN8nWebhook(req);
    if (!isValid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { customerId, discount, type, expiresInHours, source } = await req.json();

    // Unique code generation: source-short-uuid
    const code = `${source?.toUpperCase() ?? "CART"}-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const coupon = await prisma.coupon.create({
      data: {
        code,
        discountValue: discount,
        discountType: type === "percentage" ? "PERCENTAGE" : "FIXED",
        maxUses: 1,
        expiresAt,
        isActive: true,
        description: `Auto-generated for abandoned cart recovery (#${customerId})`,
        metadata: {
          customerId,
          source: source || "n8n_abandoned_cart",
        },
      },
    });

    return NextResponse.json({ code: coupon.code, expiresAt: coupon.expiresAt });
  } catch (err) {
    console.error("[generate-coupon] Error generating coupon:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
