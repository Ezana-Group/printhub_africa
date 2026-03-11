import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApplicationStatus } from "@prisma/client";
import {
  sendCareerStatusShortlistedEmail,
  sendCareerStatusRejectedEmail,
  sendCareerOfferMadeEmail,
} from "@/lib/email";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

function requireAdmin(session: { user?: { role?: string } } | null) {
  if (!session?.user || !ADMIN_ROLES.includes((session.user as { role?: string }).role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  return null;
}

const statuses: ApplicationStatus[] = [
  "NEW", "REVIEWING", "SHORTLISTED", "INTERVIEW_SCHEDULED",
  "INTERVIEWED", "OFFER_MADE", "HIRED", "REJECTED", "WITHDRAWN",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const err = requireAdmin(session);
  if (err) return err;

  const { id } = await params;
  const body = await req.json();
  const newStatus = body.status as ApplicationStatus;
  if (!statuses.includes(newStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = await prisma.jobApplication.findUnique({
    where: { id },
    include: { jobListing: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userId = (session!.user as { id?: string })?.id ?? null;
  const application = await prisma.jobApplication.update({
    where: { id },
    data: {
      status: newStatus,
      reviewedBy: userId,
      reviewedAt: new Date(),
      rejectionReason: newStatus === "REJECTED" ? (body.rejectionReason as string | undefined) ?? existing.rejectionReason : existing.rejectionReason,
    },
    include: { jobListing: true },
  });

  const firstName = application.firstName;
  const email = application.email;
  const jobTitle = application.jobListing.title;

  if (newStatus === "SHORTLISTED") {
    await sendCareerStatusShortlistedEmail(email, firstName, jobTitle).catch((e) =>
      console.error("Shortlist email error:", e)
    );
  } else if (newStatus === "REJECTED") {
    await sendCareerStatusRejectedEmail(email, firstName, jobTitle).catch((e) =>
      console.error("Rejection email error:", e)
    );
  } else if (newStatus === "OFFER_MADE") {
    await sendCareerOfferMadeEmail(email, firstName, jobTitle).catch((e) =>
      console.error("Offer email error:", e)
    );
  }

  return NextResponse.json(application);
}
