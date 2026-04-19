/**
 * Award loyalty points when an order is completed (e.g. payment cleared / delivered).
 */
import { prisma } from "@/lib/prisma";

export async function awardLoyaltyPoints(orderId: string): Promise<void> {
  const [loyalty, order] = await Promise.all([
    prisma.loyaltySettings.findUnique({ where: { id: "default" } }),
    prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true, total: true },
    }),
  ]);
  if (!loyalty?.enabled || !order?.userId) return;
  const kesPerPoint = loyalty.kesPerPointSpent ?? 1;
  const pointsPerKes = loyalty.pointsPerKesSpent ?? 0;
  const totalKes = Number(order.total);
  const basePoints = Math.floor((totalKes / kesPerPoint) * pointsPerKes);
  const account = await prisma.loyaltyAccount.upsert({
    where: { userId: order.userId },
    update: {},
    create: { userId: order.userId },
  });
  const tiers = (loyalty.tiers as Array<{ minPoints: number; earnMultiplier: number }>) ?? [];
  const tier = tiers.filter((t) => account.pointsEarned >= t.minPoints).pop();
  const multiplier = tier?.earnMultiplier ?? 1;
  const points = Math.floor(basePoints * multiplier);
  if (points <= 0) return;
  await prisma.$transaction([
    prisma.loyaltyAccount.update({
      where: { userId: order.userId },
      data: {
        points: { increment: points },
        pointsEarned: { increment: points },
      },
    }),
    prisma.loyaltyTransaction.create({
      data: {
        accountId: account.id,
        type: "EARN",
        points,
        reference: orderId,
        description: `Order ${orderId}`,
      },
    }),
  ]);
}

/**
 * Get current loyalty balance and tier for a user.
 */
export async function getLoyaltyBalance(userId: string) {
  const [loyalty, account] = await Promise.all([
    prisma.loyaltySettings.findUnique({ where: { id: "default" } }),
    prisma.loyaltyAccount.findUnique({ where: { userId } }),
  ]);
  
  if (!loyalty?.enabled || !account) return { points: 0, pointsEarned: 0, tier: "NONE" };
  
  const tiers = (loyalty.tiers as Array<{ name: string; minPoints: number }>) ?? [];
  const tier = tiers.filter((t) => account.pointsEarned >= t.minPoints).pop();
  
  return {
    points: account.points,
    pointsEarned: account.pointsEarned,
    tier: tier?.name ?? "BRONZE",
    kesValue: Math.floor(account.points * (loyalty.kesPerPointRedeemed ?? 1)),
  };
}

/**
 * Redeem loyalty points for a discount.
 */
export async function redeemLoyaltyPoints(userId: string, points: number, reference: string): Promise<{ ok: boolean; discountKes?: number; error?: string }> {
  if (points <= 0) return { ok: false, error: "Invalid points value" };

  const [loyalty, account] = await Promise.all([
    prisma.loyaltySettings.findUnique({ where: { id: "default" } }),
    prisma.loyaltyAccount.findUnique({ where: { userId } }),
  ]);

  if (!loyalty?.enabled) return { ok: false, error: "Loyalty program is disabled" };
  if (!account || account.points < points) return { ok: false, error: "Insufficient loyalty points" };

  const discountKes = Math.floor(points * (loyalty.kesPerPointRedeemed ?? 1));

  await prisma.$transaction([
    prisma.loyaltyAccount.update({
      where: { userId },
      data: { points: { decrement: points } },
    }),
    prisma.loyaltyTransaction.create({
      data: {
        accountId: account.id,
        type: "REDEEM",
        points: -points,
        reference,
        description: `Redemption for discount on Order ${reference}`,
      },
    }),
  ]);

  return { ok: true, discountKes };
}
