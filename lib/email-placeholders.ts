/**
 * All email template placeholders used across the system and admin.
 * Used by the email template editor for categorized, filterable drag-and-drop.
 */

export type PlaceholderItem = { key: string; label: string; description: string };

export type PlaceholderCategory =
  | "business"
  | "auth"
  | "customer"
  | "orders"
  | "quotes"
  | "payments"
  | "delivery"
  | "refunds"
  | "support"
  | "careers"
  | "corporate"
  | "cart"
  | "admin";

export const EMAIL_PLACEHOLDER_CATEGORIES: Record<
  PlaceholderCategory,
  { label: string; placeholders: PlaceholderItem[] }
> = {
  business: {
    label: "Business",
    placeholders: [
      { key: "businessName", label: "businessName", description: "Your business name" },
      { key: "footer", label: "footer", description: "Footer line (e.g. Business · City, Country)" },
      { key: "baseUrl", label: "baseUrl", description: "Site base URL" },
      { key: "site", label: "site", description: "Site domain (e.g. printhub.africa)" },
    ],
  },
  auth: {
    label: "Auth & verification",
    placeholders: [
      { key: "verifyUrl", label: "verifyUrl", description: "Email verification link" },
      { key: "resetUrl", label: "resetUrl", description: "Password reset link" },
    ],
  },
  customer: {
    label: "Customer",
    placeholders: [
      { key: "firstName", label: "firstName", description: "Customer first name" },
      { key: "customerName", label: "customerName", description: "Customer full name" },
    ],
  },
  orders: {
    label: "Orders",
    placeholders: [
      { key: "orderNumber", label: "orderNumber", description: "Order reference number" },
      { key: "orderTotal", label: "orderTotal", description: "Order total amount" },
      { key: "currency", label: "currency", description: "Currency code (e.g. KES)" },
      { key: "orderUrl", label: "orderUrl", description: "Link to view order" },
      { key: "ordersUrl", label: "ordersUrl", description: "Link to orders list" },
      { key: "title", label: "title", description: "Order status title (e.g. Dispatched)" },
      { key: "description", label: "description", description: "Order status description" },
      { key: "trackUrl", label: "trackUrl", description: "Order tracking URL" },
    ],
  },
  quotes: {
    label: "Quotes",
    placeholders: [
      { key: "quoteNumber", label: "quoteNumber", description: "Quote reference number" },
      { key: "typeLabel", label: "typeLabel", description: "Quote type (e.g. Bulk print)" },
      { key: "quotesUrl", label: "quotesUrl", description: "Link to customer quotes" },
      { key: "quotedAmountKes", label: "quotedAmountKes", description: "Quoted amount in KES" },
      { key: "validity", label: "validity", description: "Quote validity text" },
      { key: "breakdown", label: "breakdown", description: "Quote breakdown (plain text)" },
      { key: "breakdownHtml", label: "breakdownHtml", description: "Quote breakdown (HTML)" },
    ],
  },
  payments: {
    label: "Payments",
    placeholders: [
      { key: "reference", label: "reference", description: "Payment reference number" },
      { key: "method", label: "method", description: "Payment method (e.g. M-Pesa)" },
      { key: "whatsapp", label: "whatsapp", description: "WhatsApp support link" },
      { key: "pickupCode", label: "pickupCode", description: "Pay-on-pickup code" },
      { key: "totalKes", label: "totalKes", description: "Amount to pay at pickup (KES)" },
    ],
  },
  delivery: {
    label: "Delivery",
    placeholders: [
      { key: "trackingNumber", label: "trackingNumber", description: "Shipment tracking number" },
      { key: "trackingLine", label: "trackingLine", description: "Pre-formatted tracking line (HTML)" },
    ],
  },
  refunds: {
    label: "Refunds",
    placeholders: [
      { key: "refundNumber", label: "refundNumber", description: "Refund reference number" },
      { key: "amountKes", label: "amountKes", description: "Refund amount in KES" },
      { key: "mpesaReceiptNo", label: "mpesaReceiptNo", description: "M-Pesa receipt number" },
      { key: "receiptLine", label: "receiptLine", description: "Pre-formatted receipt line (HTML)" },
      { key: "reasonLine", label: "reasonLine", description: "Pre-formatted reason line (HTML)" },
      { key: "rejectionReason", label: "rejectionReason", description: "Reason for rejection" },
    ],
  },
  support: {
    label: "Support",
    placeholders: [
      { key: "ticketNumber", label: "ticketNumber", description: "Support ticket number" },
      { key: "ticketSubject", label: "ticketSubject", description: "Ticket subject" },
      { key: "messagePreview", label: "messagePreview", description: "Preview of reply message" },
      { key: "supportUrl", label: "supportUrl", description: "Link to support / tickets" },
    ],
  },
  careers: {
    label: "Careers",
    placeholders: [
      { key: "jobTitle", label: "jobTitle", description: "Job / role title" },
      { key: "applicationRef", label: "applicationRef", description: "Application reference" },
      { key: "applicantName", label: "applicantName", description: "Applicant full name" },
      { key: "applicantEmail", label: "applicantEmail", description: "Applicant email" },
      { key: "applicantPhone", label: "applicantPhone", description: "Applicant phone" },
      { key: "appliedAt", label: "appliedAt", description: "Application date" },
      { key: "viewUrl", label: "viewUrl", description: "Admin link to view application" },
    ],
  },
  corporate: {
    label: "Corporate",
    placeholders: [
      { key: "companyName", label: "companyName", description: "Company name" },
      { key: "contactPerson", label: "contactPerson", description: "Contact person name" },
      { key: "accountNumber", label: "accountNumber", description: "Corporate account number" },
      { key: "dashboardUrl", label: "dashboardUrl", description: "Corporate dashboard URL" },
      { key: "applyUrl", label: "applyUrl", description: "Corporate apply page URL" },
      { key: "reason", label: "reason", description: "Reason (e.g. rejection reason)" },
    ],
  },
  cart: {
    label: "Cart & preferences",
    placeholders: [
      { key: "cartUrl", label: "cartUrl", description: "Link to cart" },
      { key: "unsubscribeUrl", label: "unsubscribeUrl", description: "Unsubscribe / preferences URL" },
      { key: "unsubscribeLine", label: "unsubscribeLine", description: "Pre-formatted unsubscribe line (HTML)" },
    ],
  },
  admin: {
    label: "Admin",
    placeholders: [
      { key: "adminUrl", label: "adminUrl", description: "Admin panel URL (e.g. quotes, corporate)" },
    ],
  },
};

/** All placeholder keys in a flat list for filtering. */
export const ALL_PLACEHOLDER_KEYS = (() => {
  const set = new Set<string>();
  for (const cat of Object.values(EMAIL_PLACEHOLDER_CATEGORIES)) {
    for (const p of cat.placeholders) set.add(p.key);
  }
  return Array.from(set).sort();
})();

/** Format placeholder for insertion: {{key}} */
export function formatPlaceholder(key: string): string {
  return `{{${key}}}`;
}
