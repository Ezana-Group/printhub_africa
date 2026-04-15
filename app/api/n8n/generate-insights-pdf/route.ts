/**
 * POST /api/n8n/generate-insights-pdf
 *
 * Stores an AI-generated HTML business intelligence report and returns a
 * public URL. The workflow calls this after Claude formats the HTML report.
 *
 * Note: No server-side PDF renderer is installed (puppeteer/chromium add
 * ~300MB to the image). The HTML is stored as-is in R2. If true PDF output
 * is required, install @sparticuz/chromium + puppeteer-core and replace the
 * R2 upload below with a headless screenshot → PDF pipeline.
 *
 * Body:
 *   { htmlReport: string, month: number, year: number }
 *
 * Returns:
 *   { pdfUrl: string, reportId: string }
 *
 * Auth: x-printhub-signature header matching N8N_WEBHOOK_SECRET
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateN8nSecret, n8nUnauthorized } from "@/lib/n8n-auth";
import { putObjectBuffer, PUBLIC_CDN_URL } from "@/lib/r2";

interface GeneratePdfBody {
  htmlReport: string;
  month?: number;
  year?: number;
  week?: number;
  type?: string;
}

export async function POST(req: Request) {
  if (!validateN8nSecret(req)) return n8nUnauthorized();

  let body: GeneratePdfBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { htmlReport, month, year, week, type = "MONTHLY_BI" } = body;

  if (!htmlReport) {
    return NextResponse.json({ error: "htmlReport is required" }, { status: 400 });
  }

  const now = new Date();
  const reportYear = year ?? now.getFullYear();
  const reportMonth = month ?? now.getMonth() + 1;
  const timestamp = now.toISOString().replace(/[:.]/g, "-");
  const r2Key = `reports/${type.toLowerCase()}/${reportYear}-${String(reportMonth).padStart(2, "0")}-${timestamp}.html`;

  let reportUrl: string | null = null;

  // Attempt to store in R2 public bucket — falls back gracefully if R2 not configured
  try {
    const htmlBuffer = Buffer.from(htmlReport, "utf8");
    await putObjectBuffer({ bucket: "public", key: r2Key, body: htmlBuffer, contentType: "text/html; charset=utf-8" });
    reportUrl = `${PUBLIC_CDN_URL}/${r2Key}`;
  } catch (err) {
    console.error("[generate-insights-pdf] R2 upload failed:", err);
    // Store HTML inline in DB as fallback
  }

  const record = await prisma.insightReport.create({
    data: {
      type,
      month: reportMonth,
      year: reportYear,
      week: week ?? null,
      r2Key: reportUrl ? r2Key : null,
      reportUrl,
      // Store inline only if R2 failed (avoids bloating DB for normal path)
      htmlBody: reportUrl ? null : htmlReport,
    },
  });

  return NextResponse.json({
    ok: true,
    reportId: record.id,
    // pdfUrl key kept for workflow compatibility — returns HTML URL
    pdfUrl: reportUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/n8n/generate-insights-pdf/${record.id}`,
  });
}
