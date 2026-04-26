import { Hero } from "@/components/marketing/hero";
import { CategoryStrip } from "@/components/marketing/category-strip";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { FeaturedProducts } from "@/components/marketing/featured-products";
import { StickyMiniCartCTA } from "@/components/marketing/sticky-mini-cart-cta";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCachedCategories } from "@/lib/cache/unstable-cache";
import { getSiteImageSlots, SITE_IMAGE_DEFAULTS } from "@/lib/site-images";
import { prisma } from "@/lib/prisma";
import { getServiceFlags } from "@/lib/service-flags";

export const dynamic = "force-dynamic"; // no DB at Docker build — render at request time
// ISR: revalidate every 5 minutes so homepage is served from edge cache
export const revalidate = 300;

export default async function HomePage() {
  const [siteImages, categories, serviceFlags] = await Promise.all([
    getSiteImageSlots(prisma).catch(() => SITE_IMAGE_DEFAULTS),
    getCachedCategories().catch(() => []),
    getServiceFlags(),
  ]);

  const homepageCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
  }));

  const homeGridCols = serviceFlags.homeFeaturedColumns ?? 4;
  const homeGridRows = serviceFlags.homeFeaturedRows ?? 1;

  return (
    <>
      <Hero heroImage={siteImages.marketing_hero} largeFormatEnabled={serviceFlags.largeFormatEnabled} />
      <section className="bg-white py-5 border-b border-slate-100">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/shop?sort=bestselling"
              className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-semibold text-orange-700"
            >
              Best sellers
            </Link>
            <Link
              href="/shop?sort=newest"
              className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700"
            >
              New arrivals
            </Link>
            <Link
              href="/shop?maxPrice=1500"
              className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700"
            >
              Under KES 1,500
            </Link>
          </div>
        </div>
      </section>
      <FeaturedProducts gridCols={homeGridCols} maxItems={homeGridCols * homeGridRows} />
      <section className="bg-slate-50 py-10">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <h2 className="sr-only">Services and offers</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Custom jobs</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">Need a custom 3D part?</h3>
              <p className="mt-1 text-sm text-slate-600">Upload your model and receive a fast production quote.</p>
              <Button asChild size="sm" className="mt-4 rounded-xl">
                <Link href="/get-a-quote">Upload model</Link>
              </Button>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Best value</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">Shop by budget</h3>
              <p className="mt-1 text-sm text-slate-600">Discover top 3D products under KES 1,500 and weekly deals.</p>
              <Button asChild size="sm" variant="outline" className="mt-4 rounded-xl">
                <Link href="/shop?maxPrice=1500">View budget picks</Link>
              </Button>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">For businesses</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">Prototype or batch production</h3>
              <p className="mt-1 text-sm text-slate-600">From one-off prototypes to repeatable small-batch runs.</p>
              <Button asChild size="sm" variant="outline" className="mt-4 rounded-xl">
                <Link href="/services/3d-printing">Explore 3D services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      <CategoryStrip categories={homepageCategories} />
      <HowItWorks
        stepImages={[
          siteImages.how_it_works_step_01,
          siteImages.how_it_works_step_02,
          siteImages.how_it_works_step_03,
          siteImages.how_it_works_step_04,
        ]}
      />
      <StickyMiniCartCTA />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "PrintHub Africa",
            url: "https://printhub.africa",
            logo: "https://printhub.africa/logo.png",
            description: "Professional 3D printing service in Africa",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Nairobi",
              addressCountry: "KE",
            },
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer service",
              availableLanguage: "English",
            },
            sameAs: ["https://printhub.africa"],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "PrintHub Africa",
            url: "https://printhub.africa",
            description: "Professional 3D printing service in Africa",
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: "https://printhub.africa/shop?q={search_term_string}",
              },
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
    </>
  );
}
