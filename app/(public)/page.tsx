import { Hero } from "@/components/marketing/hero";
import { ServicesOverview } from "@/components/marketing/services-overview";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { FeaturedProducts } from "@/components/marketing/featured-products";
import { WhyPrintHub } from "@/components/marketing/why-printhub";
import { PriceCalculatorTeaser } from "@/components/marketing/price-calculator-teaser";
import { CTABanner } from "@/components/marketing/cta-banner";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesOverview />
      <HowItWorks />
      <FeaturedProducts />
      <PriceCalculatorTeaser />
      <WhyPrintHub />
      <CTABanner />
    </>
  );
}
