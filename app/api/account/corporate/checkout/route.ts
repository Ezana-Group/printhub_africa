/**
 * GET /api/account/corporate/checkout — corporate context for checkout (discount, net terms, PO).
 * Returns null when user has no approved corporate account.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const APPROVED = "APPROVED";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ corporate: null });
  }

  const membership = await prisma.corporateTeamMember.findFirst({
    where: {
      userId: session.user.id,
      isActive: true,
      corporate: { status: APPROVED },
    },
    include: {
      corporate: {
        select: {
          id: true,
          accountNumber: true,
          companyName: true,
          discountPercent: true,
          paymentTerms: true,
          creditLimit: true,
          creditUsed: true,
        },
      },
    },
  });

  if (!membership?.corporate) {
    return NextResponse.json({ corporate: null });
  }

  const corp = membership.corporate;
  const availableCredit = Math.max(0, corp.creditLimit - corp.creditUsed);
  const canUseNetTerms =
    corp.paymentTerms !== "PREPAID" &&
    corp.paymentTerms !== "ON_DELIVERY";

  return NextResponse.json({
    corporate: {
      id: corp.id,
      accountNumber: corp.accountNumber,
      companyName: corp.companyName,
      discountPercent: corp.discountPercent,
      paymentTerms: corp.paymentTerms,
      creditLimit: corp.creditLimit,
      creditUsed: corp.creditUsed,
      availableCredit,
      canUseNetTerms,
    },
  });
}
