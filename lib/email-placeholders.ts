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
  | "invoices"
  | "delivery"
  | "refunds"
  | "support"
  | "careers"
  | "corporate"
  | "cart"
  | "staff"
  | "admin"
  | "utility"
  | "product";

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
      { key: "loginEmail", label: "loginEmail", description: "Email address the user should use to log in" },
    ],
  },
  customer: {
    label: "Customer",
    placeholders: [
      { key: "firstName", label: "firstName", description: "Customer first name" },
      { key: "customerName", label: "customerName", description: "Customer full name" },
      { key: "customerEmail", label: "customerEmail", description: "Customer email address" },
      { key: "customerPhone", label: "customerPhone", description: "Customer phone number" },
      { key: "loyaltyPoints", label: "loyaltyPoints", description: "Current loyalty points balance" },
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
      { key: "orderDate", label: "orderDate", description: "Date the order was placed" },
      { key: "orderSubtotal", label: "orderSubtotal", description: "Subtotal before tax & shipping" },
      { key: "orderTax", label: "orderTax", description: "Tax amount" },
      { key: "shippingCost", label: "shippingCost", description: "Shipping cost" },
      { key: "orderDiscount", label: "orderDiscount", description: "Discount applied" },
      { key: "orderItemsHtml", label: "orderItemsHtml", description: "Order items list (HTML table)" },
      { key: "paymentMethod", label: "paymentMethod", description: "Payment method (e.g. M-Pesa, Card)" },
      { key: "estimatedDelivery", label: "estimatedDelivery", description: "Estimated delivery date" },
      { key: "orderStatus", label: "orderStatus", description: "Current order status" },
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
      { key: "projectName", label: "projectName", description: "Quote project name" },
      { key: "quoteDeadline", label: "quoteDeadline", description: "Requested deadline" },
      { key: "quoteStatus", label: "quoteStatus", description: "Current quote status" },
      { key: "assignedStaff", label: "assignedStaff", description: "Staff member assigned to quote" },
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
      { key: "paymentDate", label: "paymentDate", description: "Date payment was made" },
      { key: "mpesaReceiptNo", label: "mpesaReceiptNo", description: "M-Pesa receipt number" },
      { key: "mpesaPhone", label: "mpesaPhone", description: "M-Pesa phone number used" },
      { key: "vatAmount", label: "vatAmount", description: "VAT amount" },
    ],
  },
  invoices: {
    label: "Invoices",
    placeholders: [
      { key: "invoiceNumber", label: "invoiceNumber", description: "Invoice number" },
      { key: "invoiceDate", label: "invoiceDate", description: "Invoice issue date" },
      { key: "invoiceDueDate", label: "invoiceDueDate", description: "Invoice due date" },
      { key: "invoiceSubtotal", label: "invoiceSubtotal", description: "Invoice subtotal" },
      { key: "invoiceVat", label: "invoiceVat", description: "Invoice VAT amount" },
      { key: "invoiceTotal", label: "invoiceTotal", description: "Invoice total" },
      { key: "invoiceUrl", label: "invoiceUrl", description: "Link to download invoice PDF" },
    ],
  },
  delivery: {
    label: "Delivery",
    placeholders: [
      { key: "trackingNumber", label: "trackingNumber", description: "Shipment tracking number" },
      { key: "trackingLine", label: "trackingLine", description: "Pre-formatted tracking line (HTML)" },
      { key: "deliveryMethod", label: "deliveryMethod", description: "Delivery method (pickup, standard, express)" },
      { key: "courierName", label: "courierName", description: "Assigned courier name" },
      { key: "estimatedDeliveryDate", label: "estimatedDeliveryDate", description: "Estimated delivery date" },
      { key: "pickupLocationName", label: "pickupLocationName", description: "Pickup location name / address" },
      { key: "deliveryZone", label: "deliveryZone", description: "Delivery zone name" },
      { key: "failureReason", label: "failureReason", description: "Delivery failure reason" },
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
      { key: "ticketStatus", label: "ticketStatus", description: "Ticket status (e.g. Open, Resolved)" },
      { key: "ticketPriority", label: "ticketPriority", description: "Ticket priority (e.g. High, Normal)" },
      { key: "ticketCategory", label: "ticketCategory", description: "Ticket category" },
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
      { key: "creditLimit", label: "creditLimit", description: "Corporate credit limit (KES)" },
      { key: "outstandingBalance", label: "outstandingBalance", description: "Outstanding balance (KES)" },
      { key: "poReference", label: "poReference", description: "Purchase order reference" },
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
  staff: {
    label: "Staff",
    placeholders: [
      { key: "staffName", label: "staffName", description: "Staff member full name" },
      { key: "staffEmail", label: "staffEmail", description: "Staff member email address" },
      { key: "staffDepartment", label: "staffDepartment", description: "Staff department name" },
      { key: "staffPosition", label: "staffPosition", description: "Staff position / job title" },
      { key: "staffRole", label: "staffRole", description: "Staff system role (e.g. Admin, Manager)" },
    ],
  },
  admin: {
    label: "Admin",
    placeholders: [
      { key: "adminUrl", label: "adminUrl", description: "Admin panel URL (e.g. quotes, corporate)" },
    ],
  },
  utility: {
    label: "Utility",
    placeholders: [
      { key: "currentYear", label: "currentYear", description: "Current year (e.g. 2026)" },
      { key: "preferencesUrl", label: "preferencesUrl", description: "Link to email / notification preferences" },
      { key: "accountUrl", label: "accountUrl", description: "Link to customer account page" },
    ],
  },
  product: {
    label: "Product",
    placeholders: [
      { key: "productName", label: "productName", description: "Product name e.g. 3D Printed Key Holder" },
      { key: "productUrl", label: "productUrl", description: "Full URL to the product page" },
      { key: "productImage", label: "productImage", description: "Product image URL (first / primary image)" },
      { key: "productSlug", label: "productSlug", description: "URL slug e.g. 3d-printed-key-holder" },
      { key: "productPrice", label: "productPrice", description: "Product base price with currency" },
      { key: "productSku", label: "productSku", description: "Product SKU / reference code" },
      { key: "productCategory", label: "productCategory", description: "Product category name" },
      { key: "productDescription", label: "productDescription", description: "Short product description" },
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
