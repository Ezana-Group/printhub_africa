import { prisma } from "@/lib/prisma";

/**
 * Award referral points to the referrer when a referred user completes their first order.
 */
export async function awardReferralPoints(referredUserId: string, orderId: string): Promise<void> {
  try {
    const [settings, user, order] = await Promise.all([
      prisma.referralSettings.findUnique({ where: { id: "default" } }),
      prisma.user.findUnique({
        where: { id: referredUserId },
        // @ts-ignore - referredById exists in schema
        select: { referredById: true, id: true },
      }),
      prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, userId: true },
      }),
    ]);

    // @ts-ignore
    if (!settings?.enabled || !(user as any)?.referredById || !order) return;

    // Verify this is the user's first COMPLETED/PAID/CONFIRMED order
    const previousOrders = await prisma.order.count({
      where: {
        userId: referredUserId,
        id: { not: orderId },
        status: { in: ["PAID", "CONFIRMED", "COMPLETED", "DELIVERED"] as any },
      },
    });

    if (previousOrders > 0) return;

    const referrerId = (user as any).referredById;
    const points = (settings as any).pointsPerReferral ?? 500;

    const referrerAccount = await prisma.loyaltyAccount.upsert({
      where: { userId: referrerId },
      update: {},
      create: { userId: referrerId },
    });

    await prisma.$transaction([
      prisma.loyaltyAccount.update({
        where: { userId: referrerId },
        data: {
          points: { increment: points },
          pointsEarned: { increment: points },
        },
      }),
      prisma.loyaltyTransaction.create({
        data: {
          accountId: referrerAccount.id,
          type: "EARN",
          points,
          reference: orderId,
          description: `Referral bonus for user ${referredUserId}`,
        },
      }),
    ]);
  } catch (e) {
    console.error("Award referral points error:", e);
  }
}

/**
 * Link a new user to a referrer via a referral code.
 */
export async function linkReferrer(userId: string, code: string): Promise<boolean> {
  try {
    const referralCode = await prisma.referralCode.findUnique({
      where: { code },
    });

    if (!referralCode || referralCode.userId === userId) return false;

    await prisma.user.update({
      where: { id: userId },
      data: { 
        // @ts-ignore
        referredById: referralCode.userId 
      },
    });

    return true;
  } catch (e) {
    console.error("Link referrer error:", e);
    return false;
  }
}
