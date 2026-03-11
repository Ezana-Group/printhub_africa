import { Hero } from "@/components/marketing/hero";
import { ServicesOverview } from "@/components/marketing/services-overview";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { FeaturedProducts } from "@/components/marketing/featured-products";
import { WhyPrintHub } from "@/components/marketing/why-printhub";
import { PriceCalculatorTeaser } from "@/components/marketing/price-calculator-teaser";
import { CTABanner } from "@/components/marketing/cta-banner";
import { getBusinessPublic } from "@/lib/business-public";

export default async function HomePage() {
  const business = await getBusinessPublic();
  return (
    <>
      <Hero />
      <ServicesOverview />
      <HowItWorks />
      <FeaturedProducts />
      <PriceCalculatorTeaser />
      <WhyPrintHub city={business.city} businessName={business.businessName} />
      <CTABanner whatsapp={business.whatsapp} />
    </>
  );
}
