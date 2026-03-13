import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/shipping/fee?county=Nairobi
 * Returns standard/express/pickup fees and estimated days for the county.
 * Only returns standard/express when admin has configured Delivery Zones and the county is in one.
 * When no zones exist or county is not in any zone, standard/express are null (customer sees only Pick up).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const county = searchParams.get("county")?.trim() || "";

  try {
    const zones = await prisma.deliveryZone.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    if (zones.length === 0) {
      return NextResponse.json({
        standard: null,
        express: null,
        pickup: 0,
        noZonesConfigured: true,
        estimatedDays: { standard: null, express: null },
      });
    }

    const matchingZone = zones.find((z) => {
      if (z.county && z.county.trim() === county) return true;
      if (!z.counties) return false;
      const list = z.counties.split(",").map((c) => c.trim());
      return list.includes(county);
    });

    if (!matchingZone) {
      return NextResponse.json({
        standard: null,
        express: null,
        pickup: 0,
        estimatedDays: { standard: null, express: null },
      });
    }

    const z = matchingZone;
    const standardFee = Number(z.feeKes);
    const isNairobi = county.toLowerCase() === "nairobi";
    const minDays = z.minDays ?? 3;
    const maxDays = z.maxDays ?? 5;
    return NextResponse.json({
      standard: standardFee,
      express: isNairobi ? standardFee * 2 : null,
      pickup: 0,
      zoneId: z.id,
      zoneName: z.name,
      estimatedDays: {
        standard: `${minDays}-${maxDays}`,
        express: "1-2",
      },
      minDays,
      maxDays,
    });
  } catch (e) {
    console.error("Shipping fee error:", e);
    return NextResponse.json(
      { standard: null, express: null, pickup: 0, noZonesConfigured: true, estimatedDays: { standard: null, express: null } },
      { status: 200 }
    );
  }
}
