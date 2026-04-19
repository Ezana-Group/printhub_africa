import { NextRequest, NextResponse } from "next/server";
import { n8nGuard } from "@/lib/n8n-verify";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 11, color: "#1a1a2e" },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontFamily: "Helvetica-Bold", color: "#0066cc", marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#555" },
  divider: { borderBottomWidth: 1, borderBottomColor: "#ddd", marginVertical: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#0066cc", marginBottom: 8 },
  paragraph: { lineHeight: 1.6, marginBottom: 6, color: "#333" },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, textAlign: "center", fontSize: 9, color: "#aaa" },
});

function InsightsReport({ htmlReport, month, year }: { htmlReport: string; month: number; year: number }) {
  // Strip HTML tags and split into sections
  const cleaned = htmlReport
    .replace(/<h[1-6][^>]*>/gi, "\n\n## ")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/li>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .split("\n\n")
    .filter((s) => s.trim().length > 0);

  const monthName = new Date(year, month - 1).toLocaleString("en-GB", { month: "long" });

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.title }, "PrintHub Africa"),
        React.createElement(Text, { style: styles.subtitle }, `Monthly Business Intelligence Report — ${monthName} ${year}`)
      ),
      React.createElement(View, { style: styles.divider }),
      ...cleaned.map((section: string, i: number) => {
        const isHeading = section.trim().startsWith("##");
        const text = section.replace(/^##\s*/, "").trim();
        if (!text) return null;
        return React.createElement(
          View,
          { key: i, style: styles.section },
          React.createElement(Text, { style: isHeading ? styles.sectionTitle : styles.paragraph }, text)
        );
      }),
      React.createElement(
        Text,
        { style: styles.footer },
        `PrintHub Africa — Confidential — Generated ${new Date().toLocaleDateString("en-GB")} — For internal use only`
      )
    )
  );
}

export async function POST(req: NextRequest) {
  const guard = await n8nGuard(req);
  if (guard) return guard;

  try {
    const body = await req.clone().text();
    const { htmlReport, month, year }: { htmlReport: string; month: number; year: number } = JSON.parse(body);

    if (!htmlReport || !month || !year) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // renderToBuffer expects a Document element; cast is needed due to @react-pdf types
    const element = React.createElement(InsightsReport, { htmlReport, month, year });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(element as any);

    const key = `reports/monthly/${year}-${String(month).padStart(2, "0")}.pdf`;

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_PUBLIC_BUCKET!,
        Key: key,
        Body: pdfBuffer,
        ContentType: "application/pdf",
      })
    );

    return NextResponse.json({ success: true, pdfUrl: `${process.env.R2_PUBLIC_URL}/${key}` });
  } catch (err) {
    console.error("[generate-insights-pdf]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
