import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import {
  createPresignedDownloadUrl,
  publicFileUrl,
} from "@/lib/r2";

export async function GET(
  req: Request,
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
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(
    (session?.user as { role?: string })?.role ?? ""
  );
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (file.bucket === "public" && file.storageKey) {
    void writeAudit({
      userId: session?.user?.id,
      action: "FILE_DOWNLOADED",
      category: "UPLOAD",
      target: "UploadedFile",
      targetId: file.id,
      details: file.originalName,
      request: req,
    });
    return NextResponse.json({
      url: publicFileUrl(file.storageKey),
      expiresIn: null,
    });
  }

  if (file.bucket === "private" && file.storageKey) {
    try {
      const url = await createPresignedDownloadUrl(file.storageKey, 3600);
      void writeAudit({
        userId: session?.user?.id,
        action: "FILE_DOWNLOADED",
        category: "UPLOAD",
        target: "UploadedFile",
        targetId: file.id,
        details: file.originalName,
        request: req,
      });
      return NextResponse.json({ url, expiresIn: 3600 });
    } catch (err) {
      console.error("R2 signed URL error:", err);
      return NextResponse.json(
        { error: "Download not available." },
        { status: 502 }
      );
    }
  }

  if (file.url) {
    void writeAudit({
      userId: session?.user?.id,
      action: "FILE_DOWNLOADED",
      category: "UPLOAD",
      target: "UploadedFile",
      targetId: file.id,
      details: file.originalName,
      request: req,
    });
    return NextResponse.json({ url: file.url, expiresIn: null });
  }

  return NextResponse.json(
    { error: "File location unknown." },
    { status: 404 }
  );
}
