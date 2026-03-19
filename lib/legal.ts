/**
 * Legal page slugs and nav — single source of truth for legal documents.
 * Used by public legal page, admin legal CMS, API routes, and footer.
 */

export const LEGAL_SLUGS = [
  "privacy-policy",
  "data-deletion",
  "terms-of-service",
  "refund-policy",
  "cookie-policy",
  "account-terms",
  "corporate-terms",
] as const;

export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export const LEGAL_NAV: { slug: LegalSlug; label: string }[] = [
  { slug: "privacy-policy", label: "Privacy Policy" },
  { slug: "data-deletion", label: "Data Deletion Request" },
  { slug: "terms-of-service", label: "Terms of Service" },
  { slug: "refund-policy", label: "Refund & Returns Policy" },
  { slug: "cookie-policy", label: "Cookie Policy" },
  { slug: "account-terms", label: "Account Registration Terms" },
  { slug: "corporate-terms", label: "Corporate Account Terms" },
];

export function isLegalSlug(s: string): s is LegalSlug {
  return LEGAL_SLUGS.includes(s as LegalSlug);
}

/** URL-safe slug for new legal pages: lowercase, a-z, 0-9, hyphens only. */
export function isValidLegalSlugFormat(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 2 && slug.length <= 80;
}
