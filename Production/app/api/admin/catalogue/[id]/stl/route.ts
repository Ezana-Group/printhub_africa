import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { putObject } from "@/lib/s3";

const ALLOWED_EXT = new Set(["stl", "obj", "3mf"]);
const MAX_SIZE_MB = 200;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;
  const { id: itemId } = await params;

  const item = await prisma.catalogueItem.findUnique({ where: { id: itemId } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const body = await req.json();
      const uploadId = body.uploadId ?? body.fileId;
      if (!uploadId) {
        return NextResponse.json({ error: "uploadId required." }, { status: 400 });
      }
      const file = await prisma.uploadedFile.findUnique({
        where: { id: uploadId, status: "UPLOADED" },
      });
      if (!file?.storageKey) {
        return NextResponse.json({ error: "Upload not found or not ready." }, { status: 400 });
      }
      await prisma.catalogueItem.update({
        where: { id: itemId },
        data: {
          stlFileUrl: file.storageKey,
          stlFileName: file.originalName,
          stlFileSizeBytes: file.size,
        },
      });
      return NextResponse.json({
        ok: true,
        stlFileName: file.originalName,
        stlFileSizeBytes: file.size,
      });
    } catch (e) {
      console.error("Catalogue STL by uploadId error:", e);
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file sent." }, { status: 400 });
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `File exceeds ${MAX_SIZE_MB}MB.` },
        { status: 400 }
      );
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXT.has(ext)) {
      return NextResponse.json(
        { error: "Only .stl, .obj, .3mf allowed." },
        { status: 400 }
      );
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `catalogue/stl/${itemId}/${randomUUID()}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = "application/octet-stream";

    const storedKey = await putObject(key, buffer, contentType);
    if (!storedKey) {
      const { writeFile, mkdir } = await import("fs/promises");
      const path = await import("path");
      const dir = path.join(process.cwd(), "public", "uploads", "catalogue", "stl", itemId);
      await mkdir(dir, { recursive: true });
      const filename = `${randomUUID()}-${safeName}`;
      await writeFile(path.join(dir, filename), buffer);
      const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const localKey = `uploads/catalogue/stl/${itemId}/${filename}`;
      await prisma.catalogueItem.update({
        where: { id: itemId },
        data: {
          stlFileUrl: localKey,
          stlFileName: file.name,
          stlFileSizeBytes: file.size,
        },
      });
      return NextResponse.json({
        ok: true,
        stlFileName: file.name,
        stlFileSizeBytes: file.size,
        url: `${base}/${localKey}`,
      });
    }

    await prisma.catalogueItem.update({
      where: { id: itemId },
      data: {
        stlFileUrl: storedKey,
        stlFileName: file.name,
        stlFileSizeBytes: file.size,
      },
    });

    return NextResponse.json({
      ok: true,
      stlFileName: file.name,
      stlFileSizeBytes: file.size,
    });
  } catch (e) {
    console.error("Catalogue STL upload error:", e);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;
  const { id: itemId } = await params;

  await prisma.catalogueItem.update({
    where: { id: itemId },
    data: {
      stlFileUrl: null,
      stlFileName: null,
      stlFileSizeBytes: null,
    },
  });
  return NextResponse.json({ ok: true });
}
