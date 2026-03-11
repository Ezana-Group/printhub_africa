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
    businessHours: row.businessHours ?? "Mon–Fri 8am–6pm | Sat 9am–3pm",
    socialFacebook: row.socialFacebook,
    socialInstagram: row.socialInstagram,
    socialTwitter: row.socialTwitter,
    socialLinkedIn: row.socialLinkedIn,
    socialTikTok: row.socialTikTok,
    socialYouTube: row.socialYouTube,
  });
}
