import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uploads = await prisma.uploadedFile.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      quote: { select: { id: true, quoteNumber: true } },
    },
  });

  return NextResponse.json({
    uploads: uploads.map((u) => ({
      id: u.id,
      originalName: u.originalName,
      sizeBytes: u.size,
      mimeType: u.mimeType,
      fileType: u.fileType,
      status: u.status,
      virusScanStatus: u.virusScanStatus,
      rejectionReason: u.rejectionReason,
      createdAt: u.createdAt,
      quoteId: u.quoteId,
      quoteNumber: u.quote?.quoteNumber,
      orderId: u.orderId,
    })),
  });
}
