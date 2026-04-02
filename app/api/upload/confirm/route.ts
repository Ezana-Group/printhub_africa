import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { prisma } from "@/lib/prisma";
import { getObjectBuffer, headObject, publicFileUrl, isR2Configured } from "@/lib/r2";
import { scanFile } from "@/lib/virustotal";
import { validateLargeFormatImage } from "@/lib/file-validation/large-format";
import { validateStl } from "@/lib/file-validation/stl";
import type { UploadedFile } from "@prisma/client";

const VALIDATION_MAX_BYTES = 50 * 1024 * 1024;

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
  try {
    if (!isR2Configured()) {
      return NextResponse.json(
        {
          error:
            "Upload service is not configured. Set R2 environment variables (R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL for public files).",
          code: "R2_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    let body: { uploadId?: string; storageKey?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const uploadId = body.uploadId as string | undefined;
    const storageKey = body.storageKey as string | undefined;

    if (!uploadId || !storageKey) {
      return NextResponse.json(
        { error: "uploadId and storageKey required" },
        { status: 400 }
      );
    }

    let file: Awaited<ReturnType<typeof prisma.uploadedFile.findUnique>>;
    try {
      file = await prisma.uploadedFile.findUnique({
        where: { id: uploadId },
      });
    } catch (dbErr) {
      const err = dbErr as { code?: string; message?: string };
      console.error("[upload/confirm] Database error:", err?.code, err?.message, dbErr);
      return NextResponse.json(
        {
          error:
            "Database error while loading upload record. Check server logs and that migrations are applied.",
          code: "UPLOAD_DB_ERROR",
        },
        { status: 503 }
      );
    }

    if (!file) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    // When upload has an owner, only that user may confirm (defence in depth; presign is session-gated).
    if (file.userId) {
      const session = await getServerSession(authOptionsCustomer);
      if (!session?.user?.id || file.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
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

    let url: string | null = null;
    if (file.bucket === "public") {
      try {
        url = publicFileUrl(storageKey);
      } catch (e) {
        console.error("[upload/confirm] R2_PUBLIC_URL not set:", e);
        return NextResponse.json(
          {
            error:
              "Public file URL is not configured. Set R2_PUBLIC_URL in your environment.",
            code: "R2_PUBLIC_URL_NOT_SET",
          },
          { status: 503 }
        );
      }
    }

    let updated: Awaited<ReturnType<typeof prisma.uploadedFile.update>>;
    try {
      updated = await prisma.uploadedFile.update({
        where: { id: uploadId },
        data: {
          status: "UPLOADED",
          ...(url && { url }),
        },
      });
    } catch (dbErr) {
      const err = dbErr as { code?: string; message?: string };
      console.error("[upload/confirm] Database update error:", err?.code, err?.message, dbErr);
      return NextResponse.json(
        {
          error:
            "Database error while saving upload record. Check server logs and that migrations are applied.",
          code: "UPLOAD_DB_ERROR",
        },
        { status: 503 }
      );
    }

    processUploadAsync(updated).catch((e) => console.error("processUploadAsync", e));

    let validation: { ok: boolean; errors: string[]; warnings: string[] } | undefined;
    if (updated.size <= VALIDATION_MAX_BYTES && updated.storageKey) {
      const buf = await getObjectBuffer(bucket, updated.storageKey);
      if (buf) {
        const mt = (updated.mimeType ?? "").toLowerCase();
        const name = updated.originalName ?? "";
        if (mt.startsWith("image/") && mt !== "image/svg+xml") {
          const res = await validateLargeFormatImage(buf, name);
          validation = { ok: res.ok, errors: res.errors, warnings: res.warnings };
        } else if (mt === "model/stl" || (mt === "application/octet-stream" && /\.stl$/i.test(name))) {
          const res = await validateStl(buf, name);
          validation = { ok: res.ok, errors: res.errors, warnings: res.warnings };
        }
      }
    }

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
      ...(validation && { validation }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[upload/confirm] Unexpected error:", message, err);
    return NextResponse.json(
      { error: "Unexpected server error. Please try again.", code: "CONFIRM_ERROR" },
      { status: 500 }
    );
  }
}
