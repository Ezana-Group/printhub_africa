import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createPresignedDownloadUrl,
  publicFileUrl,
  isR2Configured,
} from "@/lib/r2";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  const file = await prisma.uploadedFile.findUnique({
    where: { id },
  });

  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = file.userId === session?.user?.id;
  const role = (session?.user as { role?: string })?.role ?? "";
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN" || role === "STAFF";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (file.bucket === "public" && file.storageKey) {
    return NextResponse.json({
      url: publicFileUrl(file.storageKey),
      expiresIn: null,
    });
  }

  if (!file.storageKey || !isR2Configured()) {
    return NextResponse.json(
      { error: "File or storage not available" },
      { status: 503 }
    );
  }

  const url = await createPresignedDownloadUrl(file.storageKey, 3600);
  return NextResponse.json({ url, expiresIn: 3600 });
}
