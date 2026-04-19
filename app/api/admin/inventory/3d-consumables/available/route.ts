import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

export async function GET() {
  const auth = await requireAdminApi({ permission: "inventory_view" });
  if (auth instanceof NextResponse) return auth;

  try {
    const items = await prisma.threeDConsumable.findMany({
      where: {
        quantity: { gte: 1 },
      },
      select: {
        id: true,
        name: true,
        kind: true,
        brand: true,
        colourHex: true,
        quantity: true,
        specification: true,
        lowStockThreshold: true,
        costPerKgKes: true,
        weightPerSpoolKg: true,
      },
      orderBy: [{ kind: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(items);
  } catch (e) {
    console.error("Available consumables fetch error:", e);
    return NextResponse.json(
      { error: "Failed to fetch available consumables" },
      { status: 500 }
    );
  }
}
