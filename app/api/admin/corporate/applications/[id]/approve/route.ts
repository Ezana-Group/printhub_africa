/**
 * POST /api/admin/corporate/applications/[id]/approve
 * Approve a corporate application: create CorporateAccount + OWNER team member, mark application approved, send email.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCorporateAccountNumber } from "@/lib/corporate";
import { sendCorporateApplicationApprovedEmail } from "@/lib/email";
import { canAccessRoute } from "@/lib/admin-permissions";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const permissions = (session?.user as { permissions?: string[] })?.permissions;
  if (!session?.user?.id || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessRoute("/admin/corporate", role, permissions ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: applicationId } = await context.params;
  const application = await prisma.corporateApplication.findUnique({
    where: { id: applicationId },
    include: { applicant: { select: { id: true, email: true, name: true } } },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
  if (application.status !== "PENDING") {
    return NextResponse.json(
      { error: "Application is not pending" },
      { status: 400 }
    );
  }

  const accountNumber = await generateCorporateAccountNumber();

  const corporate = await prisma.$transaction(async (tx) => {
    const account = await tx.corporateAccount.create({
      data: {
        accountNumber,
        companyName: application.companyName,
        tradingName: application.tradingName ?? null,
        kraPin: application.kraPin,
        vatNumber: application.vatNumber ?? null,
        industry: application.industry,
        companySize: application.companySize,
        website: application.website ?? null,
        primaryUserId: application.applicantUserId,
        billingAddress: application.billingAddress,
        billingCity: application.billingCity,
        billingCounty: application.billingCounty,
        billingPostalCode: null,
        physicalAddress: null,
        physicalCity: null,
        physicalCounty: null,
        paymentTerms: application.paymentTermsRequested ?? "PREPAID",
        creditLimit: application.creditRequested ?? 0,
        creditUsed: 0,
        discountPercent: 0,
        taxExempt: false,
        status: "APPROVED",
        tier: "STANDARD",
        approvedBy: session.user.id,
        approvedAt: new Date(),
        estimatedMonthlySpend: application.estimatedMonthlySpend,
      },
    });

    await tx.corporateTeamMember.create({
      data: {
        corporateId: account.id,
        userId: application.applicantUserId,
        role: "OWNER",
        canPlaceOrders: true,
        canViewInvoices: true,
        canManageTeam: true,
        isActive: true,
        acceptedAt: new Date(),
      },
    });

    await tx.corporateApplication.update({
      where: { id: applicationId },
      data: {
        status: "APPROVED",
        corporateId: account.id,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    });

    return account;
  });

  try {
    await sendCorporateApplicationApprovedEmail(
      application.contactEmail,
      application.contactPerson,
      application.companyName,
      corporate.accountNumber
    );
  } catch (e) {
    console.error("Corporate approval email error:", e);
  }

  return NextResponse.json({
    success: true,
    corporateId: corporate.id,
    accountNumber: corporate.accountNumber,
  });
}
