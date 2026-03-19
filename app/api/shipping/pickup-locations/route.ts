import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/shipping/pickup-locations?county=Nairobi
 * Returns active pickup locations for checkout. Optional county filter to show "near you" first.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const county = searchParams.get("county")?.trim() || null;
  try {
    const locations = await prisma.pickupLocation.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        city: true,
        county: true,
        street: true,
        postalCode: true,
        instructions: true,
      },
    });
    if (county) {
      const sameCounty = locations.filter((l) => l.county.toLowerCase() === county.toLowerCase());
      const other = locations.filter((l) => l.county.toLowerCase() !== county.toLowerCase());
      return NextResponse.json({ sameCounty, other, all: locations });
    }
    return NextResponse.json({ all: locations, sameCounty: [], other: locations });
  } catch (e) {
    console.error("Pickup locations error:", e);
    return NextResponse.json({ all: [], sameCounty: [], other: [] });
  }
}
