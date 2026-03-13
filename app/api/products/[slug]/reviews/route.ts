import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

/**
 * GET /api/products/[slug]/reviews — list approved reviews for product (with summary)
 * Query: sort=recent|rating, page=1, limit=10
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    select: { id: true },
  });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
  const sort = searchParams.get("sort") === "rating" ? "rating" : "recent";

  const [reviews, agg] = await Promise.all([
    prisma.productReview.findMany({
      where: { productId: product.id, isApproved: true },
      orderBy: sort === "rating" ? [{ rating: "desc" }, { createdAt: "desc" }] : { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { name: true } },
      },
    }),
    prisma.productReview.aggregate({
      where: { productId: product.id, isApproved: true },
      _count: { id: true },
      _avg: { rating: true },
    }),
  ]);

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      isVerified: r.isVerified,
      createdAt: r.createdAt.toISOString(),
      userName: r.user?.name ?? "Customer",
    })),
    summary: {
      averageRating: agg._avg.rating != null ? Math.round(agg._avg.rating * 10) / 10 : null,
      totalCount: agg._count.id,
    },
    page,
    limit,
  });
}

const createSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().max(2000).optional(),
});

/**
 * POST /api/products/[slug]/reviews — create review (logged-in user)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to write a review" }, { status: 401 });
  }
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    select: { id: true },
  });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.productReview.findFirst({
    where: { productId: product.id, userId: session.user.id },
  });
  if (existing) {
    return NextResponse.json({ error: "You have already reviewed this product" }, { status: 400 });
  }

  const review = await prisma.productReview.create({
    data: {
      productId: product.id,
      userId: session.user.id,
      rating: parsed.data.rating,
      title: parsed.data.title?.trim() || null,
      body: parsed.data.body?.trim() || null,
      images: [],
      isApproved: false,
    },
    include: {
      user: { select: { name: true } },
    },
  });

  return NextResponse.json({
    id: review.id,
    rating: review.rating,
    title: review.title,
    body: review.body,
    createdAt: review.createdAt.toISOString(),
    userName: review.user?.name ?? "You",
    isApproved: false,
  });
}
