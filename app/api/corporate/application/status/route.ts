/**
 * GET /api/corporate/application/status
 * Returns the current user's latest corporate application status (for "Application pending" page).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const application = await prisma.corporateApplication.findFirst({
    where: { applicantUserId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      companyName: true,
      contactEmail: true,
      createdAt: true,
      rejectedReason: true,
    },
  });

  if (!application) {
    return NextResponse.json({ application: null });
  }

  return NextResponse.json({
    application: {
      id: application.id,
      status: application.status,
      companyName: application.companyName,
      contactEmail: application.contactEmail,
      createdAt: application.createdAt.toISOString(),
      rejectedReason: application.rejectedReason,
    },
  });
}
