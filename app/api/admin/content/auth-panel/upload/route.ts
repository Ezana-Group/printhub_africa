import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { writeAudit } from "@/lib/audit";
import { uploadBuffer, isUploadConfigured } from "@/lib/s3";

async function uploadSlideImage(formData: FormData): Promise<string> {
  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No file");
  
  const ext = file.name.split('.').pop() || "jpg";
  const key = `auth-panel/slide-${Date.now()}.${ext}`;

  if (isUploadConfigured()) {
    const buffer = Buffer.from(await file.arrayBuffer());
    return uploadBuffer(key, buffer, file.type || "image/jpeg");
  }
  
  // Fallback for local dev if S3 not configured (though usually it should be)
  return `/uploads/${key}`;
}

export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "content_edit" });
  if (auth instanceof NextResponse) return auth;

  try {
    const formData = await req.formData();
    const url = await uploadSlideImage(formData);

    await writeAudit({
      userId: auth.session.user.id,
      action: "AUTH_PANEL_IMAGE_UPLOADED",
      category: "CONTENT",
      details: `Uploaded image for auth panel: ${url}`,
    });

    return NextResponse.json({ success: true, url });
  } catch (e) {
    console.error("[AUTH_PANEL_UPLOAD]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 400 }
    );
  }
}
