import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/shipping/courier-locations?county=Nairobi
 * Returns active courier partners that have location data (address/city/county)
 * for "nearest courier location" selection at checkout.
 * Optional county param: sameCounty / other grouping (like pickup locations).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const county = searchParams.get("county")?.trim()?.toLowerCase() || null;
  try {
    const couriers = await prisma.courier.findMany({
      where: {
        isActive: true,
        OR: [{ city: { not: null } }, { county: { not: null } }, { address: { not: null } }],
      },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        county: true,
        phone: true,
        trackingUrl: true,
      },
    });
    const list = couriers.map((c) => ({
      id: c.id,
      name: c.name,
      address: c.address ?? undefined,
      city: c.city ?? undefined,
      county: c.county ?? undefined,
      phone: c.phone ?? undefined,
      trackingUrl: c.trackingUrl ?? undefined,
    }));
    if (county) {
      const sameCounty = list.filter((c) => (c.county ?? "").toLowerCase() === county);
      const other = list.filter((c) => (c.county ?? "").toLowerCase() !== county);
      return NextResponse.json({ sameCounty, other, all: list });
    }
    return NextResponse.json({ sameCounty: [], other: list, all: list });
  } catch (e) {
    console.error("Courier locations error:", e);
    return NextResponse.json({ sameCounty: [], other: [], all: [] });
  }
}
