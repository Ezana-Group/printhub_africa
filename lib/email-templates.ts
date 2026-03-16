import { prisma } from "@/lib/prisma";

/** Replace {{key}} in str with context[key]; unknown keys become empty string. */
export function renderTemplate(
  str: string,
  context: Record<string, string>
): string {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => context[key] ?? "");
}

/** Get template by slug. Returns null if not found or subject/body empty (use fallback). */
export async function getEmailTemplate(slug: string): Promise<{
  subject: string;
  bodyHtml: string;
} | null> {
  const t = await prisma.emailTemplate.findUnique({ where: { slug } });
  if (!t || !t.subject.trim() || !t.bodyHtml.trim()) return null;
  return { subject: t.subject, bodyHtml: t.bodyHtml };
}

/** Metadata for admin list: slug, display name, optional description. */
export const EMAIL_TEMPLATE_META: Record<
  string,
  { name: string; description?: string }
> = {
  verification: {
    name: "Email verification",
    description: "Sent when a user signs up; contains verify link.",
  },
  "password-reset": {
    name: "Password reset",
    description: "Sent when user requests password reset.",
  },
  "quote-received": {
    name: "Quote request received",
    description: "Sent to customer when quote request is submitted.",
  },
  "order-confirmation": {
    name: "Order confirmation",
    description: "Sent when an order is confirmed.",
  },
  "order-status": {
    name: "Order status / tracking",
    description: "Sent when order status is updated (e.g. tracking).",
  },
  "payment-received": {
    name: "Payment reference received",
    description: "Sent when manual payment reference is recorded.",
  },
  "payment-rejected": {
    name: "Payment verification failed",
    description: "Sent when staff cannot verify payment reference.",
  },
  "pickup-confirmation": {
    name: "Pay on pickup confirmation",
    description: "Sent when order is confirmed for pay-on-pickup.",
  },
  "quote-sent-to-customer": {
    name: "Quote sent to customer",
    description: "Sent when staff sends a quote (status → quoted).",
  },
  "staff-quote-accepted": {
    name: "Staff: quote accepted",
    description: "Notifies staff when customer accepts a quote.",
  },
  "staff-quote-assigned": {
    name: "Staff: quote assigned",
    description: "Notifies staff when a quote is assigned to them.",
  },
  "quote-in-production": {
    name: "Quote in production",
    description: "Sent to customer when quote status → in production.",
  },
  "career-application-confirmation": {
    name: "Career: application received",
    description: "Sent to applicant when job application is submitted.",
  },
  "career-application-admin": {
    name: "Career: new application (admin)",
    description: "Notifies admin of new job application.",
  },
  "career-shortlisted": {
    name: "Career: shortlisted",
    description: "Sent to applicant when shortlisted.",
  },
  "career-rejected": {
    name: "Career: application not successful",
    description: "Sent when application is rejected.",
  },
  "career-offer": {
    name: "Career: offer made",
    description: "Sent when job offer is made.",
  },
  "abandoned-cart-1": {
    name: "Abandoned cart (first reminder)",
    description: "First reminder after leaving checkout.",
  },
  "abandoned-cart-2": {
    name: "Abandoned cart (second reminder)",
    description: "Second reminder; may include unsubscribe.",
  },
  "corporate-received": {
    name: "Corporate application received",
    description: "Sent to applicant when corporate application is submitted.",
  },
  "corporate-new-admin": {
    name: "Corporate: new application (admin)",
    description: "Notifies admin of new corporate application.",
  },
  "corporate-approved": {
    name: "Corporate application approved",
    description: "Sent when corporate account is approved.",
  },
  "corporate-rejected": {
    name: "Corporate application rejected",
    description: "Sent when corporate application is rejected.",
  },
  "delivery-dispatched": {
    name: "Delivery dispatched",
    description: "Sent when order is shipped.",
  },
  "delivery-delivered": {
    name: "Delivery delivered",
    description: "Sent when order is marked delivered.",
  },
  "delivery-failed": {
    name: "Delivery failed",
    description: "Sent when delivery fails.",
  },
  "order-cancelled": {
    name: "Order cancelled",
    description: "Sent when order is cancelled.",
  },
  "refund-approved": {
    name: "Refund approved",
    description: "Sent when refund request is approved.",
  },
  "refund-rejected": {
    name: "Refund rejected",
    description: "Sent when refund request is rejected.",
  },
  "refund-processed": {
    name: "Refund processed",
    description: "Sent when refund has been sent to M-Pesa.",
  },
  "ticket-created": {
    name: "Support ticket created",
    description: "Sent when support request is created.",
  },
  "ticket-replied": {
    name: "Support ticket replied",
    description: "Sent when staff replies to a ticket.",
  },
  "ticket-resolved": {
    name: "Support ticket resolved",
    description: "Sent when ticket is marked resolved.",
  },
};

export const EMAIL_TEMPLATE_SLUGS = Object.keys(
  EMAIL_TEMPLATE_META
) as readonly string[];

const BASE_SAMPLE = {
  businessName: "PrintHub Africa",
  footer: "PrintHub Africa · Nairobi, Kenya",
  baseUrl: "https://printhub.africa",
};

/** Sample context for preview and send-test. Keys match placeholders used in templates. */
export function getSampleContextForSlug(slug: string): Record<string, string> {
  const base = { ...BASE_SAMPLE };
  switch (slug) {
    case "verification":
      return { ...base, verifyUrl: `${base.baseUrl}/verify-email?token=sample-token` };
    case "password-reset":
      return { ...base, resetUrl: `${base.baseUrl}/reset-password?token=sample-token` };
    case "quote-received":
      return { ...base, quoteNumber: "Q-2025-001", typeLabel: "Bulk print", quotesUrl: `${base.baseUrl}/account/quotes` };
    case "order-confirmation":
      return { ...base, orderNumber: "ORD-2025-001", orderTotal: "15,000", currency: "KES", orderUrl: `${base.baseUrl}/account/orders` };
    case "order-status":
      return { ...base, orderNumber: "ORD-2025-001", title: "Dispatched", description: "Your order is on its way.", trackUrl: `${base.baseUrl}/track?ref=ORD-2025-001` };
    case "payment-received":
      return { ...base, orderNumber: "ORD-2025-001", reference: "ABC123", method: "M-Pesa" };
    case "payment-rejected":
      return { ...base, orderNumber: "ORD-2025-001", reference: "ABC123", whatsapp: "https://wa.me/254727410320" };
    case "pickup-confirmation":
      return { ...base, orderNumber: "ORD-2025-001", pickupCode: "PICK-789", totalKes: "12,500" };
    case "quote-sent-to-customer":
      return { ...base, quoteNumber: "Q-2025-001", quotedAmountKes: "25,000", breakdown: "Item A: 10,000\nItem B: 15,000", validity: "Valid for 14 days.", breakdownHtml: "<p><strong>Breakdown:</strong></p><p>Item A: 10,000</p>", quotesUrl: `${base.baseUrl}/account/quotes` };
    case "staff-quote-accepted":
      return { ...base, quoteNumber: "Q-2025-001", customerName: "Jane Doe", quotedAmountKes: "25,000", adminUrl: `${base.baseUrl}/admin/quotes` };
    case "staff-quote-assigned":
      return { ...base, quoteNumber: "Q-2025-001", customerName: "Jane Doe", typeLabel: "Bulk print", adminUrl: `${base.baseUrl}/admin/quotes` };
    case "quote-in-production":
      return { ...base, quoteNumber: "Q-2025-001", quotesUrl: `${base.baseUrl}/account/quotes` };
    case "career-application-confirmation":
      return { ...base, firstName: "John", jobTitle: "Designer", applicationRef: "APP-001", site: "printhub.africa" };
    case "career-application-admin":
      return { ...base, jobTitle: "Designer", applicantName: "John Doe", applicantEmail: "john@example.com", applicantPhone: "+254700000000", appliedAt: "16 Mar 2025", viewUrl: `${base.baseUrl}/admin/careers/applications/1`, site: "printhub.africa" };
    case "career-shortlisted":
    case "career-rejected":
    case "career-offer":
      return { ...base, firstName: "John", jobTitle: "Designer", site: "printhub.africa" };
    case "abandoned-cart-1":
    case "abandoned-cart-2":
      return { ...base, firstName: "Jane", cartUrl: `${base.baseUrl}/cart`, unsubscribeUrl: `${base.baseUrl}/account/preferences`, unsubscribeLine: "" };
    case "corporate-received":
      return { ...base, applicantName: "Jane", companyName: "Acme Ltd", applicationRef: "CORP-001" };
    case "corporate-new-admin":
      return { ...base, companyName: "Acme Ltd", contactPerson: "Jane Doe", adminUrl: `${base.baseUrl}/admin/corporate/applications` };
    case "corporate-approved":
      return { ...base, contactPerson: "Jane", companyName: "Acme Ltd", accountNumber: "CORP-1001", dashboardUrl: `${base.baseUrl}/corporate/dashboard` };
    case "corporate-rejected":
      return { ...base, contactPerson: "Jane", companyName: "Acme Ltd", reason: "Incomplete documentation.", reasonLine: "<p><strong>Reason:</strong> Incomplete documentation.</p>", applyUrl: `${base.baseUrl}/corporate/apply` };
    case "delivery-dispatched":
      return { ...base, orderNumber: "ORD-2025-001", trackingNumber: "TRK123", trackingLine: "<p><strong>Tracking:</strong> TRK123</p>", trackUrl: `${base.baseUrl}/track?ref=ORD-2025-001` };
    case "delivery-delivered":
      return { ...base, orderNumber: "ORD-2025-001", ordersUrl: `${base.baseUrl}/account/orders` };
    case "delivery-failed":
      return { ...base, orderNumber: "ORD-2025-001", failureReason: "Address not found.", reasonLine: "<p><strong>Reason:</strong> Address not found.</p>", supportUrl: `${base.baseUrl}/contact` };
    case "order-cancelled":
      return { ...base, orderNumber: "ORD-2025-001", reason: "Customer request.", reasonLine: "<p><strong>Reason:</strong> Customer request.</p>", ordersUrl: `${base.baseUrl}/account/orders` };
    case "refund-approved":
      return { ...base, refundNumber: "REF-001", orderNumber: "ORD-2025-001", amountKes: "5,000", ordersUrl: `${base.baseUrl}/account/orders` };
    case "refund-rejected":
      return { ...base, refundNumber: "REF-001", orderNumber: "ORD-2025-001", rejectionReason: "Outside refund window.", reasonLine: "<p><strong>Reason:</strong> Outside refund window.</p>", supportUrl: `${base.baseUrl}/contact` };
    case "refund-processed":
      return { ...base, refundNumber: "REF-001", orderNumber: "ORD-2025-001", amountKes: "5,000", mpesaReceiptNo: "ABC123XYZ", receiptLine: "<p><strong>M-Pesa receipt:</strong> ABC123XYZ</p>" };
    case "ticket-created":
    case "ticket-replied":
    case "ticket-resolved":
      return { ...base, ticketNumber: "TKT-001", ticketSubject: "Order delay", supportUrl: `${base.baseUrl}/account/support`, messagePreview: "We've looked into your order and will dispatch tomorrow." };
    default:
      return base;
  }
}
