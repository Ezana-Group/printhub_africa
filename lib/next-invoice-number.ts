import { prisma } from "@/lib/prisma";

/**
 * Get next invoice number in format INV-00001, INV-00002, ...
 * Uses Counter model with id "invoice". Increments and returns.
 */
export async function getNextInvoiceNumber(): Promise<string> {
  const counter = await prisma.counter.upsert({
    where: { id: "invoice" },
    create: { id: "invoice", value: 1, updatedAt: new Date() },
    update: { value: { increment: 1 }, updatedAt: new Date() },
  });
  return `INV-${String(counter.value).padStart(5, "0")}`;
}

/**
 * Get next quote PDF number for display (e.g. QUO-00001).
 * Uses Counter model with id "quote_pdf".
 */
export async function getNextQuotePdfNumber(): Promise<string> {
  const counter = await prisma.counter.upsert({
    where: { id: "quote_pdf" },
    create: { id: "quote_pdf", value: 1, updatedAt: new Date() },
    update: { value: { increment: 1 }, updatedAt: new Date() },
  });
  return `QUO-${String(counter.value).padStart(5, "0")}`;
}

/**
 * Get next support ticket number (e.g. TKT-00001).
 */
export async function getNextTicketNumber(): Promise<string> {
  const counter = await prisma.counter.upsert({
    where: { id: "ticket" },
    create: { id: "ticket", value: 1, updatedAt: new Date() },
    update: { value: { increment: 1 }, updatedAt: new Date() },
  });
  return `TKT-${String(counter.value).padStart(5, "0")}`;
}

/**
 * Get next refund number (e.g. REF-00001).
 */
export async function getNextRefundNumber(): Promise<string> {
  const counter = await prisma.counter.upsert({
    where: { id: "refund" },
    create: { id: "refund", value: 1, updatedAt: new Date() },
    update: { value: { increment: 1 }, updatedAt: new Date() },
  });
  return `REF-${String(counter.value).padStart(5, "0")}`;
}
