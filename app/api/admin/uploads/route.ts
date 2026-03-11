import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessRoute } from "@/lib/admin-permissions";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "";
  const permissions = (session?.user as { permissions?: string[] })?.permissions ?? [];
  if (!session?.user || !["STAFF", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessRoute("/admin/uploads", role, permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const context = searchParams.get("context") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);

  const where: { uploadContext?: string; status?: string } = {};
  if (context) where.uploadContext = context;
  if (status) where.status = status;

  const uploads = await prisma.uploadedFile.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, name: true, email: true } },
      quote: { select: { id: true, quoteNumber: true } },
    },
  });

  return NextResponse.json(
    uploads.map((u) => ({
      id: u.id,
      originalName: u.originalName,
      size: u.size,
      mimeType: u.mimeType,
      fileType: u.fileType,
      status: u.status,
      uploadContext: u.uploadContext,
      quoteId: u.quoteId,
      orderId: u.orderId,
      rejectionReason: u.rejectionReason,
      printWeight: u.printWeight,
      printTime: u.printTime,
      dimensions: u.dimensions,
      createdAt: u.createdAt.toISOString(),
      user: u.user ? { id: u.user.id, name: u.user.name, email: u.user.email } : null,
      quote: u.quote ? { id: u.quote.id, quoteNumber: u.quote.quoteNumber } : null,
    }))
  );
}
