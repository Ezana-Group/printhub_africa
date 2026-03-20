import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await prisma.navigationItem.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: "asc" },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Public navigation fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch navigation" }, { status: 500 });
  }
}
