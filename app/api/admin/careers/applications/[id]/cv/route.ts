import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSignedDownloadUrl } from "@/lib/s3";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

function requireAdmin(session: { user?: { role?: string } } | null) {
  if (!session?.user || !ADMIN_ROLES.includes((session.user as { role?: string }).role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  return null;
}

/**
 * GET /api/admin/careers/applications/[id]/cv
 * Returns redirect to signed download URL for the CV, or the public URL if stored as full URL.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const err = requireAdmin(session);
  if (err) return err;

  const { id } = await params;
  const application = await prisma.jobApplication.findUnique({
    where: { id },
    select: { cvFileUrl: true },
  });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cvFileUrl = application.cvFileUrl;
  if (!cvFileUrl) return NextResponse.json({ error: "No CV file" }, { status: 404 });
  if (cvFileUrl.startsWith("http://") || cvFileUrl.startsWith("https://")) {
    return NextResponse.redirect(cvFileUrl);
  }
  const signed = await getSignedDownloadUrl(cvFileUrl);
  if (!signed) {
    return NextResponse.json(
      { error: "CV storage not configured or file not found" },
      { status: 502 }
    );
  }
  return NextResponse.redirect(signed);
}
