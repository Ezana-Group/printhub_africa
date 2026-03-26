import { prisma } from "@/lib/prisma";

/** Replace {{key}} in str with context[key]; unknown keys become empty string. */
export function renderWhatsAppTemplate(
  str: string,
  context: Record<string, string>
): string {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => context[key] ?? "");
}

/** Get template by slug. Returns null if not found or body empty (use fallback). */
export async function getWhatsAppTemplate(slug: string): Promise<string | null> {
  const t = await prisma.whatsappTemplate.findUnique({ where: { slug } }).catch(() => null);
  if (!t || !t.body.trim()) return null;
  return t.body;
}

/** Metadata for admin list: slug, display name, optional description. */
export const WHATSAPP_TEMPLATE_META: Record<
  string,
  { name: string; description?: string; defaultBody: string }
> = {
  "quote-enquiry": {
    name: "Quote Enquiry",
    description: "Sent when a customer has a question about a quote.",
    defaultBody: "Hi PrintHub, I have a question about quote {{quoteNumber}}.",
  },
  "quote-accepted": {
    name: "Quote Accepted",
    description: "Sent when a customer accepts a quote.",
    defaultBody: "Hi PrintHub, I've accepted quote {{quoteNumber}}. Please let me know the next steps.",
  },
  "product-enquiry": {
    name: "Product Enquiry",
    description: "Sent when a customer is interested in a shop product.",
    defaultBody: "Hi PrintHub! I'm interested in \"{{productName}}\". Can I get more details?",
  },
  "catalogue-enquiry": {
    name: "Catalogue Item Enquiry",
    description: "Sent when a customer is interested in a catalogue item.",
    defaultBody: "Hi PrintHub! I'm interested in \"{{itemName}}\" from your catalogue. Can I get a quote?",
  },
  "order-enquiry": {
    name: "Order Enquiry",
    description: "Sent when a customer has a question about their order.",
    defaultBody: "Hi PrintHub, I'm enquiring about order {{orderNumber}}.",
  },
  "career-enquiry": {
    name: "Career Enquiry",
    description: "Sent when a candidate has a question about a job opening.",
    defaultBody: "Hi PrintHub, I have a question about the {{jobTitle}} position.",
  },
  "support-general": {
    name: "General Support",
    description: "Default message for general support enquiries.",
    defaultBody: "Hi PrintHub, I'd like to enquire about your services.",
  },
};

export const WHATSAPP_TEMPLATE_SLUGS = Object.keys(
  WHATSAPP_TEMPLATE_META
) as readonly string[];
