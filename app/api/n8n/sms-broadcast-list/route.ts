import { NextRequest, NextResponse } from "next/server";
import { n8nGuard } from "@/lib/n8n-verify";
import { prisma } from "@/lib/prisma";

/**
 * Returns a list of mobile numbers for customers who have opted-in.
 * Secured by x-printhub-signature.
 */
export async function GET(req: NextRequest) {
  const guard = await n8nGuard(req);
  if (guard) return guard;

  try {
    const customers = await prisma.user.findMany({
      where: {
        smsMarketingOptIn: true,
        phone: { not: null },
      },
      select: {
        id: true,
        phone: true,
        name: true,
      }
    });

    return NextResponse.json({
      count: customers.length,
      recipients: customers.filter(c => c.phone).map(c => ({
        id: c.id,
        phone: c.phone,
        name: c.name || "Customer",
      })),
    });
  } catch (err) {
    console.error("[sms-broadcast-list]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
