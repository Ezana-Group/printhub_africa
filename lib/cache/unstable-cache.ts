import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { BusinessPublic } from "@/lib/business-public";

const DEFAULTS: BusinessPublic = {
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
  businessHours: "Mon–Fri 8am–6pm | Sat 9am–3pm",
  socialFacebook: null,
  socialInstagram: null,
  socialTwitter: null,
  socialLinkedIn: null,
  socialTikTok: null,
  socialYouTube: null,
};

/** Cross-request cache for business settings. Call revalidateTag('homepage') when business settings change. */
export const getCachedBusinessPublic = unstable_cache(
  async (): Promise<BusinessPublic> => {
    const row = await prisma.businessSettings.findUnique({
      where: { id: "default" },
    }).catch(() => null);
    if (!row) return DEFAULTS;
    return {
      businessName: row.businessName ?? DEFAULTS.businessName,
      tradingName: row.tradingName ?? DEFAULTS.tradingName,
      tagline: row.tagline ?? DEFAULTS.tagline,
      website: row.website ?? DEFAULTS.website,
      logo: row.logo ?? null,
      favicon: row.favicon ?? null,
      primaryPhone: row.primaryPhone ?? null,
      whatsapp: row.whatsapp ?? null,
      primaryEmail: row.primaryEmail ?? DEFAULTS.primaryEmail,
      supportEmail: row.supportEmail ?? DEFAULTS.supportEmail,
      financeEmail: row.financeEmail ?? DEFAULTS.financeEmail,
      address1: row.address1 ?? null,
      address2: row.address2 ?? null,
      city: row.city ?? DEFAULTS.city,
      county: row.county ?? DEFAULTS.county,
      country: row.country ?? DEFAULTS.country,
      googleMapsUrl: row.googleMapsUrl ?? null,
      businessHours: row.businessHours ?? DEFAULTS.businessHours,
      socialFacebook: row.socialFacebook ?? null,
      socialInstagram: row.socialInstagram ?? null,
      socialTwitter: row.socialTwitter ?? null,
      socialLinkedIn: row.socialLinkedIn ?? null,
      socialTikTok: row.socialTikTok ?? null,
      socialYouTube: row.socialYouTube ?? null,
    };
  },
  ["business-public"],
  { revalidate: 300, tags: ["homepage", "business"] }
);

/** Categories for nav/shop. Revalidate when categories change. */
export const getCachedCategories = unstable_cache(
  async () => {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  },
  ["categories"],
  { revalidate: 3600, tags: ["categories"] }
);

/** Featured products for homepage. Revalidate when products change. */
export const getCachedFeaturedProducts = unstable_cache(
  async () => {
    return prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: {
        productImages: { orderBy: { sortOrder: "asc" } },
      },
      take: 8,
      orderBy: { createdAt: "desc" },
    });
  },
  ["featured-products"],
  { revalidate: 300, tags: ["products", "homepage"] }
);

/** Homepage bundle: categories, featured products, delivered count. Revalidate with tag 'homepage'. */
export const getCachedHomepageData = unstable_cache(
  async () => {
    const [categories, featuredProducts, deliveredCount] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        take: 8,
        orderBy: { sortOrder: "asc" },
      }),
      prisma.product.findMany({
        where: { isActive: true, isFeatured: true },
        include: {
          productImages: { orderBy: { sortOrder: "asc" } },
        },
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where: { status: "DELIVERED" } }),
    ]);
    return { categories, featuredProducts, stats: { deliveredCount } };
  },
  ["homepage-data"],
  { revalidate: 300, tags: ["homepage"] }
);
