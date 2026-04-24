import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Public (unauthenticated) read-only endpoint for site-wide business info:
 * identity, contact, location, social. No payment/invoice settings.
 */
export async function GET() {
  const row = await prisma.businessSettings.findUnique({
    where: { id: "default" },
  });
  if (!row) {
    return NextResponse.json({
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
      city: "Nairobi",
      county: "Nairobi County",
      country: "Kenya",
      googleMapsUrl: null,
      foundingDate: null,
      registrationInfo: "Registered Business in Kenya",
      parentCompany: "Ezana Group",
      supportResponseTime: "Within 2 hours during business hours",
      qualityRating: "4.8/5 from 500+ customers",
      qualityChecks: "Every order inspected",
      materialsInfo: "Premium, certified suppliers",
      warrantyInfo: "30-day satisfaction guarantee",
      returnPolicyInfo: "Hassle-free returns",
      businessHours: "Mon–Fri 8am–6pm | Sat 9am–3pm",
      socialFacebook: null,
      socialInstagram: null,
      socialTwitter: null,
      socialLinkedIn: null,
      socialTikTok: null,
      socialYouTube: null,
    });
  }
  return NextResponse.json({
    businessName: row.businessName ?? "PrintHub",
    tradingName: row.tradingName ?? "PrintHub (An Ezana Group Company)",
    tagline: row.tagline ?? "Printing the Future, Made in Kenya",
    website: row.website ?? "printhub.africa",
    logo: row.logo ?? null,
    favicon: row.favicon ?? null,
    primaryPhone: row.primaryPhone,
    whatsapp: row.whatsapp,
    primaryEmail: row.primaryEmail ?? "hello@printhub.africa",
    supportEmail: row.supportEmail ?? "support@printhub.africa",
    financeEmail: row.financeEmail ?? "finance@printhub.africa",
    address1: row.address1,
    address2: row.address2,
    city: row.city ?? "Nairobi",
    county: row.county ?? "Nairobi County",
    country: row.country ?? "Kenya",
    googleMapsUrl: row.googleMapsUrl,
    foundingDate: row.foundingDate ? row.foundingDate.toISOString() : null,
    registrationInfo: row.registrationInfo ?? "Registered Business in Kenya",
    parentCompany: row.parentCompany ?? "Ezana Group",
    supportResponseTime: row.supportResponseTime ?? "Within 2 hours during business hours",
    qualityRating: row.qualityRating ?? "4.8/5 from 500+ customers",
    qualityChecks: row.qualityChecks ?? "Every order inspected",
    materialsInfo: row.materialsInfo ?? "Premium, certified suppliers",
    warrantyInfo: row.warrantyInfo ?? "30-day satisfaction guarantee",
    returnPolicyInfo: row.returnPolicyInfo ?? "Hassle-free returns",
    businessHours: row.businessHours ?? "Mon–Fri 8am–6pm | Sat 9am–3pm",
    socialFacebook: row.socialFacebook,
    socialInstagram: row.socialInstagram,
    socialTwitter: row.socialTwitter,
    socialLinkedIn: row.socialLinkedIn,
    socialTikTok: row.socialTikTok,
    socialYouTube: row.socialYouTube,
    ga4MeasurementId: row.ga4MeasurementId,
    hotjarSiteId: row.hotjarSiteId,
    searchConsoleVerification: row.searchConsoleVerification,
    algoliaEnabled: row.algoliaEnabled ?? false,
  });
}
