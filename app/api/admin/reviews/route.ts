import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

/**
 * GET /api/admin/reviews — list reviews (all or pending only)
 * Query: status=pending|all
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminApi({ permission: "products_view" });
  if (auth instanceof NextResponse) return auth;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const pendingOnly = status === "pending";
  const reviews = await prisma.productReview.findMany({
    where: pendingOnly ? { isApproved: false } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      product: { select: { id: true, name: true, slug: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
  return NextResponse.json(
    reviews.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }))
  );
}
