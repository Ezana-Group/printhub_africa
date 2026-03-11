import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { headObject, publicFileUrl, getObjectBuffer } from "@/lib/r2";
import { scanFile } from "@/lib/virustotal";
import type { UploadedFile } from "@prisma/client";

/** Fire-and-forget async post-upload processing (virus scan, 3D analysis, thumbnail, notify). */
async function processUploadAsync(file: UploadedFile): Promise<void> {
  try {
    const vtKey = process.env.VIRUSTOTAL_API_KEY;
    if (vtKey && file.storageKey && file.bucket) {
      await prisma.uploadedFile.update({
        where: { id: file.id },
        data: { virusScanStatus: "pending", virusScanAt: new Date() },
      });
      const bucket = file.bucket === "public" ? "public" : "private";
      const buffer = await getObjectBuffer(bucket, file.storageKey);
      if (buffer) {
        const result = await scanFile(buffer, file.originalName, vtKey);
        if (result.status === "clean") {
          await prisma.uploadedFile.update({
            where: { id: file.id },
            data: { virusScanStatus: "clean" },
          });
        } else if (result.status === "infected") {
          await prisma.uploadedFile.update({
            where: { id: file.id },
            data: { virusScanStatus: "infected", status: "INFECTED" },
          });
        } else {
          await prisma.uploadedFile.update({
            where: { id: file.id },
            data: { virusScanStatus: "error" },
          });
        }
      } else {
        await prisma.uploadedFile.update({
          where: { id: file.id },
          data: { virusScanStatus: "error" },
        });
      }
    }

    if (["STL", "OBJ", "THREE_MF"].includes(file.fileType)) {
      // TODO: run 3D analysis (e.g. volume, weight, dimensions), update printVolume, printWeight, printTime, dimensions
    }

    if (["PNG", "JPEG", "WEBP", "TIFF"].includes(file.fileType)) {
      // TODO: generate thumbnail, set thumbnailKey
    }

    if (file.uploadContext?.startsWith("CUSTOMER_")) {
      // TODO: notify admin of new customer upload (email or in-app)
    }
  } catch (err) {
    console.error("processUploadAsync error:", err);
  }
}

const schema = z.object({
  uploadId: z.string().min(1),
  storageKey: z.string().min(1),
});

export async function POST(req: Request) {
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid body. Required: uploadId, storageKey." },
      { status: 400 }
    );
  }

  const file = await prisma.uploadedFile.findUnique({
    where: { id: body.uploadId },
  });
  if (!file) {
    return NextResponse.json({ error: "Upload record not found." }, { status: 404 });
  }
  if (file.storageKey !== body.storageKey) {
    return NextResponse.json({ error: "Storage key mismatch." }, { status: 400 });
  }
  if (file.status !== "UPLOADING") {
    return NextResponse.json({ error: "Upload already confirmed or expired." }, { status: 400 });
  }

  const bucket = file.bucket === "public" ? "public" : "private";
  const exists = await headObject(bucket, file.storageKey!);
  if (!exists) {
    return NextResponse.json(
      { error: "File not found in storage. Upload may have failed." },
      { status: 400 }
    );
  }

  const url =
    file.bucket === "public" ? publicFileUrl(file.storageKey!) : null;

  const updated = await prisma.uploadedFile.update({
    where: { id: body.uploadId },
    data: {
      status: "UPLOADED",
      url,
      updatedAt: new Date(),
    },
  });

  processUploadAsync(updated).catch(console.error);

  return NextResponse.json({ success: true, file: updated });
}
