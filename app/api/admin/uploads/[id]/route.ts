import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { deleteFile } from "@/lib/r2";

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
      const bucket = upload.bucket === "public" ? "public" : "private";
      await deleteFile(bucket, key).catch((err) => {
        console.error("Failed to delete file from R2 bucket:", err);
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
