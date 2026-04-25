import type { Metadata } from "next";
import Script from "next/script";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { EmailVerificationBanner } from "@/components/layout/email-verification-banner";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { CookieBanner } from "@/components/CookieBanner";
import { TawkTo } from "@/components/TawkTo";
import { getCachedBusinessPublic, getCachedBusinessMetadata } from "@/lib/cache/unstable-cache";
import { getServiceFlags } from "@/lib/service-flags";
import type { BusinessPublic } from "@/lib/business-public";

export const dynamic = "force-dynamic"; // no DB at Docker build — render at request time
// Revalidate every 5 min so public pages can be cached (TTFB optimisation)
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  try {
    const meta = await getCachedBusinessMetadata();
    const updatedAtTime = meta.updatedAt ? new Date(meta.updatedAt).getTime() : 0;
    const faviconHref =
      meta.favicon
        ? `${meta.favicon}?v=${updatedAtTime}`
        : null;
    return {
      icons: faviconHref
        ? {
            icon: [{ url: faviconHref, sizes: "any" }, { url: faviconHref, type: "image/png", sizes: "32x32" }],
            apple: [{ url: faviconHref, sizes: "180x180" }],
            shortcut: [{ url: faviconHref }],
          }
        : undefined,
    };
  } catch (error) {
    console.error("[public-layout-metadata] Falling back to defaults:", error);
    return {};
  }
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fallbackBusiness: BusinessPublic = {
    businessName: "PrintHub",
    tradingName: "PrintHub (An Ezana Group Company)",
    tagline: "Printing the Future, Made in Kenya",
    website: "printhub.africa",
    logo: null,
    favicon: null,
    primaryPhone: null,
    whatsapp: null,
    primaryEmail: "hello@printhub.africa",
    supportEmail: "support@printhub.africa",
    financeEmail: "finance@printhub.africa",
    address1: null,
    address2: null,
    city: "Eldoret",
    county: "Uasin Gishu County",
    country: "Kenya",
    googleMapsUrl: null,
    foundingDate: null,
    businessHours: "Mon–Fri 8am–6pm | Sat 9am–3pm",
    hoursWeekdays: null,
    hoursSaturday: null,
    hoursSunday: null,
    hoursHolidays: null,
    socialFacebook: null,
    socialInstagram: null,
    socialTwitter: null,
    socialLinkedIn: null,
    socialTikTok: null,
    socialYouTube: null,
    showStatsOrders: false,
    showStatsClients: false,
    showStatsExperience: false,
    showStatsMachines: false,
    showStatsStaff: false,
    whatsappFloatingButton: true,
    whatsappPrefilledMessage: "Hi, I'd like to enquire about your printing services.",
  };
  let business = fallbackBusiness;
  let largeFormatEnabled = false;
  try {
    const [businessData, flags] = await Promise.all([
      getCachedBusinessPublic(),
      getServiceFlags(),
    ]);
    business = businessData;
    largeFormatEnabled = flags.largeFormatEnabled;
  } catch (error) {
    console.error("[public-layout] Falling back to defaults:", error);
  }
  const siteOriginHref = process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa";
  const analyticsScriptUrl = process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT_URL;
  const address = [business.address1, business.city, business.county, business.country].filter(Boolean).join(", ") || undefined;
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.businessName,
    description: business.tagline,
    url: siteOriginHref,
    telephone: business.primaryPhone ?? undefined,
    email: business.primaryEmail,
    address: address
      ? {
          "@type": "PostalAddress",
          streetAddress: business.address1 ?? undefined,
          addressLocality: business.city,
          addressRegion: business.county,
          addressCountry: business.country,
        }
      : undefined,
    openingHoursSpecification: business.businessHours
      ? { "@type": "OpeningHoursSpecification", description: business.businessHours }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <AnnouncementBar business={business} />
      <Header business={business} largeFormatEnabled={largeFormatEnabled} />
      <EmailVerificationBanner />
      <main id="main-content" className="min-h-[calc(100vh-8rem)]">{children}</main>
      <Footer business={business} largeFormatEnabled={largeFormatEnabled} />
      <WhatsAppFloat 
        whatsapp={business.whatsapp} 
        message={business.whatsappPrefilledMessage}
        visible={business.whatsappFloatingButton}
      />
      <CookieBanner />
      {analyticsScriptUrl ? (
        <Script
          defer
          data-domain="printhub.africa"
          src={analyticsScriptUrl}
          strategy="lazyOnload"
        />
      ) : null}
      <TawkTo />
    </>
  );
}
