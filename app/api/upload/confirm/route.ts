import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getObjectBuffer, headObject, publicFileUrl } from "@/lib/r2";
import { scanFile } from "@/lib/virustotal";
import type { UploadedFile } from "@prisma/client";

const VT_MAX_BYTES = 32 * 1024 * 1024;

async function processUploadAsync(file: UploadedFile): Promise<void> {
  try {
    if (
      process.env.VIRUSTOTAL_API_KEY &&
      file.size <= VT_MAX_BYTES &&
      file.bucket === "private" &&
      file.storageKey
    ) {
      await prisma.uploadedFile.update({
        where: { id: file.id },
        data: { status: "VIRUS_SCANNING" },
      });
      const buf = await getObjectBuffer("private", file.storageKey);
      if (buf) {
        const result = await scanFile(
          buf,
          file.originalName,
          process.env.VIRUSTOTAL_API_KEY
        );
        const status =
          result.status === "clean"
            ? "CLEAN"
            : result.status === "infected"
              ? "INFECTED"
              : "UPLOADED";
        const virusScanStatus =
          result.status === "clean"
            ? "clean"
            : result.status === "infected"
              ? "infected"
              : "error";
        await prisma.uploadedFile.update({
          where: { id: file.id },
          data: {
            status,
            virusScanStatus,
            virusScanAt: new Date(),
          },
        });
        return;
      }
      await prisma.uploadedFile.update({
        where: { id: file.id },
        data: {
          status: "UPLOADED",
          virusScanStatus: "error",
          virusScanAt: new Date(),
        },
      });
      return;
    }
  } catch (e) {
    console.error("Virus scan error for upload", file.id, e);
    await prisma.uploadedFile.update({
      where: { id: file.id },
      data: {
        status: "UPLOADED",
        virusScanStatus: "error",
        virusScanAt: new Date(),
      },
    });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const uploadId = body.uploadId as string | undefined;
  const storageKey = body.storageKey as string | undefined;

  if (!uploadId || !storageKey) {
    return NextResponse.json(
      { error: "uploadId and storageKey required" },
      { status: 400 }
    );
  }

  const file = await prisma.uploadedFile.findUnique({
    where: { id: uploadId },
  });

  if (!file) {
    return NextResponse.json({ error: "Upload not found" }, { status: 404 });
  }

  if (file.storageKey !== storageKey) {
    return NextResponse.json({ error: "storageKey mismatch" }, { status: 400 });
  }

  const bucket = (file.bucket === "public" ? "public" : "private") as "private" | "public";
  const exists = await headObject(bucket, storageKey);
  if (!exists) {
    return NextResponse.json(
      { error: "File not found in storage" },
      { status: 400 }
    );
  }

  const url = file.bucket === "public" ? publicFileUrl(storageKey) : null;
  const updated = await prisma.uploadedFile.update({
    where: { id: uploadId },
    data: {
      status: "UPLOADED",
      ...(url && { url }),
    },
  });

  processUploadAsync(updated).catch((e) => console.error("processUploadAsync", e));

  return NextResponse.json({
    success: true,
    file: {
      id: updated.id,
      storageKey: updated.storageKey,
      bucket: updated.bucket,
      url: updated.url,
      originalName: updated.originalName,
      size: updated.size,
      mimeType: updated.mimeType,
    },
  });
}
