import { NextRequest, NextResponse } from "next/server";
import { n8nGuard } from "@/lib/n8n-verify";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const guard = await n8nGuard(req);
  if (guard) return guard;

  try {
    // Reset weekly metrics
    await prisma.product.updateMany({
      data: {
        weeklyViews: 0,
        featuredThisWeek: false,
      },
    });

    return NextResponse.json({ success: true, message: "Weekly metrics reset" });
  } catch (err) {
    console.error("[weekly-reset]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
