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
