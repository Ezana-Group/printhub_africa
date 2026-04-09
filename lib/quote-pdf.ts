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
  three_d_print: "3D Printing",
  design_and_print: "Design & Print",
};

export async function buildQuotePdfData(quoteId: string): Promise<QuotePDFData | null> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
  });
  if (!quote) return null;
  const business = await getBusinessPublic();
  const address = [business.address1, business.city, business.county, business.country].filter(Boolean).join(", ") || "Kenya";
  const validUntil = new Date(new Date(quote.createdAt).getTime() + (quote.quoteValidityDays || 7) * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const lines = JSON.parse(quote.quoteBreakdown || "[]");
  const subtotal = Number(quote.quotedAmount) / 1.16; // Simple rough back-calc or use breakdown
  const tax = Number(quote.quotedAmount) - subtotal;

  return {
    businessName: business.businessName,
    businessAddress: address,
    quoteNumber: quote.quoteNumber,
    date: new Date(quote.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    validUntil,
    customerName: quote.customerName,
    customerEmail: quote.customerEmail,
    customerAddress: quote.customerPhone || "N/A",
    items: lines.map((l: any) => ({
      description: l.description || "Item",
      quantity: l.quantity || 1,
      unitPrice: (l.unitPrice || 0),
      total: (l.lineTotal || 0),
    })),
    subtotal: subtotal,
    taxAmount: tax,
    shippingEstimate: 0,
    grandTotal: Number(quote.quotedAmount),
    includeTax: true,
  };
}

export async function generateQuotePdfBuffer(quoteId: string): Promise<Buffer | null> {
  const data = await buildQuotePdfData(quoteId);
  if (!data) return null;
  const doc = React.createElement(QuotePDF, { data });
  const stream = await renderToStream(doc as React.ReactElement);
  const { buffer } = await import("node:stream/consumers");
  return buffer(stream as import("stream").Readable) as Promise<Buffer>;
}
