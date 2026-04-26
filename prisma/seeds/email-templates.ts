/**
 * Seed email templates (default subject + body with {{placeholders}}).
 * Run: npm run db:seed:email-templates
 * Safe to re-run (upserts by slug).
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

const DEFAULT_TEMPLATES: { slug: string; subject: string; bodyHtml: string }[] = [
  {
    slug: "verification",
    subject: "Verify your {{businessName}} account",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <h1 style="color: #CC3D00;">{{businessName}}</h1>
  <p>Thanks for signing up. Please verify your email by clicking the link below:</p>
  <p><a href="{{verifyUrl}}" style="color: #CC3D00; font-weight: bold;">Verify my email</a></p>
  <p>Or copy this link: {{verifyUrl}}</p>
  <p>This link expires in 24 hours.</p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
  {
    slug: "password-reset",
    subject: "Reset your {{businessName}} password",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <h1 style="color: #CC3D00;">{{businessName}}</h1>
  <p>You requested a password reset. Click the link below to set a new password:</p>
  <p><a href="{{resetUrl}}" style="color: #CC3D00; font-weight: bold;">Reset password</a></p>
  <p>Or copy this link: {{resetUrl}}</p>
  <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
  {
    slug: "staff-invite",
    subject: "Welcome to {{businessName}} — set your password",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <h1 style="color: #CC3D00;">{{businessName}}</h1>
  <p>You’ve been invited to join the PrintHub admin team.</p>
  <p><strong>Your login email:</strong> {{loginEmail}}</p>
  <p>Click the link below to set your password:</p>
  <p><a href="{{resetUrl}}" style="color: #CC3D00; font-weight: bold;">Set your password</a></p>
  <p>Or copy this link: {{resetUrl}}</p>
  <p>This invite link expires in 48 hours. If you weren’t expecting this, ignore this email.</p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
  {
    slug: "quote-received",
    subject: "Quote request {{quoteNumber}} received – {{businessName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
  <h2 style="color: #CC3D00;">{{businessName}} – Quote received</h2>
  <p>We've received your quote request <strong>{{quoteNumber}}</strong> ({{typeLabel}}).</p>
  <p>We'll review it and respond within 1–2 business days.</p>
  <p><a href="{{quotesUrl}}" style="color: #CC3D00; font-weight: bold;">View my quotes</a></p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
  {
    slug: "order-confirmation",
    subject: "Order {{orderNumber}} confirmed – {{businessName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <h1 style="color: #CC3D00;">{{businessName}}</h1>
  <p>Thank you for your order.</p>
  <p><strong>Order number:</strong> {{orderNumber}}</p>
  <p><strong>Total:</strong> {{currency}} {{orderTotal}}</p>
  <p>We'll notify you when your order is on its way. You can track it in your account.</p>
  <p><a href="{{orderUrl}}" style="color: #CC3D00; font-weight: bold;">View my orders</a></p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
  {
    slug: "order-status",
    subject: "Order {{orderNumber}} – {{title}} – {{businessName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <h1 style="color: #CC3D00;">{{businessName}}</h1>
  <p><strong>Order {{orderNumber}}</strong></p>
  <p><strong>{{title}}</strong></p>
  <p>{{description}}</p>
  <p><a href="{{trackUrl}}" style="color: #CC3D00; font-weight: bold;">Track your order</a></p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
  {
    slug: "payment-received",
    subject: "Payment reference received – Order {{orderNumber}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <h1 style="color: #CC3D00;">{{businessName}}</h1>
  <p>We received your payment reference <strong>{{reference}}</strong> for order <strong>{{orderNumber}}</strong>.</p>
  <p>Our team will confirm your {{method}} payment within 30 minutes (Mon–Fri 8am–6pm).</p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
  {
    slug: "payment-rejected",
    subject: "Payment verification – Order {{orderNumber}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <h1 style="color: #CC3D00;">{{businessName}}</h1>
  <p>We couldn't verify the payment reference <strong>{{reference}}</strong> for order <strong>{{orderNumber}}</strong>.</p>
  <p>Please contact us on <a href="{{whatsapp}}" style="color: #CC3D00;">WhatsApp</a> with your M-Pesa receipt so we can complete your order.</p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
  {
    slug: "pickup-confirmation",
    subject: "Order {{orderNumber}} – Pay when you collect",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <h1 style="color: #CC3D00;">{{businessName}}</h1>
  <p>Your order <strong>{{orderNumber}}</strong> is confirmed. You'll pay when you collect.</p>
  <p><strong>Pickup code:</strong> <span style="font-size: 1.2em; letter-spacing: 0.2em;">{{pickupCode}}</span></p>
  <p><strong>Amount to pay at collection:</strong> KSh {{totalKes}}</p>
  <p>We'll notify you when your order is ready. Bring this code to our Nairobi studio.</p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
  {
    slug: "quote-sent-to-customer",
    subject: "Your quote {{quoteNumber}} – {{businessName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
  <h2 style="color: #CC3D00;">{{businessName}} – Your quote</h2>
  <p>We've prepared a quote for your request <strong>{{quoteNumber}}</strong>.</p>
  <p><strong>Amount:</strong> KES {{quotedAmountKes}}</p>
  <p>{{validity}}</p>
  <p><a href="{{quotesUrl}}" style="color: #CC3D00; font-weight: bold;">View quote &amp; Accept or Decline</a></p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
  {
    slug: "staff-quote-accepted",
    subject: "Quote {{quoteNumber}} accepted – {{businessName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
  <h2 style="color: #CC3D00;">Quote accepted</h2>
  <p><strong>{{quoteNumber}}</strong> has been accepted by <strong>{{customerName}}</strong>.</p>
  <p><strong>Amount:</strong> KES {{quotedAmountKes}}</p>
  <p><a href="{{adminUrl}}" style="color: #CC3D00; font-weight: bold;">View in Admin</a></p>
  <p style="color: #6B6B6B; font-size: 12px;">{{businessName}} Admin</p>
</div>`,
  },
  {
    slug: "staff-quote-assigned",
    subject: "Quote {{quoteNumber}} assigned to you – {{businessName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
  <h2 style="color: #CC3D00;">New quote assigned</h2>
  <p>Quote <strong>{{quoteNumber}}</strong> ({{typeLabel}}) from <strong>{{customerName}}</strong> has been assigned to you.</p>
  <p><a href="{{adminUrl}}" style="color: #CC3D00; font-weight: bold;">View in Admin</a></p>
  <p style="color: #6B6B6B; font-size: 12px;">{{businessName}} Admin</p>
</div>`,
  },
  {
    slug: "quote-in-production",
    subject: "Quote {{quoteNumber}} – Now in production – {{businessName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
  <h2 style="color: #CC3D00;">{{businessName}} – We're on it</h2>
  <p>Your order for quote <strong>{{quoteNumber}}</strong> is now in production.</p>
  <p>We'll notify you when it's ready. You can also check status in your account.</p>
  <p><a href="{{quotesUrl}}" style="color: #CC3D00; font-weight: bold;">View my quotes</a></p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
  {
    slug: "career-application-confirmation",
    subject: "Application received — {{jobTitle}} at {{businessName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
  <h2 style="color: #CC3D00;">{{businessName}}</h2>
  <p>Hi {{firstName}},</p>
  <p>Thanks for applying for the <strong>{{jobTitle}}</strong> position at {{businessName}}.</p>
  <p>We've received your application and our team will review it carefully. You'll hear back from us within 5 business days.</p>
  <p>Your application reference: <strong>{{applicationRef}}</strong></p>
  <p>Best,<br>The {{businessName}} Team<br>{{site}}</p>
</div>`,
  },
  {
    slug: "career-application-admin",
    subject: "New application: {{jobTitle}} — {{applicantName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
  <h2 style="color: #CC3D00;">New job application</h2>
  <p><strong>Role:</strong> {{jobTitle}}</p>
  <p><strong>Applicant:</strong> {{applicantName}}</p>
  <p><strong>Email:</strong> {{applicantEmail}}</p>
  <p><strong>Phone:</strong> {{applicantPhone}}</p>
  <p><strong>Applied:</strong> {{appliedAt}}</p>
  <p><a href="{{viewUrl}}" style="color: #CC3D00; font-weight: bold;">View Application →</a></p>
  <p style="color: #6B6B6B; font-size: 12px;">{{businessName}} Admin | {{site}}</p>
</div>`,
  },
  {
    slug: "career-shortlisted",
    subject: "You've been shortlisted — {{jobTitle}} at {{businessName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
  <h2 style="color: #CC3D00;">{{businessName}}</h2>
  <p>Hi {{firstName}},</p>
  <p>Good news! We've reviewed your application for the <strong>{{jobTitle}}</strong> position and would like to move forward.</p>
  <p>Our team will be in touch to schedule an interview.</p>
  <p>Best,<br>The {{businessName}} Team<br>{{site}}</p>
</div>`,
  },
  {
    slug: "career-rejected",
    subject: "Your application — {{jobTitle}} at {{businessName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
  <h2 style="color: #CC3D00;">{{businessName}}</h2>
  <p>Hi {{firstName}},</p>
  <p>Thank you for your interest in the <strong>{{jobTitle}}</strong> position.</p>
  <p>After careful consideration, we won't be moving forward with your application at this time. We'll keep your details on file and encourage you to apply for future roles.</p>
  <p>Best,<br>The {{businessName}} Team<br>{{site}}</p>
</div>`,
  },
  {
    slug: "career-offer",
    subject: "An offer from {{businessName}} — {{jobTitle}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
  <h2 style="color: #CC3D00;">{{businessName}}</h2>
  <p>Hi {{firstName}},</p>
  <p>We're delighted to offer you the <strong>{{jobTitle}}</strong> position.</p>
  <p>Please check your email for the formal offer letter.</p>
  <p>Best,<br>The {{businessName}} Team<br>{{site}}</p>
</div>`,
  },
  {
    slug: "abandoned-cart-1",
    subject: "You left something in your cart – {{businessName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <h1 style="color: #CC3D00;">{{businessName}}</h1>
  <p>Hi {{firstName}},</p>
  <p>You left items in your cart. Complete your order when you're ready – your cart is saved.</p>
  <p><a href="{{cartUrl}}" style="color: #CC3D00; font-weight: bold;">Return to cart</a></p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
  {
    slug: "abandoned-cart-2",
    subject: "Still thinking? Your cart is waiting – {{businessName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <h1 style="color: #CC3D00;">{{businessName}}</h1>
  <p>Hi {{firstName}},</p>
  <p>Your saved cart is still here. If you have any questions, just reply to this email.</p>
  <p><a href="{{cartUrl}}" style="color: #CC3D00; font-weight: bold;">Complete your order</a></p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
  {
    slug: "corporate-received",
    subject: "Corporate account application received – {{businessName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <h1 style="color: #CC3D00;">{{businessName}}</h1>
  <p>Hi {{applicantName}},</p>
  <p>We've received your corporate account application for <strong>{{companyName}}</strong>.</p>
  <p>Reference: <strong>{{applicationRef}}</strong></p>
  <p>Our team will review your application and respond within 1 business day.</p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
  {
    slug: "corporate-new-admin",
    subject: "New corporate account application: {{companyName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
  <h2 style="color: #CC3D00;">{{businessName}}</h2>
  <p>A new corporate account application has been submitted.</p>
  <p><strong>Company:</strong> {{companyName}}<br><strong>Contact:</strong> {{contactPerson}}</p>
  <p><a href="{{adminUrl}}" style="color: #CC3D00; font-weight: bold;">Review applications</a></p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
  {
    slug: "corporate-approved",
    subject: "Your corporate account is approved – {{businessName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
  <h2 style="color: #CC3D00;">{{businessName}}</h2>
  <p>Hi {{contactPerson}},</p>
  <p>Great news — your corporate account application for <strong>{{companyName}}</strong> has been approved.</p>
  <p>Your account number: <strong>{{accountNumber}}</strong></p>
  <p>You can now sign in and access your corporate dashboard, place orders with corporate pricing, and manage your team.</p>
  <p><a href="{{dashboardUrl}}" style="color: #CC3D00; font-weight: bold;">Go to Corporate Dashboard</a></p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
  {
    slug: "corporate-rejected",
    subject: "Update on your corporate account application – {{businessName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
  <h2 style="color: #CC3D00;">{{businessName}}</h2>
  <p>Hi {{contactPerson}},</p>
  <p>Thank you for your interest in a corporate account with {{businessName}}. After review, we are unable to approve your application for <strong>{{companyName}}</strong> at this time.</p>
  {{reasonLine}}
  <p>If you have questions or would like to reapply in the future, please contact us or submit a new application.</p>
  <p><a href="{{applyUrl}}" style="color: #CC3D00; font-weight: bold;">Apply again</a></p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
  {
    slug: "delivery-dispatched",
    subject: "Order {{orderNumber}} is on its way – {{businessName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <h1 style="color: #CC3D00;">{{businessName}}</h1>
  <p>Your order <strong>{{orderNumber}}</strong> has been dispatched and is on its way.</p>
  {{trackingLine}}
  <p><a href="{{trackUrl}}" style="color: #CC3D00; font-weight: bold;">Track your order</a></p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
  {
    slug: "delivery-delivered",
    subject: "Order {{orderNumber}} delivered – {{businessName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <h1 style="color: #CC3D00;">{{businessName}}</h1>
  <p>Your order <strong>{{orderNumber}}</strong> has been delivered. Thank you for shopping with us!</p>
  <p><a href="{{ordersUrl}}" style="color: #CC3D00; font-weight: bold;">View my orders</a></p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
  {
    slug: "delivery-failed",
    subject: "Delivery update – Order {{orderNumber}} – {{businessName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <h1 style="color: #CC3D00;">{{businessName}}</h1>
  <p>We're sorry – there was an issue delivering your order <strong>{{orderNumber}}</strong>.</p>
  {{reasonLine}}
  <p>Our team will contact you to rearrange delivery. If you have questions, please <a href="{{supportUrl}}" style="color: #CC3D00;">contact us</a>.</p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
  {
    slug: "order-cancelled",
    subject: "Order {{orderNumber}} cancelled – {{businessName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <h1 style="color: #CC3D00;">{{businessName}}</h1>
  <p>Your order <strong>{{orderNumber}}</strong> has been cancelled.</p>
  {{reasonLine}}
  <p>If you have questions or would like to place a new order, <a href="{{ordersUrl}}" style="color: #CC3D00;">visit your orders</a>.</p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
  {
    slug: "refund-approved",
    subject: "Refund {{refundNumber}} approved – {{businessName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <h1 style="color: #CC3D00;">{{businessName}}</h1>
  <p>Your refund request <strong>{{refundNumber}}</strong> for order {{orderNumber}} has been approved.</p>
  <p><strong>Amount:</strong> KES {{amountKes}}</p>
  <p>We will process the refund to your M-Pesa number shortly. You will receive another email when it is sent.</p>
  <p><a href="{{ordersUrl}}" style="color: #CC3D00; font-weight: bold;">View my orders</a></p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
  {
    slug: "refund-rejected",
    subject: "Refund {{refundNumber}} – {{businessName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <h1 style="color: #CC3D00;">{{businessName}}</h1>
  <p>Your refund request <strong>{{refundNumber}}</strong> for order {{orderNumber}} could not be approved.</p>
  {{reasonLine}}
  <p>If you have questions, please <a href="{{supportUrl}}" style="color: #CC3D00;">contact us</a>.</p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
  {
    slug: "refund-processed",
    subject: "Refund {{refundNumber}} sent – {{businessName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <h1 style="color: #CC3D00;">{{businessName}}</h1>
  <p>Your refund <strong>{{refundNumber}}</strong> for order {{orderNumber}} has been sent to your M-Pesa account.</p>
  <p><strong>Amount:</strong> KES {{amountKes}}</p>
  {{receiptLine}}
  <p>Thank you for your patience.</p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
  {
    slug: "ticket-created",
    subject: "Support request {{ticketNumber}} received – {{businessName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <h1 style="color: #CC3D00;">{{businessName}}</h1>
  <p>We've received your support request.</p>
  <p><strong>Ticket:</strong> {{ticketNumber}}<br><strong>Subject:</strong> {{ticketSubject}}</p>
  <p>Our team will respond as soon as possible. You can view and reply in your account.</p>
  <p><a href="{{supportUrl}}" style="color: #CC3D00; font-weight: bold;">View my tickets</a></p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
  {
    slug: "ticket-replied",
    subject: "New reply on {{ticketNumber}} – {{businessName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <h1 style="color: #CC3D00;">{{businessName}}</h1>
  <p>We've replied to your support request <strong>{{ticketNumber}}</strong> ({{ticketSubject}}).</p>
  <p style="background: #f5f5f5; padding: 12px; border-radius: 6px; font-size: 14px;">{{messagePreview}}</p>
  <p><a href="{{supportUrl}}" style="color: #CC3D00; font-weight: bold;">View ticket &amp; reply</a></p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
  {
    slug: "ticket-resolved",
    subject: "Ticket {{ticketNumber}} resolved – {{businessName}}",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <h1 style="color: #CC3D00;">{{businessName}}</h1>
  <p>Your support request <strong>{{ticketNumber}}</strong> ({{ticketSubject}}) has been marked as resolved.</p>
  <p>If you need further help, you can reopen the ticket or create a new one.</p>
  <p><a href="{{supportUrl}}" style="color: #CC3D00; font-weight: bold;">View my tickets</a></p>
  <p style="color: #6B6B6B; font-size: 12px;">{{footer}}</p>
</div>`,
  },
];

const TEMPLATE_NAMES: Record<string, string> = {
  verification: "Email verification",
  "password-reset": "Password reset",
  "quote-received": "Quote request received",
  "order-confirmation": "Order confirmation",
  "order-status": "Order status / tracking",
  "payment-received": "Payment reference received",
  "payment-rejected": "Payment verification failed",
  "pickup-confirmation": "Pay on pickup confirmation",
  "quote-sent-to-customer": "Quote sent to customer",
  "staff-quote-accepted": "Staff: quote accepted",
  "staff-quote-assigned": "Staff: quote assigned",
  "quote-in-production": "Quote in production",
  "career-application-confirmation": "Career: application received",
  "career-application-admin": "Career: new application (admin)",
  "career-shortlisted": "Career: shortlisted",
  "career-rejected": "Career: application not successful",
  "career-offer": "Career: offer made",
  "abandoned-cart-1": "Abandoned cart (first reminder)",
  "abandoned-cart-2": "Abandoned cart (second reminder)",
  "corporate-received": "Corporate application received",
  "corporate-new-admin": "Corporate: new application (admin)",
  "corporate-approved": "Corporate application approved",
  "corporate-rejected": "Corporate application rejected",
  "delivery-dispatched": "Delivery dispatched",
  "delivery-delivered": "Delivery delivered",
  "delivery-failed": "Delivery failed",
  "order-cancelled": "Order cancelled",
  "refund-approved": "Refund approved",
  "refund-rejected": "Refund rejected",
  "refund-processed": "Refund processed",
  "ticket-created": "Support ticket created",
  "ticket-replied": "Support ticket replied",
  "ticket-resolved": "Support ticket resolved",
};

async function main() {
  await assertPrinthubDatabase(prisma);
  console.log("Seeding email templates...");
  for (const def of DEFAULT_TEMPLATES) {
    const name = TEMPLATE_NAMES[def.slug] ?? def.slug;
    await prisma.emailTemplate.upsert({
      where: { slug: def.slug },
      update: { subject: def.subject, bodyHtml: def.bodyHtml, name },
      create: {
        slug: def.slug,
        name,
        subject: def.subject,
        bodyHtml: def.bodyHtml,
      },
    });
  }
  console.log("Email templates seeded:", DEFAULT_TEMPLATES.length);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
