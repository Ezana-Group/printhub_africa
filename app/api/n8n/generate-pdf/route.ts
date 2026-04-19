import { NextRequest, NextResponse } from "next/server";
import { n8nGuard } from "@/lib/n8n-verify";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePDF, InvoicePDFData } from "@/components/pdf/InvoicePDF";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/**
 * POST /api/n8n/generate-pdf
 * Body: { type: 'QUOTE' | 'INVOICE', data: InvoicePDFData, filename: string }
 */
export async function POST(req: NextRequest) {
  const guard = await n8nGuard(req);
  if (guard) return guard;

  try {
    const { type, data, filename } = await req.json();

    if (!type || !data) {
      return NextResponse.json({ error: "Missing type or data" }, { status: 400 });
    }

    // Determine which template to use (currently only InvoicePDF handles both)
    const element = React.createElement(InvoicePDF, { data });
    
    // @ts-ignore - renderToBuffer type mismatch with React element
    const pdfBuffer = await renderToBuffer(element);

    const folder = type.toLowerCase() === 'quote' ? 'quotes' : 'invoices';
    const key = `${folder}/${filename || `doc-${Date.now()}.pdf`}`;

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_PUBLIC_BUCKET!,
        Key: key,
        Body: pdfBuffer,
        ContentType: "application/pdf",
      })
    );

    return NextResponse.json({ 
      success: true, 
      pdfUrl: `${process.env.R2_PUBLIC_URL}/${key}`,
      filename: filename
    });
  } catch (err) {
    console.error("[generate-pdf]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
