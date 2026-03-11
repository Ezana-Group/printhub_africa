import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getBusinessPublic } from "@/lib/business-public";
import type { Metadata } from "next";

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
    return null; // table may not exist yet if migrations not run
  }
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

  const page = await getLegalPage(legalSlug);

  if (!page) notFound();

  return (
    <div className="container max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-col lg:flex-row gap-10">
        <aside className="lg:w-56 shrink-0">
          <nav className="sticky top-24 space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Legal
            </p>
            {LEGAL_NAV.map(({ slug, label }) => (
              <Link
                key={slug}
                href={`/${slug}`}
                className={`block py-1.5 text-sm ${
                  slug === legalSlug
                    ? "text-primary font-medium"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <article className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-bold text-slate-900">
            {page.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Last updated: {new Date(page.lastUpdated).toLocaleDateString("en-KE", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <div
            className="prose prose-slate mt-8 max-w-none prose-headings:font-display prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-table:border-collapse prose-table:w-full prose-th:border prose-th:border-slate-200 prose-th:bg-slate-50 prose-th:px-4 prose-th:py-3 prose-th:text-left prose-td:border prose-td:border-slate-200 prose-td:px-4 prose-td:py-3"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </article>
      </div>
    </div>
  );
}
