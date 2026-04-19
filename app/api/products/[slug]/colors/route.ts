import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const colors = await prisma.productFilamentColor.findMany({
      where: {
        productId: product.id,
        isAvailable: true,
      },
      include: {
        filamentColor: true,
      },
      orderBy: {
        filamentColor: { name: "asc" },
      },
    });

    return NextResponse.json(
      colors.map((c) => ({
        id: c.filamentColor.id,
        name: c.filamentColor.name,
        hexCode: c.filamentColor.hexCode,
      }))
    );
  } catch (e) {
    console.error("Fetch product colors error:", e);
    return NextResponse.json(
      { error: "Failed to fetch colors" },
      { status: 500 }
    );
  }
}
