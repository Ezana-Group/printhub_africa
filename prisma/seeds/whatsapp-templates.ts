/**
 * Seed WhatsApp templates (bodyText with {{placeholders}}).
 * Run: npm run db:seed:whatsapp-templates
 * Safe to re-run (upserts by slug).
 *
 * AUDIT SOURCES
 * The slugs below were derived from an audit of hardcoded template names /
 * message bodies found across the codebase on 2026-04-05:
 *
 *   n8n template name "order_confirmation"
 *     → n8n/workflows/printhub_base_workflows.json
 *     → n8n/workflows/commerce-sales/01-printhub-order-confirmation-email-wa-sms-tracking.json
 *
 *   n8n template name "delivery_update"
 *     → n8n/workflows/commerce-sales/03-printhub-delivery-status-changed-post-dispatch-automation.json
 *
 *   Hardcoded inline text (abandoned cart)
 *     → n8n/workflows/commerce-sales/07-printhub-abandoned-cart-recovery-3-stage-sequence.json
 *
 *   Template already fetched by slug "quote-ready-whatsapp" (already migrated)
 *     → n8n/workflows/commerce-sales/09-printhub-quote-ready-notification.json
 *
 *   Hardcoded support contact message
 *     → app/api/account/quotes/[id]/route.ts:122
 */

if (process.env.PRINTHUB_SEED_ALLOW !== "1") {
  console.error("❌ Seeding blocked. PRINTHUB_SEED_ALLOW is not set to 1.");
  process.exit(1);
}

import path from "node:path";
import { config } from "dotenv";

const root = path.resolve(__dirname, "../..");
config({ path: path.join(root, ".env.local") });
config({ path: path.join(root, ".env") });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { assertPrinthubDatabase } from "../../lib/db-guard";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to .env or .env.local.");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

interface WaTemplateDef {
  slug: string;
  name: string;
  description: string;
  category: "UTILITY" | "MARKETING" | "AUTHENTICATION";
  bodyText: string;
}

const DEFAULT_TEMPLATES: WaTemplateDef[] = [
  // ─── Order ──────────────────────────────────────────────────────────────
  {
    slug: "order-confirmation",
    name: "Order confirmation",
    description:
      "Sent to the customer immediately after an order is placed. " +
      "Used in the order-confirmation n8n workflow via the Meta Cloud API template name 'order_confirmation'.",
    category: "UTILITY",
    bodyText:
      "Hi {{customerName}}, your PrintHub order *{{orderNumber}}* has been confirmed! 🎉\n\n" +
      "We'll keep you updated as it moves through production. " +
      "Track your order here: {{orderUrl}}\n\n" +
      "Thank you for choosing PrintHub Africa! 🖨️",
  },
  {
    slug: "order-status-update",
    name: "Order status update",
    description:
      "Generic status change notification sent when an order moves between production stages.",
    category: "UTILITY",
    bodyText:
      "Hi {{customerName}}, here's an update on your PrintHub order *{{orderNumber}}*:\n\n" +
      "📌 *{{statusTitle}}*\n{{statusDescription}}\n\n" +
      "Track your order: {{trackUrl}}",
  },
  {
    slug: "order-ready-for-collection",
    name: "Order ready for collection",
    description:
      "Sent when a click-and-collect order is ready at the studio.",
    category: "UTILITY",
    bodyText:
      "Hi {{customerName}}, great news! Your PrintHub order *{{orderNumber}}* is ready for collection. 🎁\n\n" +
      "📍 *Pickup code:* {{pickupCode}}\n" +
      "🏢 Visit us at our Nairobi Studio — bring this code.\n\n" +
      "See you soon! — PrintHub Africa",
  },

  // ─── Delivery ────────────────────────────────────────────────────────────
  {
    slug: "delivery-update",
    name: "Delivery dispatched",
    description:
      "Sent when an order is dispatched for delivery. " +
      "Used via the Meta Cloud API template name 'delivery_update' in the delivery-status-changed n8n workflow.",
    category: "UTILITY",
    bodyText:
      "Hi {{customerName}}, your PrintHub order *{{orderNumber}}* is on its way! 🚚\n\n" +
      "Current status: *{{status}}*\n" +
      "{{trackingLine}}\n\n" +
      "Track here: {{trackUrl}}\n\n" +
      "Thank you for shopping with PrintHub Africa!",
  },
  {
    slug: "delivery-delivered",
    name: "Delivery delivered",
    description: "Sent when the courier marks an order as delivered.",
    category: "UTILITY",
    bodyText:
      "Hi {{customerName}}, your PrintHub order *{{orderNumber}}* has been delivered! ✅\n\n" +
      "We hope you love your prints. " +
      "Leave us a review: {{reviewUrl}}\n\n" +
      "— PrintHub Africa",
  },
  {
    slug: "delivery-failed",
    name: "Delivery failed",
    description: "Sent when a delivery attempt was unsuccessful.",
    category: "UTILITY",
    bodyText:
      "Hi {{customerName}}, we're sorry — we couldn't deliver your order *{{orderNumber}}* today.\n\n" +
      "{{reasonLine}}\n\n" +
      "Our team will be in touch to reschedule. You can also reach us here: {{supportUrl}}",
  },

  // ─── Quote ───────────────────────────────────────────────────────────────
  {
    slug: "quote-received",
    name: "Quote request received",
    description: "Sent when a customer submits a new quote request.",
    category: "UTILITY",
    bodyText:
      "Hi {{customerName}}, we've received your quote request *{{quoteNumber}}*. 📋\n\n" +
      "Our team will review it and respond within 1–2 business days.\n\n" +
      "View your quote: {{quotesUrl}}\n\n" +
      "— PrintHub Africa",
  },
  {
    slug: "quote-ready-whatsapp",
    name: "Quote ready for customer",
    description:
      "Sent when a staff member marks a quote as ready and sends it to the customer. " +
      "Already fetched by slug in commerce-sales/09-printhub-quote-ready-notification.json.",
    category: "UTILITY",
    bodyText:
      "Hi {{customerName}}, your PrintHub quote *{{projectName}}* is ready! 🖨️\n\n" +
      "💰 *Total: KES {{quoteTotal}}*\n\n" +
      "Review and accept or decline here: {{quotesUrl}}\n\n" +
      "Valid for 7 days. Questions? Reply to this message.\n— PrintHub Africa",
  },
  {
    slug: "quote-in-production",
    name: "Quote accepted — now in production",
    description:
      "Sent to the customer when their accepted quote moves into production.",
    category: "UTILITY",
    bodyText:
      "Hi {{customerName}}, great news! Your PrintHub job *{{quoteNumber}}* is now in production. 🏭\n\n" +
      "We'll notify you when it's ready. View your quote: {{quotesUrl}}\n\n" +
      "— PrintHub Africa",
  },

  // ─── Payments ────────────────────────────────────────────────────────────
  {
    slug: "payment-received",
    name: "Payment reference received",
    description:
      "Sent on receipt of an M-Pesa or manual payment reference, before verification.",
    category: "UTILITY",
    bodyText:
      "Hi {{customerName}}, we've received your payment reference *{{reference}}* for order *{{orderNumber}}*. 💳\n\n" +
      "Our team will verify your {{method}} payment within 30 minutes (Mon–Fri, 8am–6pm).\n\n" +
      "— PrintHub Africa",
  },
  {
    slug: "payment-rejected",
    name: "Payment verification failed",
    description:
      "Sent when a payment reference cannot be matched / verified.",
    category: "UTILITY",
    bodyText:
      "Hi {{customerName}}, we couldn't verify payment reference *{{reference}}* for order *{{orderNumber}}*. ⚠️\n\n" +
      "Please reply with your M-Pesa receipt so we can complete your order. " +
      "Or reach us here: {{supportUrl}}\n\n" +
      "— PrintHub Africa",
  },

  // ─── Support & Contact ───────────────────────────────────────────────────
  {
    slug: "support-contact",
    name: "Support contact message",
    description:
      "Generic support message returned to customers who need to contact PrintHub via WhatsApp. " +
      "Referenced in app/api/account/quotes/[id]/route.ts for cancellation-cutoff errors.",
    category: "UTILITY",
    bodyText:
      "Please contact us on WhatsApp: https://wa.me/{{whatsappNumber}}",
  },

  // ─── Abandoned Cart ──────────────────────────────────────────────────────
  {
    slug: "abandoned-cart-whatsapp",
    name: "Abandoned cart reminder (WhatsApp)",
    description:
      "Sent in the 3-stage abandoned-cart n8n sequence. " +
      "Stage 2 adds a discount code. Derived from the inline text in " +
      "commerce-sales/07-printhub-abandoned-cart-recovery-3-stage-sequence.json.",
    category: "MARKETING",
    bodyText:
      "Hi {{firstName}}! 👋 You left {{itemCount}} item(s) in your PrintHub cart worth *KES {{totalValue}}*.\n\n" +
      "{{discountLine}}\n\n" +
      "Complete your order here: {{cartUrl}}\n\n" +
      "— PrintHub Africa",
  },

  // ─── Authentication ──────────────────────────────────────────────────────
  {
    slug: "otp-verification",
    name: "OTP / verification code",
    description:
      "One-time-password message for WhatsApp-based account verification or 2FA.",
    category: "AUTHENTICATION",
    bodyText:
      "Your PrintHub verification code is: *{{otp}}*\n\nThis code expires in 10 minutes. Do not share it with anyone.",
  },
];

// ---------------------------------------------------------------------------
// Display names map (human-readable label for the admin UI)
// ---------------------------------------------------------------------------
const TEMPLATE_NAMES: Record<string, string> = {
  "order-confirmation": "Order confirmation",
  "order-status-update": "Order status update",
  "order-ready-for-collection": "Order ready for collection",
  "delivery-update": "Delivery dispatched",
  "delivery-delivered": "Delivery delivered",
  "delivery-failed": "Delivery failed",
  "quote-received": "Quote request received",
  "quote-ready-whatsapp": "Quote ready for customer",
  "quote-in-production": "Quote accepted — now in production",
  "payment-received": "Payment reference received",
  "payment-rejected": "Payment verification failed",
  "support-contact": "Support contact message",
  "abandoned-cart-whatsapp": "Abandoned cart reminder (WhatsApp)",
  "otp-verification": "OTP / verification code",
};

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
async function main() {
  await assertPrinthubDatabase(prisma);
  console.log("Seeding WhatsApp templates...");

  for (const def of DEFAULT_TEMPLATES) {
    const name = TEMPLATE_NAMES[def.slug] ?? def.slug;
    await prisma.whatsAppTemplate.upsert({
      where: { slug: def.slug },
      update: {
        name,
        description: def.description,
        category: def.category,
        bodyText: def.bodyText,
      },
      create: {
        slug: def.slug,
        name,
        description: def.description,
        category: def.category,
        bodyText: def.bodyText,
      },
    });
    console.log(`  ✓ ${def.slug}`);
  }

  console.log(`\nWhatsApp templates seeded: ${DEFAULT_TEMPLATES.length}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
