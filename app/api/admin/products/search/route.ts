import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safePublicFileUrl } from "@/lib/r2";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "STAFF"];

/** GET: Search products by name or description (for admin order form). */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ products: [] });
  }

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      basePrice: true,
      stock: true,
      images: true,
      category: { select: { name: true } },
      productImages: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        take: 1,
        select: { url: true, storageKey: true, isPrimary: true },
      },
    },
    take: 20,
  });

  const result = products.map((p) => {
    const img = p.productImages[0];
    const rawUrl = p.images?.[0] ?? img?.url ?? null;
    const mainImageUrl =
      rawUrl && rawUrl.startsWith("http")
        ? rawUrl
        : img?.storageKey
          ? safePublicFileUrl(img.storageKey)
          : null;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      basePrice: Number(p.basePrice),
      stock: p.stock,
      category: p.category,
      mainImageUrl,
    };
  });

  return NextResponse.json({ products: result });
}
