import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import {
  createPresignedUploadUrl,
  generateStorageKey,
  type UploadFolder,
} from "@/lib/r2";
import type { UploadedFileType } from "@prisma/client";

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
  "image/gif": { ext: ["gif"], maxMB: 20, bucket: "public" },
  "application/zip": { ext: ["zip"], maxMB: 200, bucket: "private" },
};

const schema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string(),
  sizeBytes: z.number().positive(),
  context: z.enum([
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
    "ADMIN_OG_IMAGE",
    "USER_AVATAR",
    "STAFF_AVATAR",
  ]),
  quoteId: z.string().optional(),
  orderId: z.string().optional(),
});

function resolveUploadParams(context: string): {
  folder: UploadFolder;
  bucket: "private" | "public";
} {
  const map: Record<string, { folder: UploadFolder; bucket: "private" | "public" }> = {
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
    ADMIN_OG_IMAGE: { folder: "brand/og", bucket: "public" },
    USER_AVATAR: { folder: "avatars", bucket: "public" },
    STAFF_AVATAR: { folder: "avatars", bucket: "public" },
  };
  return map[context] ?? { folder: "designs/general", bucket: "private" };
}

function extToFileType(ext: string): UploadedFileType {
  const upper = ext.toUpperCase();
  const map: Record<string, UploadedFileType> = {
    STL: "STL",
    OBJ: "OBJ",
    FBX: "FBX",
    "3MF": "THREE_MF",
    STEP: "STEP",
    AI: "AI",
    PDF: "PDF",
    PSD: "PSD",
    EPS: "EPS",
    SVG: "SVG",
    DXF: "DXF",
    DWG: "DWG",
    PNG: "PNG",
    JPG: "JPEG",
    JPEG: "JPEG",
    WEBP: "WEBP",
    TIFF: "TIFF",
    TIF: "TIFF",
    DOCX: "DOCX",
    XLSX: "XLSX",
  };
  return map[upper] ?? "OTHER";
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid body. Required: filename, mimeType, sizeBytes, context." },
      { status: 400 }
    );
  }

  const typeConfig = ALLOWED_TYPES[body.mimeType];
  if (!typeConfig) {
    return NextResponse.json(
      { error: `File type not allowed: ${body.mimeType}` },
      { status: 400 }
    );
  }

  const maxBytes = typeConfig.maxMB * 1024 * 1024;
  if (body.sizeBytes > maxBytes) {
    return NextResponse.json(
      { error: `File too large. Max size: ${typeConfig.maxMB}MB` },
      { status: 400 }
    );
  }

  if (
    body.context.startsWith("ADMIN_") &&
    !["ADMIN", "SUPER_ADMIN"].includes((session?.user as { role?: string })?.role ?? "")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const ext = body.filename.split(".").pop()?.toLowerCase() ?? "bin";
  const { folder, bucket } = resolveUploadParams(body.context);

  const nameWithoutExt = body.filename.replace(/\.[^/.]+$/, "") || "file";
  const storageKey = generateStorageKey({
    folder,
    userId: session?.user?.id,
    filename: nameWithoutExt,
    ext,
  });

  let presignedUrl: string;
  try {
    presignedUrl = await createPresignedUploadUrl({
      bucket,
      key: storageKey,
      contentType: body.mimeType,
      maxSizeMB: typeConfig.maxMB,
      expiresIn: 600,
    });
  } catch (err) {
    console.error("R2 presign error:", err);
    return NextResponse.json(
      { error: "Storage not configured. Set R2_* env vars." },
      { status: 503 }
    );
  }

  const uploadedFile = await prisma.uploadedFile.create({
    data: {
      userId: session?.user?.id ?? null,
      uploadedByAdmin: body.context.startsWith("ADMIN_"),
      originalName: body.filename,
      filename: body.filename,
      storageKey,
      bucket,
      folder,
      mimeType: body.mimeType,
      size: body.sizeBytes,
      ext,
      fileType: extToFileType(ext),
      uploadContext: body.context as any,
      status: "UPLOADING",
      quoteId: body.quoteId ?? null,
      orderId: body.orderId ?? null,
    },
  });

  return NextResponse.json({
    uploadId: uploadedFile.id,
    presignedUrl,
    storageKey,
    bucket,
    expiresIn: 600,
  });
}
