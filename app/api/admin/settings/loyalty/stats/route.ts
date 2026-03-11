import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";

export async function GET(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;
  const [memberCount, issued, redeemed, byTier] = await prisma.$transaction([
    prisma.loyaltyAccount.count(),
    prisma.loyaltyTransaction.aggregate({
      _sum: { points: true },
      where: { type: "EARN" },
    }),
    prisma.loyaltyTransaction.aggregate({
      _sum: { points: true },
      where: { type: "REDEEM" },
    }),
    prisma.loyaltyAccount.groupBy({
      by: ["tier"],
      _count: true,
      orderBy: { tier: "asc" },
    }),
  ]);
  return NextResponse.json({
    memberCount,
    pointsIssued: issued._sum.points ?? 0,
    pointsRedeemed: redeemed._sum.points ?? 0,
    byTier: byTier.map((t) => ({ tier: t.tier, count: t._count })),
  });
}
