/**
 * Generate invoice PDF buffer from invoice ID. Used by download route and invoice-create (R2 store).
 */
import { prisma } from "@/lib/prisma";
import { getBusinessPublic } from "@/lib/business-public";
import { InvoicePDF, type InvoicePDFData } from "@/components/pdf/InvoicePDF";
import React from "react";
import { renderToStream } from "@react-pdf/renderer";

export async function buildInvoicePdfData(invoiceId: string): Promise<InvoicePDFData | null> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      order: {
        include: {
          items: { include: { product: { select: { name: true } } } },
          shippingAddress: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });
  if (!invoice?.order) return null;

  const order = invoice.order;
  const business = await getBusinessPublic();
  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } }).catch(() => null);
  const vatOnInvoices = settings?.vatOnInvoices ?? true;

  const subtotal = Number(invoice.subtotal ?? order.subtotal);
  const vatAmount = Number(invoice.vatAmount);
  const totalAmount = Number(invoice.totalAmount);
  const shippingCost = Number(order.shippingCost);
  const discount = Number(order.discount);

  const items = order.items.map((item) => {
    const name = item.product?.name ?? "Item";
    const qty = item.quantity;
    const unitPrice = Number(item.unitPrice);
    return { name, qty, unitPrice, lineTotal: unitPrice * qty };
  });

  return {
    businessName: business.businessName,
    businessAddress: [business.address1, business.city, business.county, business.country].filter(Boolean).join(", ") || "Kenya",
    kraPin: process.env.KRA_PIN ?? null,
    invoiceNumber: invoice.invoiceNumber,
    orderNumber: order.orderNumber,
    date: new Date(invoice.issuedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    billTo: order.shippingAddress?.fullName ?? order.user?.name ?? "Customer",
    billToEmail: order.shippingAddress?.email ?? order.user?.email ?? "",
    billToAddress: order.shippingAddress ? [order.shippingAddress.street, order.shippingAddress.city, order.shippingAddress.county].filter(Boolean).join(", ") : "",
    items,
    subtotal,
    vatAmount,
    shippingCost,
    discount,
    totalAmount,
    vatOnInvoices,
  };
}

export async function generateInvoicePdfBuffer(invoiceId: string): Promise<Buffer | null> {
  const data = await buildInvoicePdfData(invoiceId);
  if (!data) return null;
  // TODO: replace with template slug: customer-invoice-pdf
  const doc = React.createElement(InvoicePDF, { data });
  const stream = await renderToStream(doc as React.ReactElement);
  const { buffer } = await import("node:stream/consumers");
  return buffer(stream as import("stream").Readable) as Promise<Buffer>;
}
