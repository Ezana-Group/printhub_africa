import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { prisma } from "@/lib/prisma";
import { getBusinessPublic } from "@/lib/business-public";

/**
 * GET /api/orders/[id]/invoice
 * Returns KRA-style invoice as HTML (print-friendly). Use "Print to PDF" in browser.
 * Allowed: order owner or admin. VAT 16%, line items, business details.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsCustomer);
  const { id: orderId } = await params;
  if (!orderId) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: { select: { name: true, sku: true } } } },
      shippingAddress: true,
      user: { select: { name: true, email: true } },
    },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const isOwner = session?.user?.id && order.userId === session.user.id;
  const isAdmin = (session?.user as { role?: string })?.role && ["ADMIN", "SUPER_ADMIN", "STAFF"].includes((session?.user as { role?: string }).role ?? "");
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const business = await getBusinessPublic();
  const settings = await prisma.businessSettings.findUnique({
    where: { id: "default" },
  }).catch(() => null);
  const vatOnInvoices = settings?.vatOnInvoices ?? true;
  const invoiceFooter = settings?.invoiceFooter ?? null;
  const invoiceNotes = settings?.invoiceNotes ?? null;
  const kraPin = process.env.KRA_PIN ?? "";

  const subtotal = Number(order.subtotal);
  const tax = Number(order.tax);
  const shipping = Number(order.shippingCost);
  const discount = Number(order.discount);
  const total = Number(order.total);

  const rows = order.items.map((item) => {
    const name = item.product?.name ?? "Item";
    const qty = item.quantity;
    const unitPrice = Number(item.unitPrice);
    const lineTotal = unitPrice * qty;
    return { name, qty, unitPrice, lineTotal };
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice ${order.orderNumber}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 700px; margin: 2rem auto; padding: 0 1rem; color: #111; }
    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .meta { color: #666; font-size: 0.875rem; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #e5e7eb; }
    th { font-weight: 600; color: #374151; }
    .text-right { text-align: right; }
    .totals { margin-top: 1rem; max-width: 280px; margin-left: auto; }
    .totals div { display: flex; justify-content: space-between; padding: 0.25rem 0; }
    .totals .total { font-weight: 700; font-size: 1.125rem; border-top: 2px solid #111; padding-top: 0.5rem; margin-top: 0.5rem; }
    .footer { margin-top: 2rem; font-size: 0.75rem; color: #6b7280; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>${business.businessName}</h1>
  <div class="meta">${[business.address1, business.city, business.county, business.country].filter(Boolean).join(", ")}</div>
  ${kraPin ? `<div class="meta">KRA PIN: ${kraPin}</div>` : ""}

  <h2 style="font-size: 1.25rem; margin-top: 1.5rem;">TAX INVOICE</h2>
  <p><strong>Invoice #</strong> ${order.orderNumber}</p>
  <p><strong>Date</strong> ${new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>

  <p><strong>Bill to</strong><br/>
  ${order.shippingAddress?.fullName ?? order.user?.name ?? "Customer"}<br/>
  ${order.shippingAddress?.email ?? order.user?.email ?? ""}<br/>
  ${order.shippingAddress ? [order.shippingAddress.street, order.shippingAddress.city, order.shippingAddress.county].filter(Boolean).join(", ") : ""}</p>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Unit price (KES)</th>
        <th class="text-right">Amount (KES)</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map((r) => `<tr><td>${r.name}</td><td class="text-right">${r.qty}</td><td class="text-right">${r.unitPrice.toLocaleString()}</td><td class="text-right">${(r.lineTotal).toLocaleString()}</td></tr>`).join("")}
    </tbody>
  </table>

  <div class="totals">
    <div><span>Subtotal</span><span>KES ${subtotal.toLocaleString()}</span></div>
    ${vatOnInvoices ? `<div><span>VAT (16%)</span><span>KES ${tax.toLocaleString()}</span></div>` : ""}
    ${shipping > 0 ? `<div><span>Shipping</span><span>KES ${shipping.toLocaleString()}</span></div>` : ""}
    ${discount > 0 ? `<div><span>Discount</span><span>- KES ${discount.toLocaleString()}</span></div>` : ""}
    <div class="total"><span>Total</span><span>KES ${total.toLocaleString()}</span></div>
  </div>

  ${invoiceNotes ? `<p style="margin-top: 1rem; font-size: 0.875rem;">${invoiceNotes}</p>` : ""}
  ${invoiceFooter ? `<div class="footer">${invoiceFooter}</div>` : ""}
  <div class="footer" style="margin-top: 0.5rem;">${business.businessName} · ${business.primaryEmail} · ${business.website ?? "printhub.africa"}</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, max-age=60",
    },
  });
}
