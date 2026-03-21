import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { showInNav: true, isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, parentId: true },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to fetch shop navigation categories:", error);
    return NextResponse.json([], { status: 500 });
  }
}
