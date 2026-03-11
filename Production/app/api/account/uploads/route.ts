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
    select: {
      id: true,
      originalName: true,
      size: true,
      mimeType: true,
      fileType: true,
      status: true,
      uploadContext: true,
      quoteId: true,
      orderId: true,
      rejectionReason: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    uploads.map((u) => ({
      id: u.id,
      originalName: u.originalName,
      sizeBytes: u.size,
      mimeType: u.mimeType,
      fileType: u.fileType,
      status: u.status,
      uploadContext: u.uploadContext,
      quoteId: u.quoteId,
      orderId: u.orderId,
      rejectionReason: u.rejectionReason,
      createdAt: u.createdAt.toISOString(),
    }))
  );
}
