import { prisma } from "../lib/prisma";

async function main() {
  console.log('Setting 7-day 2FA grace period for existing staff accounts...');

  const gracePeriodEnd = new Date();
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

  try {
    const result = await prisma.user.updateMany({
      where: {
        role: {
          in: ['STAFF', 'ADMIN', 'SUPER_ADMIN'],
        },
        adminTwoFactorEnabled: false,
      },
      data: {
        adminTwoFactorGraceEndsAt: gracePeriodEnd,
      },
    });

    console.log(`✅ Set 2FA grace period for ${result.count} staff members. Next step: Log in and configure 2FA.`);
  } catch (error) {
    console.error('❌ Error setting grace period:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
