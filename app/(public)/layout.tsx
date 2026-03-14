import type { Metadata } from "next";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { CookieBanner } from "@/components/CookieBanner";
import { TawkTo } from "@/components/TawkTo";
import { getCachedBusinessPublic, getCachedBusinessMetadata } from "@/lib/cache/unstable-cache";

// Revalidate every 5 min so public pages can be cached (TTFB optimisation)
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const meta = await getCachedBusinessMetadata();
  const faviconUrl =
    meta.favicon && meta.updatedAt
      ? `${meta.favicon}?v=${new Date(meta.updatedAt).getTime()}`
      : meta.favicon ?? null;
  return {
    icons: faviconUrl
      ? {
          icon: [{ url: faviconUrl, sizes: "any" }, { url: faviconUrl, type: "image/png", sizes: "32x32" }],
          apple: [{ url: faviconUrl, sizes: "180x180" }],
          shortcut: [{ url: faviconUrl }],
        }
      : undefined,
  };
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const business = await getCachedBusinessPublic();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa";
  const address = [business.address1, business.city, business.county, business.country].filter(Boolean).join(", ") || undefined;
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.businessName,
    description: business.tagline,
    url: baseUrl,
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
      <Header business={business} />
      <main id="main-content" className="min-h-[calc(100vh-8rem)]">{children}</main>
      <Footer business={business} />
      <WhatsAppFloat whatsapp={business.whatsapp} />
      <CookieBanner />
      <TawkTo />
    </>
  );
}
