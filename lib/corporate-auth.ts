import { prisma } from "./prisma";
import { UserRole } from "@prisma/client";

export type CorporateRole = "ADMIN" | "MEMBER";

export async function getCorporateMembership(userId: string, corporateId: string) {
  const membership = await prisma.corporateTeamMember.findFirst({
    where: {
      userId,
      corporateId,
      isActive: true,
      corporate: {
        status: "APPROVED",
      },
    },
    include: {
      corporate: true,
    },
  });

  return membership;
}

export async function validateCorporateAccess(userId: string, corporateId: string, requiredRole?: CorporateRole) {
  const membership = await getCorporateMembership(userId, corporateId);
  
  if (!membership) {
    return { authorized: false, error: "Not a member of this corporate team" };
  }

  if (requiredRole === "ADMIN" && membership.role !== "ADMIN") {
    return { authorized: false, error: "Insufficient permissions within corporate team" };
  }

  return { authorized: true, membership };
}
