import { Resend } from "resend";
import { getBusinessPublic } from "@/lib/business-public";
import { getEmailTemplate, renderTemplate } from "@/lib/email-templates";
import { prisma } from "@/lib/prisma";
import { n8n } from "@/lib/n8n";

export type AdminAlertEvent = 
  | "New Order" | "Payment Received" | "Payment Failed" | "New Upload" 
  | "Quote Request" | "Quote Accepted" | "Cancellation" | "Refund" 
  | "Corporate Application" | "Low Stock" | "Maintenance Alert" 
  | "Support Ticket" | "Negative Review";

export async function sendAdminAlert({
  event,
  subject,
  html,
}: {
  event: AdminAlertEvent;
  subject: string;
  html: string;
}) {
  const settings = await prisma.businessSettings.findUnique({
    where: { id: "default" },
    select: { adminAlertEmail: true, adminAlertEvents: true },
  }).catch(() => null);

  if (!settings?.adminAlertEmail) return;

  const enabledEvents = Array.isArray(settings.adminAlertEvents) 
    ? (settings.adminAlertEvents as string[]) 
    : [];

  if (!enabledEvents.includes(event)) {
    console.log(`[AdminAlert] Event ${event} is disabled. Skipping email.`);
    return;
  }

  return sendEmail({
    to: settings.adminAlertEmail,
    subject: `[Admin Alert] ${event}: ${subject}`,
    html,
  });
}

async function getEmailBranding() {
  const b = await getBusinessPublic();
  const location = [b.city, b.country].filter(Boolean).join(", ") || "Kenya";
  const footer = `${b.businessName} · ${location}`;
  return { businessName: b.businessName, footer };
}

const defaultFrom = process.env.FROM_EMAIL ?? "PrintHub <hello@printhub.africa>";

async function getEmailSettings() {
  const row = await prisma.businessSettings.findUnique({
    where: { id: "default" },
    select: {
      resendApiKey: true,
      emailFromName: true,
      emailFrom: true,
    },
  }).catch(() => null);

  return {
    apiKey: row?.resendApiKey || process.env.RESEND_API_KEY,
    fromName: row?.emailFromName,
    fromEmail: row?.emailFrom,
  };
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  fromOverride,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  fromOverride?: string;
}) {
  const settings = await getEmailSettings();

  if (!settings.apiKey) {
    console.warn("Resend API key not set; email not sent:", { to, subject });
    return { success: false, error: "email_not_configured" };
  }

  const resend = new Resend(settings.apiKey);

  let from = fromOverride ?? defaultFrom;
  if (!fromOverride && settings.fromEmail) {
    from = settings.fromName 
      ? `${settings.fromName} <${settings.fromEmail}>`
      : settings.fromEmail;
  }

  const payload: { from: string; to: string[]; subject: string; html?: string; text?: string } = {
    from,
    to: [to],
    subject,
  };
  if (html) payload.html = html;
  else if (text) payload.text = text;
  else payload.text = subject;

  const { data, error } = await resend.emails.send(payload as any);
  if (error) throw error;
  return data;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa";

/** If a template exists for slug, use it; otherwise use default subject/html. */
async function sendWithTemplate(
  slug: string,
  to: string,
  context: Record<string, string>,
  defaultSubject: string,
  defaultHtml: string,
  fromOverride?: string
) {
  const t = await getEmailTemplate(slug);
  const subject = t ? renderTemplate(t.subject, context) : defaultSubject;
  const html = t ? renderTemplate(t.bodyHtml, context) : defaultHtml;
  return sendEmail({ to, subject, html, fromOverride });
}

export async function sendVerificationEmail(email: string, token: string) {
  const { businessName, footer } = await getEmailBranding();
  // Link must hit the API so the token is consumed and emailVerified is set (the /verify-email page is informational only)
  const url = `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  const context = { businessName, footer, verifyUrl: url };
  const defaultSubject = `Verify your ${businessName} account`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>Thanks for signing up. Please verify your email by clicking the link below:</p>
        <p><a href="${url}" style="color: #FF4D00; font-weight: bold;">Verify my email</a></p>
        <p>Or copy this link: ${url}</p>
        <p>This link expires in 24 hours.</p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("verification", email, context, defaultSubject, defaultHtml);
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const { businessName, footer } = await getEmailBranding();
  const url = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const context = { businessName, footer, resetUrl: url };
  const defaultSubject = `Reset your ${businessName} password`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p><a href="${url}" style="color: #FF4D00; font-weight: bold;">Reset password</a></p>
        <p>Or copy this link: ${url}</p>
        <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("password-reset", email, context, defaultSubject, defaultHtml);
}

export async function sendStaffInviteEmail(
  email: string,
  token: string,
  loginEmail: string,
  inviteUrl?: string
) {
  const { businessName, footer } = await getEmailBranding();
  const url = inviteUrl ?? `${baseUrl}/reset-password?token=${token}`;
  const context = {
    businessName,
    footer,
    resetUrl: url,
    loginEmail: loginEmail.trim().toLowerCase(),
  };
  const defaultSubject = `Welcome to ${businessName} — set your password`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>You’ve been invited to join the PrintHub admin team.</p>
        <p><strong>Your login email:</strong> ${context.loginEmail}</p>
        <p>Click the link below to set your password:</p>
        <p><a href="${url}" style="color: #FF4D00; font-weight: bold;">Set your password</a></p>
        <p>Or copy this link: ${url}</p>
        <p>This invite link expires in 48 hours. If you weren’t expecting this, ignore this email.</p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate(
    "staff-invite",
    email,
    context,
    defaultSubject,
    defaultHtml,
    "PrintHub <welcome@printhub.africa>"
  );
}

export async function sendQuoteReceivedEmail(
  email: string,
  quoteNumber: string,
  typeLabel: string
) {
  const { businessName, footer } = await getEmailBranding();
  const quotesUrl = `${baseUrl}/account/quotes`;
  const context = { businessName, footer, quoteNumber, typeLabel, quotesUrl };
  const defaultSubject = `Quote request ${quoteNumber} received – ${businessName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">${businessName} – Quote received</h2>
        <p>We've received your quote request <strong>${quoteNumber}</strong> (${typeLabel}).</p>
        <p>We'll review it and respond within 1–2 business days.</p>
        <p><a href="${quotesUrl}" style="color: #FF4D00; font-weight: bold;">View my quotes</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("quote-received", email, context, defaultSubject, defaultHtml);
}

export async function sendOrderConfirmationEmail(
  email: string,
  orderNumber: string,
  total: number,
  currency = "KES"
) {
  // 1. Fetch full order for n8n payload
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { 
      items: { include: { product: true } },
      user: true,
      corporate: true
    }
  });

  if (order) {
    n8n.orderConfirmed({
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.userId || "guest",
      customerEmail: order.user?.email || email,
      customerPhone: order.user?.phone || "",
      customerName: order.user?.name || "Customer",
      totalAmount: Number(order.total),
      currency: "KES",
      items: order.items.map(i => ({
        name: i.product?.name || "Item",
        quantity: i.quantity,
        price: Number(i.unitPrice),
        imageUrl: i.product?.images?.[0]
      })),
      paymentMethod: order.paymentMethod || "UNKNOWN",
      deliveryMethod: (order as any).deliveryMethod || "UNKNOWN", // Check if deliveryMethod exists or is a relation
      isCorporate: !!order.corporateId,
      corporateId: order.corporateId || undefined
    }).catch(err => console.error("n8n order-confirmed failed:", err));
  }

  // Still send the existing email as a fallback/immediate notification
  const { businessName, footer } = await getEmailBranding();
  const orderUrl = `${baseUrl}/account/orders`;
  const context = {
    businessName,
    footer,
    orderNumber,
    orderTotal: total.toLocaleString(),
    currency,
    orderUrl,
  };
  const defaultSubject = `Order ${orderNumber} confirmed \u2013 ${businessName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>Thank you for your order.</p>
        <p><strong>Order number:</strong> ${orderNumber}</p>
        <p><strong>Total:</strong> ${currency} ${total.toLocaleString()}</p>
        <p>We'll notify you when your order is on its way. You can track it in your account.</p>
        <p><a href="${orderUrl}" style="color: #FF4D00; font-weight: bold;">View my orders</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("order-confirmation", email, context, defaultSubject, defaultHtml);
}

/** Order status update (tracking) — used by createTrackingEvent. */
export async function sendOrderStatusEmail(
  email: string,
  orderNumber: string,
  title: string,
  description: string
) {
  // 1. Fetch order details for n8n payload
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { user: true }
  });

  if (order) {
    n8n.orderStatusChanged({
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerEmail: order.user?.email || email,
      customerPhone: order.user?.phone || "",
      customerName: order.user?.name || "Customer",
      previousStatus: "UNKNOWN", // Could be tracked if we pass it
      newStatus: order.status,
      trackingUrl: order.trackingNumber ? `https://printhub.africa/track?ref=${order.orderNumber}` : undefined,
      estimatedDelivery: order.estimatedDelivery?.toISOString()
    }).catch(err => console.error("n8n order-status-changed failed:", err));
  }

  const { businessName, footer } = await getEmailBranding();
  const trackUrl = `${baseUrl}/track?ref=${encodeURIComponent(orderNumber)}`;
  const context = { businessName, footer, orderNumber, title, description, trackUrl };
  const defaultSubject = `Order ${orderNumber} \u2013 ${title} \u2013 ${businessName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p><strong>Order ${orderNumber}</strong></p>
        <p><strong>${title}</strong></p>
        <p>${description}</p>
        <p><a href="${trackUrl}" style="color: #FF4D00; font-weight: bold;">Track your order</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("order-status", email, context, defaultSubject, defaultHtml);
}

/** Manual payment submitted — we received your reference; team will confirm within 30 min. */
export async function sendPaymentReceivedEmail(
  email: string,
  orderNumber: string,
  reference: string,
  method: string
) {
  const { businessName, footer } = await getEmailBranding();
  const context = { businessName, footer, orderNumber, reference, method };
  const defaultSubject = `Payment reference received – Order ${orderNumber}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>We received your payment reference <strong>${reference}</strong> for order <strong>${orderNumber}</strong>.</p>
        <p>Our team will confirm your ${method} payment within 30 minutes (Mon–Fri 8am–6pm).</p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("payment-received", email, context, defaultSubject, defaultHtml);
}

/** Staff could not verify manual payment reference — ask customer to contact. */
export async function sendPaymentRejectedEmail(
  email: string,
  orderNumber: string,
  reference: string
) {
  const { businessName, footer } = await getEmailBranding();
  const whatsapp = "https://wa.me/254727410320";
  const context = { businessName, footer, orderNumber, reference, whatsapp };
  const defaultSubject = `Payment verification – Order ${orderNumber}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>We couldn't verify the payment reference <strong>${reference}</strong> for order <strong>${orderNumber}</strong>.</p>
        <p>Please contact us on <a href="${whatsapp}" style="color: #FF4D00;">WhatsApp</a> with your M-Pesa receipt so we can complete your order.</p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("payment-rejected", email, context, defaultSubject, defaultHtml);
}

/** Pay on pickup — order confirmed; pickup code and address sent. */
export async function sendPickupConfirmationEmail(
  email: string,
  orderNumber: string,
  pickupCode: string,
  totalKes: number
) {
  const { businessName, footer } = await getEmailBranding();
  const context = {
    businessName,
    footer,
    orderNumber,
    pickupCode,
    totalKes: totalKes.toLocaleString(),
  };
  const defaultSubject = `Order ${orderNumber} – Pay when you collect`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>Your order <strong>${orderNumber}</strong> is confirmed. You'll pay when you collect.</p>
        <p><strong>Pickup code:</strong> <span style="font-size: 1.2em; letter-spacing: 0.2em;">${pickupCode}</span></p>
        <p><strong>Amount to pay at collection:</strong> KSh ${totalKes.toLocaleString()}</p>
        <p>We'll notify you when your order is ready. Bring this code to our Nairobi studio.</p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("pickup-confirmation", email, context, defaultSubject, defaultHtml);
}

/** When staff sends a quote to the customer (status → quoted). */
export async function sendQuoteSentToCustomerEmail(
  email: string,
  quoteNumber: string,
  quotedAmountKes: number,
  breakdown: string | null,
  validityDays: number | null
) {
  const { businessName, footer } = await getEmailBranding();
  const quotesUrl = `${baseUrl}/account/quotes`;
  const validity = validityDays ? `Valid for ${validityDays} days.` : "";
  const breakdownHtml = breakdown
    ? `<p><strong>Breakdown:</strong></p><p style="white-space: pre-wrap;">${breakdown.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`
    : "";
  const context = {
    businessName,
    footer,
    quoteNumber,
    quotedAmountKes: quotedAmountKes.toLocaleString(),
    breakdown: breakdown ?? "",
    validity,
    breakdownHtml,
    quotesUrl,
  };
  const defaultSubject = `Your quote ${quoteNumber} – ${businessName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">${businessName} – Your quote</h2>
        <p>We've prepared a quote for your request <strong>${quoteNumber}</strong>.</p>
        <p><strong>Amount:</strong> KES ${quotedAmountKes.toLocaleString()}</p>
        ${breakdownHtml}
        <p>${validity}</p>
        <p><a href="${quotesUrl}" style="color: #FF4D00; font-weight: bold;">View quote &amp; Accept or Decline</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("quote-sent-to-customer", email, context, defaultSubject, defaultHtml);
}

/** When customer accepts a quote – notify assigned staff (or all sales). */
export async function sendStaffQuoteAcceptedEmail(
  staffEmail: string,
  quoteNumber: string,
  customerName: string,
  quotedAmountKes: number
) {
  const { businessName } = await getEmailBranding();
  const adminUrl = `${baseUrl}/admin/quotes`;
  const context = {
    businessName,
    quoteNumber,
    customerName,
    quotedAmountKes: quotedAmountKes.toLocaleString(),
    adminUrl,
  };
  const defaultSubject = `Quote ${quoteNumber} accepted – ${businessName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">Quote accepted</h2>
        <p><strong>${quoteNumber}</strong> has been accepted by <strong>${customerName}</strong>.</p>
        <p><strong>Amount:</strong> KES ${quotedAmountKes.toLocaleString()}</p>
        <p><a href="${adminUrl}" style="color: #FF4D00; font-weight: bold;">View in Admin</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${businessName} Admin</p>
      </div>
    `;
  return sendWithTemplate("staff-quote-accepted", staffEmail, context, defaultSubject, defaultHtml);
}

/** When a quote is assigned to a staff member. */
export async function sendStaffQuoteAssignedEmail(
  staffEmail: string,
  quoteNumber: string,
  customerName: string,
  typeLabel: string
) {
  const { businessName } = await getEmailBranding();
  const adminUrl = `${baseUrl}/admin/quotes`;
  const context = { businessName, quoteNumber, customerName, typeLabel, adminUrl };
  const defaultSubject = `Quote ${quoteNumber} assigned to you – ${businessName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">New quote assigned</h2>
        <p>Quote <strong>${quoteNumber}</strong> (${typeLabel}) from <strong>${customerName}</strong> has been assigned to you.</p>
        <p><a href="${adminUrl}" style="color: #FF4D00; font-weight: bold;">View in Admin</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${businessName} Admin</p>
      </div>
    `;
  return sendWithTemplate("staff-quote-assigned", staffEmail, context, defaultSubject, defaultHtml);
}

/** When quote status → in production – notify customer. */
export async function sendQuoteInProductionEmail(email: string, quoteNumber: string) {
  const { businessName, footer } = await getEmailBranding();
  const quotesUrl = `${baseUrl}/account/quotes`;
  const context = { businessName, footer, quoteNumber, quotesUrl };
  const defaultSubject = `Quote ${quoteNumber} – Now in production – ${businessName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">${businessName} – We're on it</h2>
        <p>Your order for quote <strong>${quoteNumber}</strong> is now in production.</p>
        <p>We'll notify you when it's ready. You can also check status in your account.</p>
        <p><a href="${quotesUrl}" style="color: #FF4D00; font-weight: bold;">View my quotes</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("quote-in-production", email, context, defaultSubject, defaultHtml);
}

// ============== CAREERS ==============

export async function sendCareerApplicationConfirmationEmail(
  email: string,
  firstName: string,
  jobTitle: string,
  applicationRef: string
) {
  const { businessName } = await getEmailBranding();
  const site = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") ?? "printhub.africa";
  const context = { businessName, firstName, jobTitle, applicationRef, site };
  const defaultSubject = `Application received — ${jobTitle} at ${businessName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">${businessName}</h2>
        <p>Hi ${firstName},</p>
        <p>Thanks for applying for the <strong>${jobTitle}</strong> position at ${businessName}.</p>
        <p>We've received your application and our team will review it carefully. You'll hear back from us within 5 business days.</p>
        <p>Your application reference: <strong>${applicationRef}</strong></p>
        <p>Best,<br>The ${businessName} Team<br>${site}</p>
      </div>
    `;
  return sendWithTemplate("career-application-confirmation", email, context, defaultSubject, defaultHtml);
}

export async function sendCareerApplicationNotificationToAdmin(
  adminEmail: string,
  jobTitle: string,
  applicantName: string,
  applicantEmail: string,
  applicantPhone: string,
  appliedAt: string,
  applicationId: string
) {
  const { businessName } = await getEmailBranding();
  const site = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") ?? "printhub.africa";
  const viewUrl = `${baseUrl}/admin/careers/applications/${applicationId}`;
  const context = {
    businessName,
    jobTitle,
    applicantName,
    applicantEmail,
    applicantPhone,
    appliedAt,
    viewUrl,
    site,
  };
  const defaultSubject = `New application: ${jobTitle} — ${applicantName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">New job application</h2>
        <p><strong>Role:</strong> ${jobTitle}</p>
        <p><strong>Applicant:</strong> ${applicantName}</p>
        <p><strong>Email:</strong> ${applicantEmail}</p>
        <p><strong>Phone:</strong> ${applicantPhone}</p>
        <p><strong>Applied:</strong> ${appliedAt}</p>
        <p><a href="${viewUrl}" style="color: #FF4D00; font-weight: bold;">View Application →</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${businessName} Admin | ${site}</p>
      </div>
    `;
  return sendWithTemplate("career-application-admin", adminEmail, context, defaultSubject, defaultHtml);
}

export async function sendCareerStatusShortlistedEmail(
  email: string,
  firstName: string,
  jobTitle: string
) {
  const { businessName } = await getEmailBranding();
  const site = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") ?? "printhub.africa";
  const context = { businessName, firstName, jobTitle, site };
  const defaultSubject = `You've been shortlisted — ${jobTitle} at ${businessName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">${businessName}</h2>
        <p>Hi ${firstName},</p>
        <p>Good news! We've reviewed your application for the <strong>${jobTitle}</strong> position and would like to move forward.</p>
        <p>Our team will be in touch to schedule an interview.</p>
        <p>Best,<br>The ${businessName} Team<br>${site}</p>
      </div>
    `;
  return sendWithTemplate("career-shortlisted", email, context, defaultSubject, defaultHtml);
}

export async function sendCareerStatusRejectedEmail(
  email: string,
  firstName: string,
  jobTitle: string
) {
  const { businessName } = await getEmailBranding();
  const site = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") ?? "printhub.africa";
  const context = { businessName, firstName, jobTitle, site };
  const defaultSubject = `Your application — ${jobTitle} at ${businessName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">${businessName}</h2>
        <p>Hi ${firstName},</p>
        <p>Thank you for your interest in the <strong>${jobTitle}</strong> position.</p>
        <p>After careful consideration, we won't be moving forward with your application at this time. We'll keep your details on file and encourage you to apply for future roles.</p>
        <p>Best,<br>The ${businessName} Team<br>${site}</p>
      </div>
    `;
  return sendWithTemplate("career-rejected", email, context, defaultSubject, defaultHtml);
}

export async function sendCareerOfferMadeEmail(
  email: string,
  firstName: string,
  jobTitle: string
) {
  const { businessName } = await getEmailBranding();
  const site = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") ?? "printhub.africa";
  const context = { businessName, firstName, jobTitle, site };
  const defaultSubject = `An offer from ${businessName} — ${jobTitle}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">${businessName}</h2>
        <p>Hi ${firstName},</p>
        <p>We're delighted to offer you the <strong>${jobTitle}</strong> position.</p>
        <p>Please check your email for the formal offer letter.</p>
        <p>Best,<br>The ${businessName} Team<br>${site}</p>
      </div>
    `;
  return sendWithTemplate("career-offer", email, context, defaultSubject, defaultHtml);
}

/** Abandoned cart — first reminder (e.g. 1 hour after leaving checkout) */
export async function sendAbandonedCartEmail1(
  email: string,
  firstName: string,
  cartUrl: string
) {
  const { businessName, footer } = await getEmailBranding();
  const context = { businessName, footer, firstName: firstName || "there", cartUrl };
  const defaultSubject = `You left something in your cart – ${businessName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>Hi ${firstName || "there"},</p>
        <p>You left items in your cart. Complete your order when you're ready – your cart is saved.</p>
        <p><a href="${cartUrl}" style="color: #FF4D00; font-weight: bold;">Return to cart</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("abandoned-cart-1", email, context, defaultSubject, defaultHtml);
}

/** Abandoned cart — second reminder (e.g. 24 hours). unsubscribeUrl optional for "Unsubscribe from cart reminders". */
export async function sendAbandonedCartEmail2(
  email: string,
  firstName: string,
  cartUrl: string,
  unsubscribeUrl?: string
) {
  const { businessName, footer } = await getEmailBranding();
  const unsubscribeLine = unsubscribeUrl
    ? `<p style="font-size: 11px; color: #9CA3AF;"><a href="${unsubscribeUrl}">Unsubscribe from cart reminders</a></p>`
    : "";
  const context = {
    businessName,
    footer,
    firstName: firstName || "there",
    cartUrl,
    unsubscribeUrl: unsubscribeUrl ?? "",
    unsubscribeLine,
  };
  const defaultSubject = `Still thinking? Your cart is waiting – ${businessName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>Hi ${firstName || "there"},</p>
        <p>Your saved cart is still here. If you have any questions, just reply to this email.</p>
        <p><a href="${cartUrl}" style="color: #FF4D00; font-weight: bold;">Complete your order</a></p>
        ${unsubscribeLine}
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("abandoned-cart-2", email, context, defaultSubject, defaultHtml);
}

/** Corporate application received — to applicant */
export async function sendCorporateApplicationReceivedEmail(
  email: string,
  applicantName: string,
  companyName: string,
  applicationRef: string
) {
  const { businessName, footer } = await getEmailBranding();
  const context = {
    businessName,
    footer,
    applicantName: applicantName || "there",
    companyName,
    applicationRef,
  };
  const defaultSubject = `Corporate account application received – ${businessName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>Hi ${applicantName || "there"},</p>
        <p>We've received your corporate account application for <strong>${companyName}</strong>.</p>
        <p>Reference: <strong>${applicationRef}</strong></p>
        <p>Our team will review your application and respond within 1 business day.</p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("corporate-received", email, context, defaultSubject, defaultHtml);
}

/** New corporate application — to admin */
export async function sendCorporateApplicationNewAdminEmail(
  adminEmail: string,
  companyName: string,
  contactPerson: string
) {
  const { businessName, footer } = await getEmailBranding();
  const adminUrl = `${baseUrl}/admin/corporate/applications`;
  const context = { businessName, footer, companyName, contactPerson, adminUrl };
  const defaultSubject = `New corporate account application: ${companyName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">${businessName}</h2>
        <p>A new corporate account application has been submitted.</p>
        <p><strong>Company:</strong> ${companyName}<br><strong>Contact:</strong> ${contactPerson}</p>
        <p><a href="${adminUrl}" style="color: #FF4D00; font-weight: bold;">Review applications</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("corporate-new-admin", adminEmail, context, defaultSubject, defaultHtml);
}

/** Corporate application approved — to applicant */
export async function sendCorporateApplicationApprovedEmail(
  email: string,
  contactPerson: string,
  companyName: string,
  accountNumber: string
) {
  const { businessName, footer } = await getEmailBranding();
  const dashboardUrl = `${baseUrl}/corporate/dashboard`;
  const context = {
    businessName,
    footer,
    contactPerson: contactPerson || "there",
    companyName,
    accountNumber,
    dashboardUrl,
  };
  const defaultSubject = `Your corporate account is approved – ${businessName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">${businessName}</h2>
        <p>Hi ${contactPerson || "there"},</p>
        <p>Great news — your corporate account application for <strong>${companyName}</strong> has been approved.</p>
        <p>Your account number: <strong>${accountNumber}</strong></p>
        <p>You can now sign in and access your corporate dashboard, place orders with corporate pricing, and manage your team.</p>
        <p><a href="${dashboardUrl}" style="color: #FF4D00; font-weight: bold;">Go to Corporate Dashboard</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("corporate-approved", email, context, defaultSubject, defaultHtml);
}

/** Corporate application rejected — to applicant */
export async function sendCorporateApplicationRejectedEmail(
  email: string,
  contactPerson: string,
  companyName: string,
  reason: string | null
) {
  const { businessName, footer } = await getEmailBranding();
  const applyUrl = `${baseUrl}/corporate/apply`;
  const reasonLine = reason ? `<p><strong>Reason:</strong> ${reason}</p>` : "";
  const context = {
    businessName,
    footer,
    contactPerson: contactPerson || "there",
    companyName,
    reason: reason ?? "",
    reasonLine,
    applyUrl,
  };
  const defaultSubject = `Update on your corporate account application – ${businessName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">${businessName}</h2>
        <p>Hi ${contactPerson || "there"},</p>
        <p>Thank you for your interest in a corporate account with ${businessName}. After review, we are unable to approve your application for <strong>${companyName}</strong> at this time.</p>
        ${reasonLine}
        <p>If you have questions or would like to reapply in the future, please contact us or submit a new application.</p>
        <p><a href="${applyUrl}" style="color: #FF4D00; font-weight: bold;">Apply again</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("corporate-rejected", email, context, defaultSubject, defaultHtml);
}

// ============== DELIVERY NOTIFICATIONS ==============

export async function sendDeliveryDispatchedEmail(
  email: string,
  orderNumber: string,
  trackingNumber?: string | null
) {
  const { businessName, footer } = await getEmailBranding();
  const trackUrl = `${baseUrl}/track?ref=${encodeURIComponent(orderNumber)}`;
  const trackingLine = trackingNumber
    ? `<p><strong>Tracking:</strong> ${trackingNumber}</p>`
    : "";
  const context = {
    businessName,
    footer,
    orderNumber,
    trackingNumber: trackingNumber ?? "",
    trackingLine,
    trackUrl,
  };
  const defaultSubject = `Order ${orderNumber} is on its way – ${businessName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>Your order <strong>${orderNumber}</strong> has been dispatched and is on its way.</p>
        ${trackingLine}
        <p><a href="${trackUrl}" style="color: #FF4D00; font-weight: bold;">Track your order</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("delivery-dispatched", email, context, defaultSubject, defaultHtml);
}

export async function sendDeliveryDeliveredEmail(email: string, orderNumber: string) {
  const { businessName, footer } = await getEmailBranding();
  const ordersUrl = `${baseUrl}/account/orders`;
  const context = { businessName, footer, orderNumber, ordersUrl };
  const defaultSubject = `Order ${orderNumber} delivered – ${businessName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>Your order <strong>${orderNumber}</strong> has been delivered. Thank you for shopping with us!</p>
        <p><a href="${ordersUrl}" style="color: #FF4D00; font-weight: bold;">View my orders</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("delivery-delivered", email, context, defaultSubject, defaultHtml);
}

export async function sendDeliveryFailedEmail(
  email: string,
  orderNumber: string,
  failureReason?: string | null
) {
  const { businessName, footer } = await getEmailBranding();
  const supportUrl = `${baseUrl}/contact`;
  const reasonLine = failureReason ? `<p><strong>Reason:</strong> ${failureReason}</p>` : "";
  const context = {
    businessName,
    footer,
    orderNumber,
    failureReason: failureReason ?? "",
    reasonLine,
    supportUrl,
  };
  const defaultSubject = `Delivery update – Order ${orderNumber} – ${businessName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>We're sorry – there was an issue delivering your order <strong>${orderNumber}</strong>.</p>
        ${reasonLine}
        <p>Our team will contact you to rearrange delivery. If you have questions, please <a href="${supportUrl}" style="color: #FF4D00;">contact us</a>.</p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("delivery-failed", email, context, defaultSubject, defaultHtml);
}

// ============== ORDER CANCELLATION & REFUNDS ==============

export async function sendOrderCancelledEmail(
  email: string,
  orderNumber: string,
  reason?: string | null
) {
  const { businessName, footer } = await getEmailBranding();
  const ordersUrl = `${baseUrl}/account/orders`;
  const reasonLine = reason ? `<p><strong>Reason:</strong> ${reason.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>` : "";
  const context = {
    businessName,
    footer,
    orderNumber,
    reason: reason ?? "",
    reasonLine,
    ordersUrl,
  };
  const defaultSubject = `Order ${orderNumber} cancelled – ${businessName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>Your order <strong>${orderNumber}</strong> has been cancelled.</p>
        ${reasonLine}
        <p>If you have questions or would like to place a new order, <a href="${ordersUrl}" style="color: #FF4D00;">visit your orders</a>.</p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("order-cancelled", email, context, defaultSubject, defaultHtml);
}

export async function sendRefundApprovedEmail(
  email: string,
  refundNumber: string,
  orderNumber: string,
  amountKes: number
) {
  const { businessName, footer } = await getEmailBranding();
  const ordersUrl = `${baseUrl}/account/orders`;
  const context = {
    businessName,
    footer,
    refundNumber,
    orderNumber,
    amountKes: amountKes.toLocaleString(),
    ordersUrl,
  };
  const defaultSubject = `Refund ${refundNumber} approved – ${businessName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>Your refund request <strong>${refundNumber}</strong> for order ${orderNumber} has been approved.</p>
        <p><strong>Amount:</strong> KES ${amountKes.toLocaleString()}</p>
        <p>We will process the refund to your M-Pesa number shortly. You will receive another email when it is sent.</p>
        <p><a href="${ordersUrl}" style="color: #FF4D00; font-weight: bold;">View my orders</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("refund-approved", email, context, defaultSubject, defaultHtml);
}

export async function sendRefundRejectedEmail(
  email: string,
  refundNumber: string,
  orderNumber: string,
  rejectionReason?: string | null
) {
  const { businessName, footer } = await getEmailBranding();
  const supportUrl = `${baseUrl}/contact`;
  const reasonLine = rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>` : "";
  const context = {
    businessName,
    footer,
    refundNumber,
    orderNumber,
    rejectionReason: rejectionReason ?? "",
    reasonLine,
    supportUrl,
  };
  const defaultSubject = `Refund ${refundNumber} – ${businessName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>Your refund request <strong>${refundNumber}</strong> for order ${orderNumber} could not be approved.</p>
        ${reasonLine}
        <p>If you have questions, please <a href="${supportUrl}" style="color: #FF4D00;">contact us</a>.</p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("refund-rejected", email, context, defaultSubject, defaultHtml);
}

export async function sendRefundProcessedEmail(
  email: string,
  refundNumber: string,
  orderNumber: string,
  amountKes: number,
  mpesaReceiptNo?: string | null
) {
  const { businessName, footer } = await getEmailBranding();
  const receiptLine = mpesaReceiptNo ? `<p><strong>M-Pesa receipt:</strong> ${mpesaReceiptNo}</p>` : "";
  const context = {
    businessName,
    footer,
    refundNumber,
    orderNumber,
    amountKes: amountKes.toLocaleString(),
    mpesaReceiptNo: mpesaReceiptNo ?? "",
    receiptLine,
  };
  const defaultSubject = `Refund ${refundNumber} sent – ${businessName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>Your refund <strong>${refundNumber}</strong> for order ${orderNumber} has been sent to your M-Pesa account.</p>
        <p><strong>Amount:</strong> KES ${amountKes.toLocaleString()}</p>
        ${receiptLine}
        <p>Thank you for your patience.</p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("refund-processed", email, context, defaultSubject, defaultHtml);
}

// ============== SUPPORT TICKET NOTIFICATIONS ==============

export async function sendTicketCreatedEmail(
  email: string,
  ticketNumber: string,
  subject: string
) {
  const { businessName, footer } = await getEmailBranding();
  const supportUrl = `${baseUrl}/account/support`;
  const context = { businessName, footer, ticketNumber, ticketSubject: subject, supportUrl };
  const defaultSubject = `Support request ${ticketNumber} received – ${businessName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>We've received your support request.</p>
        <p><strong>Ticket:</strong> ${ticketNumber}<br><strong>Subject:</strong> ${subject}</p>
        <p>Our team will respond as soon as possible. You can view and reply in your account.</p>
        <p><a href="${supportUrl}" style="color: #FF4D00; font-weight: bold;">View my tickets</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("ticket-created", email, context, defaultSubject, defaultHtml);
}

export async function sendTicketRepliedEmail(
  email: string,
  ticketNumber: string,
  subject: string,
  messagePreview: string
) {
  const { businessName, footer } = await getEmailBranding();
  const supportUrl = `${baseUrl}/account/support`;
  const preview = messagePreview.length > 200 ? messagePreview.slice(0, 200) + "…" : messagePreview;
  const context = {
    businessName,
    footer,
    ticketNumber,
    ticketSubject: subject,
    messagePreview: preview.replace(/</g, "&lt;").replace(/>/g, "&gt;"),
    supportUrl,
  };
  const defaultSubject = `New reply on ${ticketNumber} – ${businessName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>We've replied to your support request <strong>${ticketNumber}</strong> (${subject}).</p>
        <p style="background: #f5f5f5; padding: 12px; border-radius: 6px; font-size: 14px;">${context.messagePreview}</p>
        <p><a href="${supportUrl}" style="color: #FF4D00; font-weight: bold;">View ticket &amp; reply</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("ticket-replied", email, context, defaultSubject, defaultHtml);
}

export async function sendTicketResolvedEmail(
  email: string,
  ticketNumber: string,
  subject: string
) {
  const { businessName, footer } = await getEmailBranding();
  const supportUrl = `${baseUrl}/account/support`;
  const context = { businessName, footer, ticketNumber, ticketSubject: subject, supportUrl };
  const defaultSubject = `Ticket ${ticketNumber} resolved – ${businessName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>Your support request <strong>${ticketNumber}</strong> (${subject}) has been marked as resolved.</p>
        <p>If you need further help, you can reopen the ticket or create a new one.</p>
        <p><a href="${supportUrl}" style="color: #FF4D00; font-weight: bold;">View my tickets</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("ticket-resolved", email, context, defaultSubject, defaultHtml);
}

/** When admin cancels a quote — notify customer with reason. */
export async function sendQuoteCancelledByAdminEmail(
  email: string,
  quoteNumber: string,
  reason: string,
  messageToCustomer?: string | null
) {
  const { businessName, footer } = await getEmailBranding();
  const quotesUrl = `${baseUrl}/account/quotes`;
  const reasonHtml = reason
    ? `<p><strong>Reason:</strong> ${reason.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`
    : "";
  const messageHtml = messageToCustomer
    ? `<p><strong>Message from our team:</strong></p><p style="white-space: pre-wrap;">${messageToCustomer.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`
    : "";
  const context = {
    businessName,
    footer,
    quoteNumber,
    reason: reason ?? "",
    reasonHtml,
    messageHtml,
    quotesUrl,
  };
  const defaultSubject = `Quote ${quoteNumber} cancelled – ${businessName}`;
  const defaultHtml = `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">${businessName}</h2>
        <p>Your quote request <strong>${quoteNumber}</strong> has been cancelled.</p>
        ${reasonHtml}
        ${messageHtml}
        <p>If you have questions or would like to submit a new request, please visit your account or contact us.</p>
        <p><a href="${quotesUrl}" style="color: #FF4D00; font-weight: bold;">View my quotes</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `;
  return sendWithTemplate("quote-cancelled-admin", email, context, defaultSubject, defaultHtml);
}
