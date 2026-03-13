import { Resend } from "resend";
import { getBusinessPublic } from "@/lib/business-public";

async function getEmailBranding() {
  const b = await getBusinessPublic();
  const location = [b.city, b.country].filter(Boolean).join(", ") || "Kenya";
  const footer = `${b.businessName} · ${location}`;
  return { businessName: b.businessName, footer };
}

const from = process.env.FROM_EMAIL ?? "PrintHub <hello@printhub.africa>";

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set; email not sent:", { to, subject });
    return { success: false, error: "email_not_configured" };
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const payload: { from: string; to: string[]; subject: string; html?: string; text?: string } = {
    from,
    to: [to],
    subject,
  };
  if (html) payload.html = html;
  else if (text) payload.text = text;
  else payload.text = subject;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await resend.emails.send(payload as any);
  if (error) throw error;
  return data;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa";

export async function sendVerificationEmail(email: string, token: string) {
  const { businessName, footer } = await getEmailBranding();
  const url = `${baseUrl}/verify-email?token=${token}`;
  return sendEmail({
    to: email,
    subject: `Verify your ${businessName} account`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>Thanks for signing up. Please verify your email by clicking the link below:</p>
        <p><a href="${url}" style="color: #FF4D00; font-weight: bold;">Verify my email</a></p>
        <p>Or copy this link: ${url}</p>
        <p>This link expires in 24 hours.</p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const { businessName, footer } = await getEmailBranding();
  const url = `${baseUrl}/reset-password?token=${token}`;
  return sendEmail({
    to: email,
    subject: `Reset your ${businessName} password`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p><a href="${url}" style="color: #FF4D00; font-weight: bold;">Reset password</a></p>
        <p>Or copy this link: ${url}</p>
        <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `,
  });
}

export async function sendQuoteReceivedEmail(
  email: string,
  quoteNumber: string,
  typeLabel: string
) {
  const { businessName, footer } = await getEmailBranding();
  const quotesUrl = `${baseUrl}/account/quotes`;
  return sendEmail({
    to: email,
    subject: `Quote request ${quoteNumber} received – ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">${businessName} – Quote received</h2>
        <p>We've received your quote request <strong>${quoteNumber}</strong> (${typeLabel}).</p>
        <p>We'll review it and respond within 1–2 business days.</p>
        <p><a href="${quotesUrl}" style="color: #FF4D00; font-weight: bold;">View my quotes</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `,
  });
}

export async function sendOrderConfirmationEmail(
  email: string,
  orderNumber: string,
  total: number,
  currency = "KES"
) {
  const { businessName, footer } = await getEmailBranding();
  const orderUrl = `${baseUrl}/account/orders`;
  return sendEmail({
    to: email,
    subject: `Order ${orderNumber} confirmed – ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>Thank you for your order.</p>
        <p><strong>Order number:</strong> ${orderNumber}</p>
        <p><strong>Total:</strong> ${currency} ${total.toLocaleString()}</p>
        <p>We'll notify you when your order is on its way. You can track it in your account.</p>
        <p><a href="${orderUrl}" style="color: #FF4D00; font-weight: bold;">View my orders</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `,
  });
}

/** Order status update (tracking) — used by createTrackingEvent. */
export async function sendOrderStatusEmail(
  email: string,
  orderNumber: string,
  title: string,
  description: string
) {
  const { businessName, footer } = await getEmailBranding();
  const trackUrl = `${baseUrl}/track?ref=${encodeURIComponent(orderNumber)}`;
  return sendEmail({
    to: email,
    subject: `Order ${orderNumber} – ${title} – ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p><strong>Order ${orderNumber}</strong></p>
        <p><strong>${title}</strong></p>
        <p>${description}</p>
        <p><a href="${trackUrl}" style="color: #FF4D00; font-weight: bold;">Track your order</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `,
  });
}

/** Manual payment submitted — we received your reference; team will confirm within 30 min. */
export async function sendPaymentReceivedEmail(
  email: string,
  orderNumber: string,
  reference: string,
  method: string
) {
  const { businessName, footer } = await getEmailBranding();
  return sendEmail({
    to: email,
    subject: `Payment reference received – Order ${orderNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>We received your payment reference <strong>${reference}</strong> for order <strong>${orderNumber}</strong>.</p>
        <p>Our team will confirm your ${method} payment within 30 minutes (Mon–Fri 8am–6pm).</p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `,
  });
}

/** Staff could not verify manual payment reference — ask customer to contact. */
export async function sendPaymentRejectedEmail(
  email: string,
  orderNumber: string,
  reference: string
) {
  const { businessName, footer } = await getEmailBranding();
  const whatsapp = "https://wa.me/254727410320";
  return sendEmail({
    to: email,
    subject: `Payment verification – Order ${orderNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>We couldn't verify the payment reference <strong>${reference}</strong> for order <strong>${orderNumber}</strong>.</p>
        <p>Please contact us on <a href="${whatsapp}" style="color: #FF4D00;">WhatsApp</a> with your M-Pesa receipt so we can complete your order.</p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `,
  });
}

/** Pay on pickup — order confirmed; pickup code and address sent. */
export async function sendPickupConfirmationEmail(
  email: string,
  orderNumber: string,
  pickupCode: string,
  totalKes: number
) {
  const { businessName, footer } = await getEmailBranding();
  return sendEmail({
    to: email,
    subject: `Order ${orderNumber} – Pay when you collect`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>Your order <strong>${orderNumber}</strong> is confirmed. You'll pay when you collect.</p>
        <p><strong>Pickup code:</strong> <span style="font-size: 1.2em; letter-spacing: 0.2em;">${pickupCode}</span></p>
        <p><strong>Amount to pay at collection:</strong> KSh ${totalKes.toLocaleString()}</p>
        <p>We'll notify you when your order is ready. Bring this code to our Nairobi studio.</p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `,
  });
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
  return sendEmail({
    to: email,
    subject: `Your quote ${quoteNumber} – ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">${businessName} – Your quote</h2>
        <p>We've prepared a quote for your request <strong>${quoteNumber}</strong>.</p>
        <p><strong>Amount:</strong> KES ${quotedAmountKes.toLocaleString()}</p>
        ${breakdownHtml}
        <p>${validity}</p>
        <p><a href="${quotesUrl}" style="color: #FF4D00; font-weight: bold;">View quote &amp; Accept or Decline</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `,
  });
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
  return sendEmail({
    to: staffEmail,
    subject: `Quote ${quoteNumber} accepted – ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">Quote accepted</h2>
        <p><strong>${quoteNumber}</strong> has been accepted by <strong>${customerName}</strong>.</p>
        <p><strong>Amount:</strong> KES ${quotedAmountKes.toLocaleString()}</p>
        <p><a href="${adminUrl}" style="color: #FF4D00; font-weight: bold;">View in Admin</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${businessName} Admin</p>
      </div>
    `,
  });
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
  return sendEmail({
    to: staffEmail,
    subject: `Quote ${quoteNumber} assigned to you – ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">New quote assigned</h2>
        <p>Quote <strong>${quoteNumber}</strong> (${typeLabel}) from <strong>${customerName}</strong> has been assigned to you.</p>
        <p><a href="${adminUrl}" style="color: #FF4D00; font-weight: bold;">View in Admin</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${businessName} Admin</p>
      </div>
    `,
  });
}

/** When quote status → in production – notify customer. */
export async function sendQuoteInProductionEmail(email: string, quoteNumber: string) {
  const { businessName, footer } = await getEmailBranding();
  const quotesUrl = `${baseUrl}/account/quotes`;
  return sendEmail({
    to: email,
    subject: `Quote ${quoteNumber} – Now in production – ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">${businessName} – We're on it</h2>
        <p>Your order for quote <strong>${quoteNumber}</strong> is now in production.</p>
        <p>We'll notify you when it's ready. You can also check status in your account.</p>
        <p><a href="${quotesUrl}" style="color: #FF4D00; font-weight: bold;">View my quotes</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `,
  });
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
  return sendEmail({
    to: email,
    subject: `Application received — ${jobTitle} at ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">${businessName}</h2>
        <p>Hi ${firstName},</p>
        <p>Thanks for applying for the <strong>${jobTitle}</strong> position at ${businessName}.</p>
        <p>We've received your application and our team will review it carefully. You'll hear back from us within 5 business days.</p>
        <p>Your application reference: <strong>${applicationRef}</strong></p>
        <p>Best,<br>The ${businessName} Team<br>${site}</p>
      </div>
    `,
  });
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
  return sendEmail({
    to: adminEmail,
    subject: `New application: ${jobTitle} — ${applicantName}`,
    html: `
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
    `,
  });
}

export async function sendCareerStatusShortlistedEmail(
  email: string,
  firstName: string,
  jobTitle: string
) {
  const { businessName } = await getEmailBranding();
  const site = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") ?? "printhub.africa";
  return sendEmail({
    to: email,
    subject: `You've been shortlisted — ${jobTitle} at ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">${businessName}</h2>
        <p>Hi ${firstName},</p>
        <p>Good news! We've reviewed your application for the <strong>${jobTitle}</strong> position and would like to move forward.</p>
        <p>Our team will be in touch to schedule an interview.</p>
        <p>Best,<br>The ${businessName} Team<br>${site}</p>
      </div>
    `,
  });
}

export async function sendCareerStatusRejectedEmail(
  email: string,
  firstName: string,
  jobTitle: string
) {
  const { businessName } = await getEmailBranding();
  const site = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") ?? "printhub.africa";
  return sendEmail({
    to: email,
    subject: `Your application — ${jobTitle} at ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">${businessName}</h2>
        <p>Hi ${firstName},</p>
        <p>Thank you for your interest in the <strong>${jobTitle}</strong> position.</p>
        <p>After careful consideration, we won't be moving forward with your application at this time. We'll keep your details on file and encourage you to apply for future roles.</p>
        <p>Best,<br>The ${businessName} Team<br>${site}</p>
      </div>
    `,
  });
}

export async function sendCareerOfferMadeEmail(
  email: string,
  firstName: string,
  jobTitle: string
) {
  const { businessName } = await getEmailBranding();
  const site = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") ?? "printhub.africa";
  return sendEmail({
    to: email,
    subject: `An offer from ${businessName} — ${jobTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">${businessName}</h2>
        <p>Hi ${firstName},</p>
        <p>We're delighted to offer you the <strong>${jobTitle}</strong> position.</p>
        <p>Please check your email for the formal offer letter.</p>
        <p>Best,<br>The ${businessName} Team<br>${site}</p>
      </div>
    `,
  });
}

/** Abandoned cart — first reminder (e.g. 1 hour after leaving checkout) */
export async function sendAbandonedCartEmail1(
  email: string,
  firstName: string,
  cartUrl: string
) {
  const { businessName, footer } = await getEmailBranding();
  return sendEmail({
    to: email,
    subject: `You left something in your cart – ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>Hi ${firstName || "there"},</p>
        <p>You left items in your cart. Complete your order when you're ready – your cart is saved.</p>
        <p><a href="${cartUrl}" style="color: #FF4D00; font-weight: bold;">Return to cart</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `,
  });
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
  return sendEmail({
    to: email,
    subject: `Still thinking? Your cart is waiting – ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>Hi ${firstName || "there"},</p>
        <p>Your saved cart is still here. If you have any questions, just reply to this email.</p>
        <p><a href="${cartUrl}" style="color: #FF4D00; font-weight: bold;">Complete your order</a></p>
        ${unsubscribeLine}
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `,
  });
}

/** Corporate application received — to applicant */
export async function sendCorporateApplicationReceivedEmail(
  email: string,
  applicantName: string,
  companyName: string,
  applicationRef: string
) {
  const { businessName, footer } = await getEmailBranding();
  return sendEmail({
    to: email,
    subject: `Corporate account application received – ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>Hi ${applicantName || "there"},</p>
        <p>We've received your corporate account application for <strong>${companyName}</strong>.</p>
        <p>Reference: <strong>${applicationRef}</strong></p>
        <p>Our team will review your application and respond within 1 business day.</p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `,
  });
}

/** New corporate application — to admin */
export async function sendCorporateApplicationNewAdminEmail(
  adminEmail: string,
  companyName: string,
  contactPerson: string
) {
  const { businessName, footer } = await getEmailBranding();
  const adminUrl = `${baseUrl}/admin/corporate/applications`;
  return sendEmail({
    to: adminEmail,
    subject: `New corporate account application: ${companyName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">${businessName}</h2>
        <p>A new corporate account application has been submitted.</p>
        <p><strong>Company:</strong> ${companyName}<br><strong>Contact:</strong> ${contactPerson}</p>
        <p><a href="${adminUrl}" style="color: #FF4D00; font-weight: bold;">Review applications</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `,
  });
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
  return sendEmail({
    to: email,
    subject: `Your corporate account is approved – ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">${businessName}</h2>
        <p>Hi ${contactPerson || "there"},</p>
        <p>Great news — your corporate account application for <strong>${companyName}</strong> has been approved.</p>
        <p>Your account number: <strong>${accountNumber}</strong></p>
        <p>You can now sign in and access your corporate dashboard, place orders with corporate pricing, and manage your team.</p>
        <p><a href="${dashboardUrl}" style="color: #FF4D00; font-weight: bold;">Go to Corporate Dashboard</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `,
  });
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
  return sendEmail({
    to: email,
    subject: `Update on your corporate account application – ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">${businessName}</h2>
        <p>Hi ${contactPerson || "there"},</p>
        <p>Thank you for your interest in a corporate account with ${businessName}. After review, we are unable to approve your application for <strong>${companyName}</strong> at this time.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
        <p>If you have questions or would like to reapply in the future, please contact us or submit a new application.</p>
        <p><a href="${applyUrl}" style="color: #FF4D00; font-weight: bold;">Apply again</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `,
  });
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
  return sendEmail({
    to: email,
    subject: `Order ${orderNumber} is on its way – ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>Your order <strong>${orderNumber}</strong> has been dispatched and is on its way.</p>
        ${trackingLine}
        <p><a href="${trackUrl}" style="color: #FF4D00; font-weight: bold;">Track your order</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `,
  });
}

export async function sendDeliveryDeliveredEmail(email: string, orderNumber: string) {
  const { businessName, footer } = await getEmailBranding();
  const ordersUrl = `${baseUrl}/account/orders`;
  return sendEmail({
    to: email,
    subject: `Order ${orderNumber} delivered – ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>Your order <strong>${orderNumber}</strong> has been delivered. Thank you for shopping with us!</p>
        <p><a href="${ordersUrl}" style="color: #FF4D00; font-weight: bold;">View my orders</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `,
  });
}

export async function sendDeliveryFailedEmail(
  email: string,
  orderNumber: string,
  failureReason?: string | null
) {
  const { businessName, footer } = await getEmailBranding();
  const supportUrl = `${baseUrl}/contact`;
  const reasonLine = failureReason ? `<p><strong>Reason:</strong> ${failureReason}</p>` : "";
  return sendEmail({
    to: email,
    subject: `Delivery update – Order ${orderNumber} – ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>We're sorry – there was an issue delivering your order <strong>${orderNumber}</strong>.</p>
        ${reasonLine}
        <p>Our team will contact you to rearrange delivery. If you have questions, please <a href="${supportUrl}" style="color: #FF4D00;">contact us</a>.</p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `,
  });
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
  return sendEmail({
    to: email,
    subject: `Order ${orderNumber} cancelled – ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>Your order <strong>${orderNumber}</strong> has been cancelled.</p>
        ${reasonLine}
        <p>If you have questions or would like to place a new order, <a href="${ordersUrl}" style="color: #FF4D00;">visit your orders</a>.</p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `,
  });
}

export async function sendRefundApprovedEmail(
  email: string,
  refundNumber: string,
  orderNumber: string,
  amountKes: number
) {
  const { businessName, footer } = await getEmailBranding();
  const ordersUrl = `${baseUrl}/account/orders`;
  return sendEmail({
    to: email,
    subject: `Refund ${refundNumber} approved – ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>Your refund request <strong>${refundNumber}</strong> for order ${orderNumber} has been approved.</p>
        <p><strong>Amount:</strong> KES ${amountKes.toLocaleString()}</p>
        <p>We will process the refund to your M-Pesa number shortly. You will receive another email when it is sent.</p>
        <p><a href="${ordersUrl}" style="color: #FF4D00; font-weight: bold;">View my orders</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `,
  });
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
  return sendEmail({
    to: email,
    subject: `Refund ${refundNumber} – ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>Your refund request <strong>${refundNumber}</strong> for order ${orderNumber} could not be approved.</p>
        ${reasonLine}
        <p>If you have questions, please <a href="${supportUrl}" style="color: #FF4D00;">contact us</a>.</p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `,
  });
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
  return sendEmail({
    to: email,
    subject: `Refund ${refundNumber} sent – ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>Your refund <strong>${refundNumber}</strong> for order ${orderNumber} has been sent to your M-Pesa account.</p>
        <p><strong>Amount:</strong> KES ${amountKes.toLocaleString()}</p>
        ${receiptLine}
        <p>Thank you for your patience.</p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `,
  });
}

// ============== SUPPORT TICKET NOTIFICATIONS ==============

export async function sendTicketCreatedEmail(
  email: string,
  ticketNumber: string,
  subject: string
) {
  const { businessName, footer } = await getEmailBranding();
  const supportUrl = `${baseUrl}/account/support`;
  return sendEmail({
    to: email,
    subject: `Support request ${ticketNumber} received – ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>We've received your support request.</p>
        <p><strong>Ticket:</strong> ${ticketNumber}<br><strong>Subject:</strong> ${subject}</p>
        <p>Our team will respond as soon as possible. You can view and reply in your account.</p>
        <p><a href="${supportUrl}" style="color: #FF4D00; font-weight: bold;">View my tickets</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `,
  });
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
  return sendEmail({
    to: email,
    subject: `New reply on ${ticketNumber} – ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>We've replied to your support request <strong>${ticketNumber}</strong> (${subject}).</p>
        <p style="background: #f5f5f5; padding: 12px; border-radius: 6px; font-size: 14px;">${preview.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
        <p><a href="${supportUrl}" style="color: #FF4D00; font-weight: bold;">View ticket &amp; reply</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `,
  });
}

export async function sendTicketResolvedEmail(
  email: string,
  ticketNumber: string,
  subject: string
) {
  const { businessName, footer } = await getEmailBranding();
  const supportUrl = `${baseUrl}/account/support`;
  return sendEmail({
    to: email,
    subject: `Ticket ${ticketNumber} resolved – ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">${businessName}</h1>
        <p>Your support request <strong>${ticketNumber}</strong> (${subject}) has been marked as resolved.</p>
        <p>If you need further help, you can reopen the ticket or create a new one.</p>
        <p><a href="${supportUrl}" style="color: #FF4D00; font-weight: bold;">View my tickets</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">${footer}</p>
      </div>
    `,
  });
}
