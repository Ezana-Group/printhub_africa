import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import { safePublicFileUrl } from "@/lib/r2";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "STAFF"];

/** GET: Search products by name or description (for admin order form). */
export async function GET(req: Request) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ products: [] });
  }

  let productIds: string[] = [];
  try {
    const searchResults = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Product"
      WHERE tsv @@ websearch_to_tsquery('english', ${q})
      AND "isActive" = true
      ORDER BY ts_rank(tsv, websearch_to_tsquery('english', ${q})) DESC
      LIMIT 100
    `;
    productIds = searchResults.map((r) => r.id);
  } catch (err) {
    console.error("Admin FTS error:", err);
    // Fallback logic could go here, but FTS should be reliable
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds.length > 0 ? productIds : ["___none___"] },
      isActive: true,
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
