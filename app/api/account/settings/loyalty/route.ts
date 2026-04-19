import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptionsCustomer);
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
  const kesPerPoint = settings?.kesPerPointSpent ?? 0.5;
  const kesValue = account.points * kesPerPoint;
  const tiers = (settings?.tiers as Array<{ name: string; minPoints: number; maxPoints: number | null }>) ?? [];
  tiers.find((t) => t.name === account.tier);
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
