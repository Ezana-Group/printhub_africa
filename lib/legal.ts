/**
 * Legal page slugs and nav — single source of truth for all 6 legal documents.
 * Used by public legal page, admin legal CMS, API routes, and footer.
 */

export const LEGAL_SLUGS = [
  "privacy-policy",
  "terms-of-service",
  "refund-policy",
  "cookie-policy",
  "account-terms",
  "corporate-terms",
] as const;

export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export const LEGAL_NAV: { slug: LegalSlug; label: string }[] = [
  { slug: "privacy-policy", label: "Privacy Policy" },
  { slug: "terms-of-service", label: "Terms of Service" },
  { slug: "refund-policy", label: "Refund & Returns Policy" },
  { slug: "cookie-policy", label: "Cookie Policy" },
  { slug: "account-terms", label: "Account Registration Terms" },
  { slug: "corporate-terms", label: "Corporate Account Terms" },
];

export function isLegalSlug(s: string): s is LegalSlug {
  return LEGAL_SLUGS.includes(s as LegalSlug);
}
