/**
 * POST /api/admin/corporate/applications/[id]/reject
 * Reject a corporate application with optional reason; send rejection email.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import { sendCorporateApplicationRejectedEmail } from "@/lib/email";
import { canAccessRoute } from "@/lib/admin-permissions";
import { z } from "zod";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];
const rejectSchema = z.object({
  rejectedReason: z.string().max(1000).optional(),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsAdmin);
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const parsed = rejectSchema.safeParse(body);
  const rejectedReason = parsed.success ? parsed.data.rejectedReason?.trim() ?? null : null;

  await prisma.corporateApplication.update({
    where: { id: applicationId },
    data: {
      status: "REJECTED",
      rejectedReason,
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
    },
  });

  try {
    await sendCorporateApplicationRejectedEmail(
      application.contactEmail,
      application.contactPerson,
      application.companyName,
      rejectedReason
    );
  } catch (e) {
    console.error("Corporate rejection email error:", e);
  }

  return NextResponse.json({ success: true });
}
