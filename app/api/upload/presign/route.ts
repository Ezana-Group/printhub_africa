import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createPresignedUploadUrl,
  generateStorageKey,
  isR2Configured,
  type UploadFolder,
} from "@/lib/r2";
import type { UploadContext, UploadedFileType } from "@prisma/client";

const ALLOWED_TYPES: Record<
  string,
  { ext: string[]; maxMB: number; bucket: "private" | "public" }
> = {
  "model/stl": { ext: ["stl"], maxMB: 500, bucket: "private" },
  "application/octet-stream": {
    ext: ["stl", "obj", "3mf", "step"],
    maxMB: 500,
    bucket: "private",
  },
  "model/obj": { ext: ["obj"], maxMB: 500, bucket: "private" },
  "model/3mf": { ext: ["3mf"], maxMB: 500, bucket: "private" },
  "application/sla": { ext: ["stl"], maxMB: 500, bucket: "private" },
  "application/pdf": { ext: ["pdf"], maxMB: 200, bucket: "private" },
  "image/svg+xml": { ext: ["svg"], maxMB: 50, bucket: "private" },
  "application/postscript": { ext: ["ai", "eps"], maxMB: 200, bucket: "private" },
  "image/vnd.adobe.photoshop": { ext: ["psd"], maxMB: 500, bucket: "private" },
  "application/dxf": { ext: ["dxf"], maxMB: 100, bucket: "private" },
  "image/jpeg": { ext: ["jpg", "jpeg"], maxMB: 20, bucket: "public" },
  "image/png": { ext: ["png"], maxMB: 50, bucket: "public" },
  "image/webp": { ext: ["webp"], maxMB: 20, bucket: "public" },
  "image/tiff": { ext: ["tiff", "tif"], maxMB: 100, bucket: "private" },
  "image/x-icon": { ext: ["ico"], maxMB: 1, bucket: "public" },
  "application/zip": { ext: ["zip"], maxMB: 200, bucket: "private" },
};

const CONTEXT_TO_FOLDER: Record<string, { folder: UploadFolder; bucket: "private" | "public" }> = {
  CUSTOMER_3D_PRINT: { folder: "designs/3d", bucket: "private" },
  CUSTOMER_LARGE_FORMAT: { folder: "designs/large-format", bucket: "private" },
  CUSTOMER_QUOTE: { folder: "designs/quote", bucket: "private" },
  CUSTOMER_GENERAL: { folder: "designs/general", bucket: "private" },
  CUSTOMER_PAYMENT_PROOF: { folder: "proofs/payment", bucket: "private" },
  ADMIN_CATALOGUE_STL: { folder: "catalogue/stl", bucket: "private" },
  ADMIN_CATALOGUE_PHOTO: { folder: "catalogue/photos", bucket: "public" },
  ADMIN_PRODUCT_IMAGE: { folder: "products/images", bucket: "public" },
  ADMIN_CATEGORY_IMAGE: { folder: "categories/images", bucket: "public" },
  ADMIN_LOGO: { folder: "brand/logos", bucket: "public" },
  ADMIN_FAVICON: { folder: "brand/favicons", bucket: "public" },
  ADMIN_OG_IMAGE: { folder: "brand/og", bucket: "public" },
  USER_AVATAR: { folder: "avatars", bucket: "public" },
  STAFF_AVATAR: { folder: "avatars", bucket: "public" },
};

const CONTEXTS = [
  "CUSTOMER_3D_PRINT",
  "CUSTOMER_LARGE_FORMAT",
  "CUSTOMER_QUOTE",
  "CUSTOMER_GENERAL",
  "CUSTOMER_PAYMENT_PROOF",
  "ADMIN_CATALOGUE_STL",
  "ADMIN_CATALOGUE_PHOTO",
  "ADMIN_PRODUCT_IMAGE",
  "ADMIN_CATEGORY_IMAGE",
  "ADMIN_LOGO",
  "ADMIN_FAVICON",
  "ADMIN_OG_IMAGE",
  "USER_AVATAR",
  "STAFF_AVATAR",
] as const;

const schema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string(),
  sizeBytes: z.number().positive(),
  context: z.enum(CONTEXTS),
  quoteId: z.string().optional(),
  orderId: z.string().optional(),
  guestEmail: z.string().email().optional(),
});

function extToFileType(ext: string): UploadedFileType {
  const map: Record<string, UploadedFileType> = {
    stl: "STL",
    obj: "OBJ",
    fbx: "FBX",
    "3mf": "THREE_MF",
    step: "STEP",
    ai: "AI",
    pdf: "PDF",
    psd: "PSD",
    eps: "EPS",
    svg: "SVG",
    dxf: "DXF",
    dwg: "DWG",
    png: "PNG",
    jpg: "JPEG",
    jpeg: "JPEG",
    webp: "WEBP",
    tiff: "TIFF",
    tif: "TIFF",
    docx: "DOCX",
    xlsx: "XLSX",
  };
  return (map[ext.toLowerCase()] as UploadedFileType) ?? "OTHER";
}

type SessionLike = { user?: { id?: string; role?: string } } | null;

export async function POST(req: Request) {
  // Check R2 env vars first so we never crash with an unhandled error before returning a clear 503
  if (!isR2Configured()) {
    return NextResponse.json(
      {
        error:
          "File upload is not configured. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in your environment. If uploads fail in the browser with a CORS/preflight error, configure CORS on your R2 buckets (see docs/R2_CORS.md).",
        code: "R2_NOT_CONFIGURED",
      },
      { status: 503 }
    );
  }

  try {
    let session: SessionLike = null;
    try {
      session = (await getServerSession(authOptions)) as SessionLike;
    } catch (authErr) {
      console.error("Presign auth error:", authErr);
      return NextResponse.json(
        { error: "Session check failed. Ensure NEXTAUTH_SECRET and NEXTAUTH_URL are set." },
        { status: 503 }
      );
    }

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const body = schema.safeParse(json);
    if (!body.success) {
      return NextResponse.json(
        { error: "Invalid body", details: body.error.flatten() },
        { status: 400 }
      );
    }

    const { filename, mimeType, sizeBytes, context, quoteId, orderId, guestEmail } = body.data;

    const typeConfig = ALLOWED_TYPES[mimeType];
    if (!typeConfig) {
      return NextResponse.json(
        { error: `File type not allowed: ${mimeType}. Allowed: images (JPEG, PNG, WebP, etc.), PDF, STL, and other design formats.` },
        { status: 400 }
      );
    }

    const maxBytes = typeConfig.maxMB * 1024 * 1024;
    if (sizeBytes > maxBytes) {
      return NextResponse.json(
        { error: `File too large. Max size: ${typeConfig.maxMB}MB` },
        { status: 400 }
      );
    }

    if (context.startsWith("ADMIN_")) {
      const role = session?.user?.role ?? "";
      if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "STAFF") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }
    if (context === "USER_AVATAR" || context === "STAFF_AVATAR") {
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const params = CONTEXT_TO_FOLDER[context] ?? {
      folder: "designs/general" as UploadFolder,
      bucket: "private" as const,
    };
    const ext = filename.split(".").pop()?.toLowerCase() ?? "bin";
    const baseName = filename.replace(/\.[^/.]+$/, "");

    const storageKey = generateStorageKey({
      folder: params.folder,
      userId: session?.user?.id,
      filename: baseName,
      ext,
    });

    let presignedUrl: string;
    try {
      presignedUrl = await createPresignedUploadUrl({
        bucket: params.bucket,
        key: storageKey,
        contentType: mimeType,
        maxSizeMB: typeConfig.maxMB,
        expiresIn: 600,
      });
    } catch (r2Err) {
      console.error("Presign R2 error:", r2Err);
      return NextResponse.json(
        { error: "Storage configuration error. Check R2_ENDPOINT (e.g. https://<account>.r2.cloudflarestorage.com) and bucket names." },
        { status: 503 }
      );
    }

    const sizeInt = Math.floor(Number(sizeBytes));
    if (!Number.isFinite(sizeInt) || sizeInt < 1) {
      return NextResponse.json(
        { error: "Invalid file size." },
        { status: 400 }
      );
    }

    let uploadedFile;
    try {
      uploadedFile = await prisma.uploadedFile.create({
        data: {
          userId: session?.user?.id ?? null,
          guestEmail: context.startsWith("CUSTOMER_") && !session ? guestEmail ?? null : null,
          originalName: filename,
          filename,
          storageKey,
          bucket: params.bucket,
          mimeType,
          size: sizeInt,
          ext,
          fileType: extToFileType(ext),
          uploadContext: context as UploadContext,
          folder: params.folder,
          status: "UPLOADING",
          quoteId: quoteId ?? null,
          orderId: orderId ?? null,
          uploadedByAdmin: context.startsWith("ADMIN_"),
        },
      });
    } catch (dbErr) {
      const err = dbErr as { code?: string; message?: string; meta?: unknown };
      console.error("Presign DB error:", err?.code ?? "unknown", err?.message ?? dbErr, err?.meta);
      const isConnection =
        err?.code === "P1001" ||
        err?.code === "P1002" ||
        err?.code === "P1017" ||
        err?.message?.toLowerCase().includes("connect") ||
        err?.message?.toLowerCase().includes("reachable");
      const rawMessage = err?.message ?? String(dbErr);
      const message = isConnection
        ? "Database is unreachable. Check DATABASE_URL and that the database is running (e.g. Neon, Supabase)."
        : "Database error while saving upload record. Check server logs and that migrations are applied.";
      return NextResponse.json(
        {
          error: message,
          code: "UPLOAD_DB_ERROR",
          details: process.env.NODE_ENV === "development" ? rawMessage : undefined,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      uploadId: uploadedFile.id,
      presignedUrl,
      storageKey,
      bucket: params.bucket,
      expiresIn: 600,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Upload presign error:", message, err);
    return NextResponse.json(
      { error: "Failed to generate upload link. Try again or contact support.", code: "PRESIGN_ERROR" },
      { status: 500 }
    );
  }
}
