import { Resend } from "resend";

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
    return { success: true };
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
  const url = `${baseUrl}/verify-email?token=${token}`;
  return sendEmail({
    to: email,
    subject: "Verify your PrintHub account",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">PrintHub</h1>
        <p>Thanks for signing up. Please verify your email by clicking the link below:</p>
        <p><a href="${url}" style="color: #FF4D00; font-weight: bold;">Verify my email</a></p>
        <p>Or copy this link: ${url}</p>
        <p>This link expires in 24 hours.</p>
        <p style="color: #6B6B6B; font-size: 12px;">PrintHub · Nairobi, Kenya · An Ezana Group Company</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${baseUrl}/reset-password?token=${token}`;
  return sendEmail({
    to: email,
    subject: "Reset your PrintHub password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">PrintHub</h1>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p><a href="${url}" style="color: #FF4D00; font-weight: bold;">Reset password</a></p>
        <p>Or copy this link: ${url}</p>
        <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
        <p style="color: #6B6B6B; font-size: 12px;">PrintHub · Nairobi, Kenya · An Ezana Group Company</p>
      </div>
    `,
  });
}

export async function sendQuoteReceivedEmail(
  email: string,
  quoteNumber: string,
  typeLabel: string
) {
  const quotesUrl = `${baseUrl}/account/quotes`;
  return sendEmail({
    to: email,
    subject: `Quote request ${quoteNumber} received – PrintHub`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">PrintHub – Quote received</h2>
        <p>We've received your quote request <strong>${quoteNumber}</strong> (${typeLabel}).</p>
        <p>We'll review it and respond within 1–2 business days.</p>
        <p><a href="${quotesUrl}" style="color: #FF4D00; font-weight: bold;">View my quotes</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">PrintHub · Nairobi, Kenya · An Ezana Group Company</p>
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
  const orderUrl = `${baseUrl}/account/orders`;
  return sendEmail({
    to: email,
    subject: `Order ${orderNumber} confirmed – PrintHub`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #FF4D00;">PrintHub</h1>
        <p>Thank you for your order.</p>
        <p><strong>Order number:</strong> ${orderNumber}</p>
        <p><strong>Total:</strong> ${currency} ${total.toLocaleString()}</p>
        <p>We'll notify you when your order is on its way. You can track it in your account.</p>
        <p><a href="${orderUrl}" style="color: #FF4D00; font-weight: bold;">View my orders</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">PrintHub · Nairobi, Kenya · An Ezana Group Company</p>
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
  const quotesUrl = `${baseUrl}/account/quotes`;
  const validity = validityDays ? `Valid for ${validityDays} days.` : "";
  const breakdownHtml = breakdown
    ? `<p><strong>Breakdown:</strong></p><p style="white-space: pre-wrap;">${breakdown.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`
    : "";
  return sendEmail({
    to: email,
    subject: `Your quote ${quoteNumber} – PrintHub`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">PrintHub – Your quote</h2>
        <p>We've prepared a quote for your request <strong>${quoteNumber}</strong>.</p>
        <p><strong>Amount:</strong> KES ${quotedAmountKes.toLocaleString()}</p>
        ${breakdownHtml}
        <p>${validity}</p>
        <p><a href="${quotesUrl}" style="color: #FF4D00; font-weight: bold;">View quote &amp; Accept or Decline</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">PrintHub · Nairobi, Kenya · An Ezana Group Company</p>
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
  const adminUrl = `${baseUrl}/admin/quotes`;
  return sendEmail({
    to: staffEmail,
    subject: `Quote ${quoteNumber} accepted – PrintHub`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">Quote accepted</h2>
        <p><strong>${quoteNumber}</strong> has been accepted by <strong>${customerName}</strong>.</p>
        <p><strong>Amount:</strong> KES ${quotedAmountKes.toLocaleString()}</p>
        <p><a href="${adminUrl}" style="color: #FF4D00; font-weight: bold;">View in Admin</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">PrintHub Admin</p>
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
  const adminUrl = `${baseUrl}/admin/quotes`;
  return sendEmail({
    to: staffEmail,
    subject: `Quote ${quoteNumber} assigned to you – PrintHub`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">New quote assigned</h2>
        <p>Quote <strong>${quoteNumber}</strong> (${typeLabel}) from <strong>${customerName}</strong> has been assigned to you.</p>
        <p><a href="${adminUrl}" style="color: #FF4D00; font-weight: bold;">View in Admin</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">PrintHub Admin</p>
      </div>
    `,
  });
}

/** When quote status → in production – notify customer. */
export async function sendQuoteInProductionEmail(email: string, quoteNumber: string) {
  const quotesUrl = `${baseUrl}/account/quotes`;
  return sendEmail({
    to: email,
    subject: `Quote ${quoteNumber} – Now in production – PrintHub`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #FF4D00;">PrintHub – We're on it</h2>
        <p>Your order for quote <strong>${quoteNumber}</strong> is now in production.</p>
        <p>We'll notify you when it's ready. You can also check status in your account.</p>
        <p><a href="${quotesUrl}" style="color: #FF4D00; font-weight: bold;">View my quotes</a></p>
        <p style="color: #6B6B6B; font-size: 12px;">PrintHub · Nairobi, Kenya · An Ezana Group Company</p>
      </div>
    `,
  });
}
