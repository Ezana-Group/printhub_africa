import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import type { CorporateAccount, CorporateTeamMember, CorporateTier } from "@prisma/client";

/** Get the corporate account for the current session user (via active team membership). */
export async function getCorporateAccount() {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) return null;

  const membership = await prisma.corporateTeamMember.findFirst({
    where: { userId: session.user.id, isActive: true },
    include: {
      corporate: {
        include: {
          primaryUser: { select: { name: true, email: true } },
        },
      },
    },
  });
  return membership?.corporate ?? null;
}

/** Get the team member record for the current user within a corporate account. */
export async function getCorporateMember(corporateId: string) {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) return null;

  return prisma.corporateTeamMember.findFirst({
    where: { userId: session.user.id, corporateId, isActive: true },
  });
}

/** Check if current user is OWNER or ADMIN of their corporate account. */
export async function isCorporateAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) return false;

  const member = await prisma.corporateTeamMember.findFirst({
    where: {
      userId: session.user.id,
      isActive: true,
      role: { in: ["OWNER", "ADMIN"] },
    },
  });
  return !!member;
}

/** Generate sequential account number: CORP-001, CORP-002… */
export async function generateCorporateAccountNumber(): Promise<string> {
  const counter = await prisma.counter.upsert({
    where: { id: "corporate_account" },
    create: { id: "corporate_account", value: 1 },
    update: { value: { increment: 1 } },
  });
  return `CORP-${String(counter.value).padStart(3, "0")}`;
}

/** Generate corporate invoice number: CINV-2026-0001 */
export async function generateCorporateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const counter = await prisma.counter.upsert({
    where: { id: "corporate_invoice" },
    create: { id: "corporate_invoice", value: 1 },
    update: { value: { increment: 1 } },
  });
  return `CINV-${year}-${String(counter.value).padStart(4, "0")}`;
}

/** Check if an order total is within a team member's spending limit. */
export function isWithinSpendingLimit(
  member: Pick<CorporateTeamMember, "spendingLimit">,
  orderTotal: number
): boolean {
  if (member.spendingLimit == null) return true;
  return orderTotal <= member.spendingLimit;
}

/** Calculate available credit for a corporate account. */
export function getAvailableCredit(
  corporate: Pick<CorporateAccount, "creditLimit" | "creditUsed">
): number {
  return Math.max(0, corporate.creditLimit - corporate.creditUsed);
}

/** Get tier badge colour class for UI. */
export function getTierColour(tier: CorporateTier): string {
  const map: Record<CorporateTier, string> = {
    STANDARD: "bg-gray-100 text-gray-700",
    SILVER: "bg-slate-200 text-slate-800",
    GOLD: "bg-amber-100 text-amber-800",
    PLATINUM: "bg-purple-100 text-purple-800",
  };
  return map[tier] ?? "bg-gray-100 text-gray-700";
}

/** Get number of days for payment terms. */
export function getTermsDays(terms: string): number {
  switch (terms) {
    case "NET_14":
      return 14;
    case "NET_30":
      return 30;
    case "NET_60":
      return 60;
    default:
      return 0;
  }
}
