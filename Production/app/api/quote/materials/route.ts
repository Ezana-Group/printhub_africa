import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const materials = await prisma.printingMedium.findMany({
    where: { isActive: true, slug: { not: null } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(
    materials.map((m) => ({
      id: m.slug ?? m.id,
      name: m.name,
      pricePerSqm: Number(m.pricePerSqMeter),
    }))
  );
}
