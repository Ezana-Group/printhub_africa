/**
 * POST /api/invoices/[id]/send — email invoice PDF to customer. Admin only.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getObjectBuffer, isR2Configured } from "@/lib/r2";
import { generateInvoicePdfBuffer } from "@/lib/invoice-pdf";
import { getBusinessPublic } from "@/lib/business-public";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: invoiceId } = await context.params;
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      order: {
        select: {
          orderNumber: true,
          user: { select: { email: true, name: true } },
          shippingAddress: { select: { email: true, fullName: true } },
        },
      },
    },
  });
  if (!invoice?.order) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const toEmail = invoice.order.user?.email ?? invoice.order.shippingAddress?.email;
  if (!toEmail || !toEmail.includes("@")) {
    return NextResponse.json({ error: "No customer email for this order" }, { status: 400 });
  }

  let pdfBuffer: Buffer | null = null;
  if (invoice.pdfKey && isR2Configured()) {
    pdfBuffer = await getObjectBuffer("private", invoice.pdfKey);
  }
  if (!pdfBuffer) {
    pdfBuffer = await generateInvoicePdfBuffer(invoiceId);
  }
  if (!pdfBuffer) {
    return NextResponse.json({ error: "Failed to generate invoice PDF" }, { status: 500 });
  }

  const business = await getBusinessPublic();
  const subject = `Your invoice ${invoice.invoiceNumber} – Order ${invoice.order.orderNumber} – ${business.businessName}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #FF4D00;">${business.businessName}</h2>
      <p>Please find your tax invoice for order <strong>${invoice.order.orderNumber}</strong> attached.</p>
      <p>Invoice number: <strong>${invoice.invoiceNumber}</strong></p>
      <p>If you have any questions, reply to this email or contact us.</p>
      <p style="color: #6B6B6B; font-size: 12px;">${business.businessName}</p>
    </div>
  `;

  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email not configured (RESEND_API_KEY)" }, { status: 503 });
    }
    const Resend = (await import("resend")).Resend;
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.FROM_EMAIL ?? "PrintHub <hello@printhub.africa>";
    const { data, error } = await resend.emails.send({
      from,
      to: [toEmail],
      subject,
      html,
      attachments: [{ filename: `invoice-${invoice.invoiceNumber}.pdf`, content: pdfBuffer.toString("base64") }],
    });
    if (error) throw error;
    return NextResponse.json({ success: true, messageId: data?.id });
  } catch (e) {
    console.error("Invoice send email error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send email" },
      { status: 500 }
    );
  }
}
