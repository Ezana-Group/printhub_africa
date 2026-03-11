import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/shipping/fee?county=Nairobi
 * Returns standard/express/pickup fees and estimated days for the county.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const county = searchParams.get("county")?.trim() || "";

  try {
    // Optional: resolve from DeliveryZone if you have zones by county
    const zones = await prisma.deliveryZone.findMany({
      where: { isActive: true, counties: { has: county } },
      orderBy: { sortOrder: "asc" },
      take: 1,
    });

    if (zones.length > 0) {
      const z = zones[0];
      return NextResponse.json({
        standard: Number(z.feeKes),
        express: county.toLowerCase() === "nairobi" ? Number(z.feeKes) * 2 : null,
        pickup: 0,
        estimatedDays: { standard: `${z.minDays}-${z.maxDays}`, express: "1-2" },
      });
    }

    // Default fee schedule when no zone matches
    const isNairobi = county.toLowerCase() === "nairobi";
    return NextResponse.json({
      standard: 300,
      express: isNairobi ? 600 : null,
      pickup: 0,
      estimatedDays: { standard: "3-5", express: "1-2" },
    });
  } catch (e) {
    console.error("Shipping fee error:", e);
    return NextResponse.json(
      { standard: 300, express: null, pickup: 0, estimatedDays: { standard: "3-5", express: "1-2" } },
      { status: 200 }
    );
  }
}
