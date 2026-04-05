import { PrismaClient, TemplateType, TemplateStatus } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_TEMPLATES = [
  // --- WhatsApp Templates ---
  {
    slug: "3d-print-quote-whatsapp",
    name: "3D Print Quote Generator (WhatsApp)",
    type: TemplateType.WHATSAPP,
    status: TemplateStatus.DRAFT,
    description: "WhatsApp message generated from the 3D Print Quote tool.",
    subject: "",
    bodyHtml: `PrintHub quote for {{clientName}}\nValid until: {{validUntil}}\nTotal: {{finalTotal}}\n\nDetails:\n{{lines}}`,
  },
  {
    slug: "lf-print-quote-whatsapp",
    name: "Large Format Quote Generator (WhatsApp)",
    type: TemplateType.WHATSAPP,
    status: TemplateStatus.DRAFT,
    description: "WhatsApp message generated from the Large Format Quote tool.",
    subject: "",
    bodyHtml: `PrintHub quote for {{clientName}}\nValid until: {{validUntil}}\nTotal: {{finalTotal}}\n\nDetails:\n{{lines}}`,
  },
  {
    slug: "order-confirmation-meta",
    name: "Meta WhatsApp Order Confirmation",
    type: TemplateType.WHATSAPP,
    status: TemplateStatus.DRAFT,
    description: "Offical WhatsApp order confirmation matching the Meta UI template.",
    subject: "",
    bodyHtml: `Order {{orderNumber}} Confirmed! Total: {{total}}. Track your order: {{trackUrl}}`, 
  },
  {
    slug: "shipping-update-meta",
    name: "Meta WhatsApp Shipping Update",
    type: TemplateType.WHATSAPP,
    status: TemplateStatus.DRAFT,
    description: "WhatsApp shipping update message matching the Meta UI template.",
    subject: "",
    bodyHtml: `Order {{orderNumber}} Shipped! Tracking Number: {{trackingNumber}}. Track: {{trackUrl}}`,
  },
  {
    slug: "order-status-update-whatsapp",
    name: "Order Tracking Event Update (SMS/WhatsApp)",
    type: TemplateType.WHATSAPP,
    status: TemplateStatus.DRAFT,
    description: "Standard SMS/WhatsApp message sent on order status update.",
    subject: "",
    bodyHtml: `PrintHub: {{title}} – Order {{orderNumber}}. Track: {{trackUrl}}`,
  },
  
  // --- PDF Templates ---
  {
    slug: "customer-invoice-pdf",
    name: "Customer Invoice (PDF)",
    type: TemplateType.PDF,
    status: TemplateStatus.DRAFT,
    description: "Official tax invoice PDF document.",
    subject: "Invoice - {{invoiceNumber}}",
    bodyHtml: `<html>
<head>
  <style>
    body { font-family: sans-serif; padding: 40px; }
    h1 { color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #EEE; padding-bottom: 20px; }
    .meta { color: #555; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border-bottom: 1px solid #EEE; padding: 10px; text-align: left; }
    .totals { text-align: right; margin-top: 20px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>INVOICE</h1>
      <p class="meta">{{businessName}}</p>
      <p class="meta">{{businessAddress}}</p>
      <p class="meta">KRA PIN: {{kraPin}}</p>
    </div>
    <div>
      <p><b>Invoice #:</b> {{invoiceNumber}}</p>
      <p><b>Order #:</b> {{orderNumber}}</p>
      <p><b>Date:</b> {{date}}</p>
    </div>
  </div>
  <div>
    <h3>Bill To:</h3>
    <p>{{billTo}}</p>
    <p>{{billToEmail}}</p>
    <p>{{billToAddress}}</p>
  </div>
  <table>
    <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
    <tbody>
      {{#items}}
        <tr><td>{{name}}</td><td>{{qty}}</td><td>{{unitPrice}}</td><td>{{lineTotal}}</td></tr>
      {{/items}}
    </tbody>
  </table>
  <div class="totals">
    <p>Subtotal: {{subtotal}}</p>
    <p>VAT: {{vatAmount}}</p>
    <p>Discount: {{discount}}</p>
    <p>Shipping: {{shippingCost}}</p>
    <h3>Total: {{totalAmount}}</h3>
  </div>
</body>
</html>`,
  },
  {
    slug: "customer-quote-pdf",
    name: "Customer Quote (PDF)",
    type: TemplateType.PDF,
    status: TemplateStatus.DRAFT,
    description: "Official quotation PDF document for custom jobs.",
    subject: "Quotation - {{quoteNumber}}",
    bodyHtml: `<html>
<head>
  <style>
    body { font-family: sans-serif; padding: 40px; }
    h1 { color: #333; border-bottom: 2px solid #EEE; padding-bottom: 20px;}
    .meta { color: #555; margin-bottom: 40px; }
    .details { margin-top: 20px; border: 1px solid #EEE; padding: 20px; border-radius: 8px;}
  </style>
</head>
<body>
  <h1>QUOTE: {{quoteNumber}}</h1>
  <div class="meta">
    <p><b>{{businessName}}</b></p>
    <p>{{businessAddress}}</p>
    <p>Date: {{date}}</p>
    <p>Type: {{typeLabel}}</p>
    <p>Valid for: {{validityDays}} days</p>
  </div>
  <div>
    <h3>Customer Details:</h3>
    <p>{{customerName}}</p>
    <p>{{customerEmail}}</p>
    <p>{{customerPhone}}</p>
  </div>
  <div class="details">
    <h3>Project overview</h3>
    <p><b>Project Name:</b> {{projectName}}</p>
    <p><b>Description:</b> {{description}}</p>
    <p><b>Breakdown:</b> {{quoteBreakdown}}</p>
    <h2 style="text-align: right; margin-top: 30px;">Total Quoted: {{quotedAmount}}</h2>
  </div>
</body>
</html>`,
  }
];

async function main() {
  console.log("Starting Template Audit Seeding...");

  for (const template of SEED_TEMPLATES) {
    const existing = await prisma.template.findUnique({
      where: { slug: template.slug },
    });

    if (existing) {
      console.log(\`✅ Skipping existing template: \${template.slug}\`);
    } else {
      await prisma.template.create({
        data: template,
      });
      console.log(\`✨ Created new template: \${template.slug}\`);
    }
  }

  console.log("Template seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
