/**
 * Build quote PDF data and generate buffer for Quote (unified Get a Quote).
 */
import { prisma } from "@/lib/prisma";
import { getBusinessPublic } from "@/lib/business-public";
import { QuotePDF, type QuotePDFData } from "@/components/pdf/QuotePDF";
import React from "react";
import { renderToStream } from "@react-pdf/renderer";

const TYPE_LABELS: Record<string, string> = {
  large_format: "Large Format Printing",
  "3d_printing": "3D Printing",
  design_and_print: "Design & Print",
};

export async function buildQuotePdfData(quoteId: string): Promise<QuotePDFData | null> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
  });
  if (!quote) return null;
  const business = await getBusinessPublic();
  const address = [business.address1, business.city, business.county, business.country].filter(Boolean).join(", ") || "Kenya";
  return {
    businessName: business.businessName,
    businessAddress: address,
    quoteNumber: quote.quoteNumber,
    typeLabel: TYPE_LABELS[quote.type] ?? quote.type,
    date: new Date(quote.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    customerName: quote.customerName,
    customerEmail: quote.customerEmail,
    customerPhone: quote.customerPhone ?? null,
    projectName: quote.projectName ?? null,
    description: quote.description ?? null,
    quotedAmount: quote.quotedAmount != null ? Number(quote.quotedAmount) : null,
    quoteBreakdown: quote.quoteBreakdown ?? null,
    validityDays: quote.quoteValidityDays ?? null,
  };
}

export async function generateQuotePdfBuffer(quoteId: string): Promise<Buffer | null> {
  const data = await buildQuotePdfData(quoteId);
  if (!data) return null;
  const doc = React.createElement(QuotePDF, { data });
  const stream = await renderToStream(doc);
  const { buffer } = await import("node:stream/consumers");
  return buffer(stream as import("stream").Readable) as Promise<Buffer>;
}
