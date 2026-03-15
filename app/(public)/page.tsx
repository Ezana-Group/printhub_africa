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

export const dynamic = "force-dynamic"; // no DB at Docker build — render at request time
// ISR: revalidate every 5 minutes so homepage is served from edge cache
export const revalidate = 300;

export default async function HomePage() {
  const business = await getCachedBusinessPublic();
  return (
    <>
      <Hero />
      <ServicesOverview />
      <HowItWorks />
      <NewArrivalsSection />
      <FeaturedProducts />
      <FeaturedCatalogueSection />
      <PriceCalculatorTeaser />
      <WhyPrintHub city={business.city} businessName={business.businessName} />
      <CTABanner whatsapp={business.whatsapp} />
    </>
  );
}
