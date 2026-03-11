import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getBusinessPublic } from "@/lib/business-public";
import type { Metadata } from "next";
import type { BusinessPublic } from "@/lib/business-public";
import { Mail, MapPin, Phone } from "lucide-react";

const LEGAL_SLUGS = ["privacy-policy", "terms-of-service", "cookie-policy", "refund-policy"] as const;
const LEGAL_NAV: { slug: (typeof LEGAL_SLUGS)[number]; label: string }[] = [
  { slug: "privacy-policy", label: "Privacy Policy" },
  { slug: "terms-of-service", label: "Terms of Service" },
  { slug: "cookie-policy", label: "Cookie Policy" },
  { slug: "refund-policy", label: "Refund & Returns Policy" },
];

type Props = { params: Promise<{ legalSlug: string }> };

async function getLegalPage(slug: string) {
  try {
    return await prisma.legalPage.findUnique({
      where: { slug, isPublished: true },
    });
  } catch {
    return null;
  }
}

/** Replace hardcoded placeholders in legal HTML with current business data. */
function injectBusinessIntoContent(html: string, b: BusinessPublic): string {
  const site = b.website?.replace(/^https?:\/\//, "") ?? "printhub.africa";
  const addressParts = [b.address1, b.address2, b.city, b.country].filter(Boolean);
  const fullAddress = addressParts.length > 0 ? addressParts.join(", ") : "—";
  const cityCountry = [b.city, b.country].filter(Boolean).join(", ") || "Kenya";
  const phone = b.primaryPhone?.trim() || "—";
  const primaryEmail = b.primaryEmail?.trim() || "hello@printhub.africa";
  const supportEmail = b.supportEmail?.trim() || b.primaryEmail?.trim() || "support@printhub.africa";

  return html
    .replace(/\bprivacy@printhub\.africa\b/g, supportEmail)
    .replace(/\bhello@printhub\.africa\b/g, primaryEmail)
    .replace(/\+254\s*XXX\s*XXX\s*XXX/g, phone)
    .replace(/\[\s*Your\s+Address\s*\],\s*Nairobi,\s*Kenya/gi, fullAddress)
    .replace(/\[\s*Address\s*\],\s*Nairobi,\s*Kenya/gi, fullAddress)
    .replace(/\bNairobi,\s*Kenya\b/g, cityCountry)
    .replace(/\bcourts of Nairobi\b/g, `courts of ${b.city || "Nairobi"}`)
    .replace(/\bPrintHub\b/g, b.businessName)
    .replace(/\bprinthub\.africa\b/g, site)
    .replace(/\bEzana Group\b/g, b.tradingName || b.businessName)
    .replace(/\bAn Ezana Group Company\b/g, b.tradingName ? `Part of ${b.tradingName}` : "")
    .replace(/PrintHub\s*\|\s*An Ezana Group Company\s*<br\s*\/?>/gi, `${b.businessName}${b.tradingName ? ` | ${b.tradingName}` : ""}<br/>`);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { legalSlug } = await params;
  const business = await getBusinessPublic();
  const site = business.website?.replace(/^https?:\/\//, "") ?? "printhub.africa";
  if (!LEGAL_SLUGS.includes(legalSlug as (typeof LEGAL_SLUGS)[number])) {
    return { title: `Not Found | ${business.businessName}` };
  }
  const page = await getLegalPage(legalSlug);
  if (!page) return { title: business.businessName };
  return {
    title: `${page.title} | ${business.businessName}`,
    description: `${business.businessName} ${page.title} — ${site}`,
    robots: "noindex",
  };
}

export default async function LegalPage({ params }: Props) {
  const { legalSlug } = await params;
  if (!LEGAL_SLUGS.includes(legalSlug as (typeof LEGAL_SLUGS)[number])) {
    notFound();
  }

  const [page, business] = await Promise.all([
    getLegalPage(legalSlug),
    getBusinessPublic(),
  ]);

  if (!page) notFound();

  const contentHtml = injectBusinessIntoContent(page.content, business);
  const addressLine = [business.address1, business.address2, business.city, business.country].filter(Boolean).join(", ") || null;

  return (
    <div className="min-h-screen bg-slate-50/80">
      <div className="container max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* Sidebar: nav + contact card */}
          <aside className="lg:w-64 shrink-0 space-y-6">
            <nav className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Legal
              </p>
              <ul className="space-y-0.5">
                {LEGAL_NAV.map(({ slug, label }) => (
                  <li key={slug}>
                    <Link
                      href={`/${slug}`}
                      className={`block py-2 px-3 rounded-lg text-sm transition-colors ${
                        slug === legalSlug
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Dynamic contact card */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                {business.businessName}
              </h3>
              <ul className="space-y-2.5 text-sm text-slate-600">
                {business.primaryPhone && (
                  <li className="flex items-start gap-2">
                    <Phone className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
                    <a href={`tel:${business.primaryPhone.replace(/\s/g, "")}`} className="hover:text-primary">
                      {business.primaryPhone}
                    </a>
                  </li>
                )}
                {business.primaryEmail && (
                  <li className="flex items-start gap-2">
                    <Mail className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
                    <a href={`mailto:${business.primaryEmail}`} className="hover:text-primary break-all">
                      {business.primaryEmail}
                    </a>
                  </li>
                )}
                {addressLine && (
                  <li className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
                    <span>{addressLine}</span>
                  </li>
                )}
              </ul>
              <Link
                href="/get-a-quote"
                className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
              >
                Get in touch →
              </Link>
            </div>
          </aside>

          {/* Main article */}
          <article className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-6 md:px-8 md:py-8">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900">
                {page.title}
              </h1>
              <p className="text-sm text-slate-500 mt-2">
                Last updated:{" "}
                {page.lastUpdated
                  ? new Date(page.lastUpdated).toLocaleDateString("en-KE", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"}
              </p>
              <div
                className="prose prose-slate mt-8 max-w-none prose-headings:font-display prose-headings:scroll-mt-20 prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3 prose-h2:font-semibold prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-p:leading-relaxed prose-ul:my-4 prose-li:my-0.5 prose-table:border-collapse prose-table:w-full prose-th:border prose-th:border-slate-200 prose-th:bg-slate-50 prose-th:px-4 prose-th:py-3 prose-th:text-left prose-td:border prose-td:border-slate-200 prose-td:px-4 prose-td:py-3"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
