import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    const allCategories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { 
        id: true, 
        name: true, 
        slug: true, 
        parentId: true,
        showInNav: true,
        _count: { select: { products: true } }
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buildTree = (nodes: any[], parentId: string | null = null): any[] => {
      return nodes
        .filter((n) => n.parentId === parentId)
        .map((n) => ({
          ...n,
          children: buildTree(nodes, n.id),
        }));
    };

    const tree = buildTree(allCategories);
    return NextResponse.json(tree);
  } catch (error) {
    console.error("Failed to fetch storefront categories:", error);
    return NextResponse.json([], { status: 500 });
  }
}
