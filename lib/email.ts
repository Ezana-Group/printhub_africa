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
