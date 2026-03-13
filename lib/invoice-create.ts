import { prisma } from "@/lib/prisma";
import { getNextInvoiceNumber } from "@/lib/next-invoice-number";
import { generateInvoicePdfBuffer } from "@/lib/invoice-pdf";
import { putObjectBuffer, isR2Configured } from "@/lib/r2";

/**
 * Create an Invoice record for an order (e.g. when payment is confirmed).
 * Idempotent: if an invoice already exists for this order, returns it.
 * When R2 is configured, generates PDF and stores it in R2, setting invoice.pdfKey.
 */
export async function createInvoiceForOrder(
  orderId: string,
  paymentId?: string | null
): Promise<{ id: string; invoiceNumber: string } | null> {
  const existing = await prisma.invoice.findFirst({
    where: { orderId },
    select: { id: true, invoiceNumber: true },
  });
  if (existing) return existing;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      subtotal: true,
      tax: true,
      total: true,
      discount: true,
    },
  });
  if (!order) return null;

  const invoiceNumber = await getNextInvoiceNumber();
  const issuedAt = new Date();
  const dueAt = new Date(issuedAt);
  dueAt.setDate(dueAt.getDate() + 30);

  const invoice = await prisma.invoice.create({
    data: {
      orderId,
      paymentId: paymentId ?? undefined,
      invoiceNumber,
      issuedAt,
      dueAt,
      subtotal: order.subtotal,
      vatAmount: order.tax,
      totalAmount: order.total,
    },
  });

  if (isR2Configured()) {
    try {
      const pdfBuffer = await generateInvoicePdfBuffer(invoice.id);
      if (pdfBuffer) {
        const year = new Date().getFullYear();
        const safeNumber = invoice.invoiceNumber.replace(/[^A-Za-z0-9-]/g, "-");
        const key = `invoices/${year}/${safeNumber}.pdf`;
        await putObjectBuffer({
          bucket: "private",
          key,
          body: pdfBuffer,
          contentType: "application/pdf",
        });
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { pdfKey: key },
        });
      }
    } catch (e) {
      console.error("Invoice PDF R2 store failed:", e);
    }
  }

  return { id: invoice.id, invoiceNumber: invoice.invoiceNumber };
}
