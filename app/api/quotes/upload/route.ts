import { NextRequest, NextResponse } from "next/server";
import { getUploadUrl, getPublicUrl } from "@/lib/s3";
import { randomUUID } from "crypto";

const ALLOWED_EXTENSIONS = new Set([
  "ai", "pdf", "psd", "eps", "png", "jpg", "jpeg", "svg", "stl", "obj", "fbx", "3mf", "step",
  "webp",
]);
const MAX_SIZE_MB = 50;
const MAX_FILES = 10;

/**
 * POST /api/quotes/upload
 * Body: multipart/form-data with "file" (or multiple files).
 * Returns: { urls: string[] } — public URLs to store in quote.referenceFiles.
 * If S3 is not configured, returns placeholder URLs (client can still submit quote; files stored server-side in uploads dir).
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("file").filter((f): f is File => f instanceof File);
    if (files.length === 0 || files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Send 1–${MAX_FILES} file(s).` },
        { status: 400 }
      );
    }

    const urls: string[] = [];
    const filesMeta: { url: string; originalName: string; sizeBytes: number; uploadedAt: string }[] = [];
    const now = new Date().toISOString();

    for (const file of files) {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds ${MAX_SIZE_MB}MB.` },
          { status: 400 }
        );
      }
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json(
          { error: `File type .${ext} not allowed. Use: AI, PDF, PSD, EPS, PNG, JPG, SVG, STL, OBJ, FBX, 3MF, STEP, WEBP.` },
          { status: 400 }
        );
      }

      const key = `quotes/${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const contentType = file.type || "application/octet-stream";
      const uploadUrl = await getUploadUrl(key, contentType);
      let publicUrl: string;

      if (uploadUrl) {
        const res = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": contentType },
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          console.error("S3/R2 upload failed:", res.status, res.statusText, errText.slice(0, 200));
          return NextResponse.json(
            { error: "Storage upload failed. Check S3/R2 bucket and credentials." },
            { status: 502 }
          );
        }
        try {
          publicUrl = getPublicUrl(key);
        } catch (e) {
          console.error("getPublicUrl failed (missing R2_PUBLIC_URL?):", e);
          return NextResponse.json(
            { error: "Storage is misconfigured: public URL not set (R2_PUBLIC_URL / NEXT_PUBLIC_S3_URL)." },
            { status: 502 }
          );
        }
        urls.push(publicUrl);
      } else {
        const buffer = Buffer.from(await file.arrayBuffer());
        const { writeFile, mkdir } = await import("fs/promises");
        const path = await import("path");
        const dir = path.join(process.cwd(), "public", "uploads", "quotes");
        try {
          await mkdir(dir, { recursive: true });
          const filename = `${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
          const filepath = path.join(dir, filename);
          await writeFile(filepath, buffer);
          const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
          publicUrl = `${base}/uploads/quotes/${filename}`;
          urls.push(publicUrl);
        } catch (fsErr) {
          console.error("Local upload failed (read-only fs?):", fsErr);
          return NextResponse.json(
            { error: "File storage not available. Configure S3/R2 (R2_* or AWS_* env vars) for uploads." },
            { status: 503 }
          );
        }
      }
      filesMeta.push({
        url: publicUrl,
        originalName: file.name,
        sizeBytes: file.size,
        uploadedAt: now,
      });
    }

    return NextResponse.json({ urls, filesMeta });
  } catch (e) {
    console.error("Quote upload error:", e);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
