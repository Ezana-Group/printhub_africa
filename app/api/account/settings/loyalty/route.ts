import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const account = await prisma.loyaltyAccount.findUnique({
    where: { userId: session.user.id },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  const settings = await prisma.loyaltySettings.findUnique({ where: { id: "default" } });
  if (!account) {
    return NextResponse.json({
      account: null,
      settings,
      kesValue: 0,
      tierProgress: null,
    });
  }
  const kesValue = account.pointsBalance * (settings?.pointsValueKes ?? 0.5);
  const tiers = (settings?.tiers as Array<{ name: string; minPoints: number; maxPoints: number | null }>) ?? [];
  const currentTier = tiers.find((t) => t.name === account.tier);
  const nextTier = tiers.find((t) => t.minPoints > account.pointsEarned);
  return NextResponse.json({
    account,
    settings,
    kesValue,
    tierProgress: nextTier
      ? { current: account.pointsEarned, nextTier: nextTier.name, pointsToNext: nextTier.minPoints - account.pointsEarned }
      : null,
  });
}
