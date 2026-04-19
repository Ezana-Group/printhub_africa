import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { deleteObject } from "@/lib/s3";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;
  
  const { id } = await params;
  
  try {
    const upload = await prisma.uploadedFile.findUnique({
      where: { id },
    });
    
    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }
    
    // Optionally delete the object from R2 Storage if its private or public.
    const key = upload.storageKey;
    if (key) {
      await deleteObject(key).catch((err) => {
        console.error("Failed to delete file from S3 bucket:", err);
      });
    }

    await prisma.uploadedFile.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin upload DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete upload" }, { status: 500 });
  }
}
