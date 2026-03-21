import { Hero } from "@/components/marketing/hero";
import { CategoryStrip } from "@/components/marketing/category-strip";
import { ServicesOverview } from "@/components/marketing/services-overview";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { FeaturedProducts } from "@/components/marketing/featured-products";
import { FeaturedCatalogueSection } from "@/components/marketing/featured-catalogue";
import { PriceCalculatorTeaser } from "@/components/marketing/price-calculator-teaser";
import { getCachedCategories } from "@/lib/cache/unstable-cache";
import { getSiteImageSlots, SITE_IMAGE_DEFAULTS } from "@/lib/site-images";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic"; // no DB at Docker build — render at request time
// ISR: revalidate every 5 minutes so homepage is served from edge cache
export const revalidate = 300;

export default async function HomePage() {
  const [siteImages, categories] = await Promise.all([
    getSiteImageSlots(prisma).catch(() => SITE_IMAGE_DEFAULTS),
    getCachedCategories().catch(() => []),
  ]);

  const homepageCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
  }));

  return (
    <>
      <Hero heroImage={siteImages.marketing_hero} />
      <CategoryStrip categories={homepageCategories} />
      <FeaturedProducts />
      <FeaturedCatalogueSection />
      <ServicesOverview
        largeFormatImage={siteImages.marketing_services_large_format}
        threeDImage={siteImages.marketing_services_3d}
      />
      <HowItWorks
        stepImages={[
          siteImages.how_it_works_step_01,
          siteImages.how_it_works_step_02,
          siteImages.how_it_works_step_03,
          siteImages.how_it_works_step_04,
        ]}
      />
      <PriceCalculatorTeaser />
    </>
  );
}
