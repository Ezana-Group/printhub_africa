import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting Template Audit Seeding...");

  // --- WhatsApp Templates ---
  const whatsappTemplates = [
    {
      slug: "3d-print-quote-whatsapp",
      name: "3D Print Quote (WhatsApp)",
      description: "Direct WhatsApp quote for 3D printing services.",
      category: "UTILITY",
      status: "DRAFT",
      bodyText: "PrintHub quote for {{clientName}}\nValid until: {{validUntil}}\nTotal: {{finalTotal}}\n\nDetails:\n{{lineItemsDetails}}"
    },
    {
      slug: "lf-print-quote-whatsapp",
      name: "Large Format Quote (WhatsApp)",
      description: "Direct WhatsApp quote for Large Format printing services.",
      category: "UTILITY",
      status: "DRAFT",
      bodyText: "PrintHub quote for {{clientName}}\nValid until: {{validUntil}}\nTotal: {{finalTotal}}\n\nDetails:\n{{lineItemsDetails}}"
    },
    {
      slug: "order-confirmation-meta",
      name: "Order Confirmation (Meta)",
      description: "Meta Cloud API template for order confirmation.",
      category: "ORDER_CONFIRMATION",
      status: "DRAFT",
      bodyText: "Order {{orderNumber}} confirmed. Total: {{total}}. Track here: {{trackUrl}}"
    },
    {
      slug: "shipping-update-meta",
      name: "Shipping Update (Meta)",
      description: "Meta Cloud API template for shipping updates.",
      category: "SHIPPING_UPDATE",
      status: "DRAFT",
      bodyText: "Order {{orderNumber}} shipped. Tracking: {{trackingNumber}}. Link: {{trackUrl}}"
    },
    {
      slug: "order-status-update-whatsapp",
      name: "Order Status Update (WhatsApp)",
      description: "Unified WhatsApp update for order status changes.",
      category: "UTILITY",
      status: "DRAFT",
      bodyText: "PrintHub: {{title}} – Order {{orderNumber}}. Track: {{trackUrl}}"
    }
  ];

  for (const t of whatsappTemplates) {
    await prisma.whatsAppTemplate.upsert({
      where: { slug: t.slug },
      update: { ...t },
      create: { ...t }
    });
    console.log(`✅ WhatsApp Template: ${t.slug}`);
  }

  // --- PDF Templates ---
  const pdfTemplates = [
    {
      slug: "customer-invoice-pdf",
      name: "Customer Invoice (Standard)",
      description: "Standard tax invoice for customers.",
      status: "DRAFT",
      bodyHtml: `
<div style="font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: auto;">
  <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #E2E8F0; padding-bottom: 20px; margin-bottom: 20px;">
    <div>
      <h1 style="color: #D85A30; margin: 0;">INVOICE</h1>
      <p style="margin: 5px 0;">#{{orderNumber}}</p>
    </div>
    <div style="text-align: right;">
      <h2 style="margin: 0;">PrintHub Africa</h2>
      <p style="margin: 5px 0;">Nairobi, Kenya</p>
    </div>
  </div>

  <div style="margin-bottom: 30px;">
    <p><strong>Billed To:</strong><br>{{customerName}}<br>{{customerEmail}}</p>
    <p><strong>Date:</strong> {{date}}</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
    <thead>
      <tr style="background: #F8FAFC; border-bottom: 1px solid #E2E8F0;">
        <th style="padding: 10px; text-align: left;">Description</th>
        <th style="padding: 10px; text-align: right;">Qty</th>
        <th style="padding: 10px; text-align: right;">Unit Price</th>
        <th style="padding: 10px; text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      {{#items}}
      <tr style="border-bottom: 1px solid #F1F5F9;">
        <td style="padding: 10px;">{{description}}</td>
        <td style="padding: 10px; text-align: right;">{{quantity}}</td>
        <td style="padding: 10px; text-align: right;">{{unitPrice}}</td>
        <td style="padding: 10px; text-align: right;">{{total}}</td>
      </tr>
      {{/items}}
    </tbody>
  </table>

  <div style="text-align: right; border-top: 2px solid #E2E8F0; padding-top: 10px;">
    <p>Subtotal: {{subtotal}}</p>
    <p>VAT (16%): {{vat}}</p>
    <h2 style="color: #D85A30;">Total: {{total}}</h2>
  </div>
</div>`
    },
    {
      slug: "customer-quote-pdf",
      name: "Customer Quote (Standard)",
      description: "Standard quote for custom print jobs.",
      status: "DRAFT",
      bodyHtml: `
<div style="font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: auto;">
  <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #E2E8F0; padding-bottom: 20px; margin-bottom: 20px;">
    <div>
      <h1 style="color: #D85A30; margin: 0;">QUOTATION</h1>
      <p style="margin: 5px 0;">Ref: {{quoteRef}}</p>
    </div>
    <div style="text-align: right;">
      <h2 style="margin: 0;">PrintHub Africa</h2>
    </div>
  </div>

  <p><strong>Quotated For:</strong> {{clientName}}</p>
  <p>Valid until: <strong>{{validUntil}}</strong></p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
    <thead>
      <tr style="background: #F8FAFC; border-bottom: 1px solid #E2E8F0;">
        <th style="padding: 10px; text-align: left;">Item Description</th>
        <th style="padding: 10px; text-align: right;">Qty</th>
        <th style="padding: 10px; text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      {{#items}}
      <tr style="border-bottom: 1px solid #F1F5F9;">
        <td style="padding: 10px;">{{description}}</td>
        <td style="padding: 10px; text-align: right;">{{quantity}}</td>
        <td style="padding: 10px; text-align: right;">{{total}}</td>
      </tr>
      {{/items}}
    </tbody>
  </table>

  <div style="text-align: right;">
    <h2 style="color: #D85A30;">Grand Total: {{total}}</h2>
  </div>
</div>`
    }
  ];

  for (const t of pdfTemplates) {
    await prisma.pdfTemplate.upsert({
      where: { slug: t.slug },
      update: { ...t },
      create: { ...t }
    });
    console.log(`✅ PDF Template: ${t.slug}`);
  }

  console.log("✨ Seeding Complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
