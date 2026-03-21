import { NextResponse } from "next/server";
import { requireRole } from "@/lib/settings-api";
import { validateDanger } from "@/lib/danger";
import { writeAudit } from "@/lib/audit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { uploadPrivateBuffer, getSignedDownloadUrl, isUploadConfigured } from "@/lib/s3";
import { gzipSync } from "zlib";

const EXPORT_ROW_LIMIT = 5000;

export async function POST(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;
  try {
    await validateDanger(req, "EXPORT DATA");
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Confirmation failed" }, { status: 400 });
  }
  const session = await getServerSession(authOptions);
  const email = (session?.user as { email?: string })?.email;

  if (!isUploadConfigured()) {
    if (email) {
      await sendEmail({
        to: email,
        subject: "PrintHub — Data export",
        html: "<p>Data export was requested but R2/S3 storage is not configured. Configure R2_* or AWS_* env vars to enable export.</p>",
      });
    }
    await writeAudit({ userId: auth.userId, action: "EXPORT_ALL_DATA_REQUESTED", category: "DANGER", request: req });
    return NextResponse.json({
      message: "Export requested. R2/S3 is not configured; you received an email with details.",
    });
  }

  try {
    const [users, orders, products, settings] = await Promise.all([
      prisma.user.findMany({ take: EXPORT_ROW_LIMIT, orderBy: { createdAt: "desc" } }),
      prisma.order.findMany({ take: EXPORT_ROW_LIMIT, orderBy: { createdAt: "desc" }, include: { items: true } }),
      prisma.product.findMany({ take: EXPORT_ROW_LIMIT, orderBy: { createdAt: "desc" } }),
      prisma.systemSettings.findMany(),
    ]);
    const payload = JSON.stringify({
      exportedAt: new Date().toISOString(),
      usersCount: users.length,
      ordersCount: orders.length,
      productsCount: products.length,
      settingsCount: settings.length,
      data: { users, orders, products, settings },
    });
    const key = `exports/${Date.now()}-export.json.gz`;
    const gzipped = gzipSync(Buffer.from(payload, "utf-8"));
    await uploadPrivateBuffer(key, gzipped, "application/gzip");
    const downloadUrl = await getSignedDownloadUrl(key);

    if (email) {
      await sendEmail({
        to: email,
        subject: "PrintHub — Data export ready",
        html: `<p>Your data export is ready. <a href="${downloadUrl}">Download (expires in 1 hour)</a>.</p>`,
      });
    }
    await writeAudit({ userId: auth.userId, action: "EXPORT_ALL_DATA_REQUESTED", category: "DANGER", request: req });
    return NextResponse.json({
      message: `Export prepared. Download link sent to ${email ?? "your email"}. Expires in 1 hour.`,
      downloadUrl,
    });
  } catch (e) {
    console.error("Export error:", e);
    if (email) {
      await sendEmail({
        to: email,
        subject: "PrintHub — Data export failed",
        html: "<p>Data export failed. Please try again or contact support.</p>",
      });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Export failed" },
      { status: 500 }
    );
  }
}
