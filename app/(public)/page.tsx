import { Hero } from "@/components/marketing/hero";
import { ServicesOverview } from "@/components/marketing/services-overview";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { FeaturedProducts } from "@/components/marketing/featured-products";
import { FeaturedCatalogueSection } from "@/components/marketing/featured-catalogue";
import { NewArrivalsSection } from "@/components/marketing/new-arrivals-section";
import { WhyPrintHub } from "@/components/marketing/why-printhub";
import { PriceCalculatorTeaser } from "@/components/marketing/price-calculator-teaser";
import { CTABanner } from "@/components/marketing/cta-banner";
import { getCachedBusinessPublic } from "@/lib/cache/unstable-cache";
import { getSiteImageSlots } from "@/lib/site-images";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic"; // no DB at Docker build — render at request time
// ISR: revalidate every 5 minutes so homepage is served from edge cache
export const revalidate = 300;

export default async function HomePage() {
  const [business, siteImages] = await Promise.all([
    getCachedBusinessPublic(),
    getSiteImageSlots(prisma),
  ]);
  return (
    <>
      <Hero heroImage={siteImages.marketing_hero} />
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
      <NewArrivalsSection />
      <FeaturedProducts />
      <FeaturedCatalogueSection />
      <PriceCalculatorTeaser />
      <WhyPrintHub city={business.city} businessName={business.businessName} />
      <CTABanner whatsapp={business.whatsapp} />
    </>
  );
}
