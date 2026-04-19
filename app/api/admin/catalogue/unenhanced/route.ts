import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        aiDescriptionGenerated: false,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        images: true,
        category: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    return NextResponse.json(products);
  } catch (err) {
    console.error("[unenhanced-products-get]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
