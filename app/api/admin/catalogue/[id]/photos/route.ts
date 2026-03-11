import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { putObject, getPublicUrl } from "@/lib/s3";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE_MB = 10;
const MAX_PHOTOS = 5;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;
  const { id: itemId } = await params;

  const item = await prisma.catalogueItem.findUnique({
    where: { id: itemId },
    include: { photos: true },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (item.photos.length >= MAX_PHOTOS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_PHOTOS} photos per item.` },
      { status: 400 }
    );
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("file").filter((f): f is File => f instanceof File);
    if (files.length === 0) {
      return NextResponse.json({ error: "No file(s) sent." }, { status: 400 });
    }
    const remaining = MAX_PHOTOS - item.photos.length;
    if (files.length > remaining) {
      return NextResponse.json(
        { error: `Only ${remaining} photo slot(s) left.` },
        { status: 400 }
      );
    }

    const created: { id: string; url: string; isPrimary: boolean; sortOrder: number }[] = [];
    const isFirst = item.photos.length === 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds ${MAX_SIZE_MB}MB.` },
          { status: 400 }
        );
      }
      const contentType = file.type || "image/jpeg";
      if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
        return NextResponse.json(
          { error: `Invalid type ${contentType}. Use JPEG, PNG, WebP, or GIF.` },
          { status: 400 }
        );
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
      const key = `catalogue/photos/${itemId}/${randomUUID()}.${safeExt}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const storedKey = await putObject(key, buffer, contentType);
      let url: string;
      if (storedKey) {
        try {
          url = getPublicUrl(storedKey);
        } catch {
          const { writeFile, mkdir } = await import("fs/promises");
          const path = await import("path");
          const dir = path.join(process.cwd(), "public", "uploads", "catalogue", "photos", itemId);
          await mkdir(dir, { recursive: true });
          const filename = `${randomUUID()}.${safeExt}`;
          await writeFile(path.join(dir, filename), buffer);
          const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
          url = `${base}/uploads/catalogue/photos/${itemId}/${filename}`;
        }
      } else {
        const { writeFile, mkdir } = await import("fs/promises");
        const path = await import("path");
        const dir = path.join(process.cwd(), "public", "uploads", "catalogue", "photos", itemId);
        await mkdir(dir, { recursive: true });
        const filename = `${randomUUID()}.${safeExt}`;
        await writeFile(path.join(dir, filename), buffer);
        const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
        url = `${base}/uploads/catalogue/photos/${itemId}/${filename}`;
      }

      const sortOrder = item.photos.length + i;
      const photo = await prisma.catalogueItemPhoto.create({
        data: {
          catalogueItemId: itemId,
          url,
          altText: null,
          isPrimary: isFirst && i === 0,
          sortOrder,
        },
      });
      created.push({
        id: photo.id,
        url: photo.url,
        isPrimary: photo.isPrimary,
        sortOrder: photo.sortOrder,
      });
    }

    return NextResponse.json({ photos: created });
  } catch (e) {
    console.error("Catalogue photo upload error:", e);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
