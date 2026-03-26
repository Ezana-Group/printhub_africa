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
  whatsappNumber: null,
  whatsappMessage: null,
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
};

/** Metadata-only cache for root layout (favicon, title, OG). Revalidate with tag 'business'. */
export type BusinessMetadata = {
  favicon: string | null;
  updatedAt: Date | null;
  businessName: string;
  tagline: string | null;
  logo: string | null;
  seo?: {
    siteName: string | null;
    titleTemplate: string | null;
    defaultTitle: string | null;
    defaultDescription: string | null;
    ogImageUrl: string | null;
  } | null;
};

export const getCachedBusinessMetadata = unstable_cache(
  async () => {
    const [row, seo] = await Promise.all([
      prisma.businessSettings.findUnique({
        where: { id: "default" },
        select: { favicon: true, updatedAt: true, businessName: true, tagline: true, logo: true },
      }),
      prisma.seoSettings.findUnique({
        where: { id: "default" },
      }),
    ]).catch(() => [null, null]);

    if (!row)
      return { favicon: null, updatedAt: null, businessName: "PrintHub", tagline: null, logo: null, seo: null };

    return {
      favicon: row.favicon ?? null,
      updatedAt: row.updatedAt,
      businessName: row.businessName ?? "PrintHub",
      tagline: row.tagline ?? null,
      logo: row.logo ?? null,
      seo: seo ? {
        siteName: seo.siteName,
        titleTemplate: seo.titleTemplate,
        defaultTitle: seo.defaultTitle,
        defaultDescription: seo.defaultDescription,
        ogImageUrl: seo.ogImageUrl,
      } : null,
    };
  },
  ["business-metadata"],
  { revalidate: 300, tags: ["homepage", "business"] }
);

/** Cross-request cache for business settings. Call revalidateTag('homepage') when business settings change. */
export const getCachedBusinessPublic = unstable_cache(
  async (): Promise<BusinessPublic> => {
    let row;
    let notificationsRaw;
    try {
      [row, notificationsRaw] = await Promise.all([
        prisma.businessSettings.findUnique({
          where: { id: "default" },
        }),
        prisma.pricingConfig.findUnique({
          where: { key: "adminSettings:notifications" },
        }),
      ]);
    } catch (e) {
      console.error("getCachedBusinessPublic error:", e);
      return DEFAULTS;
    }

    let whatsappNumber = null;
    let whatsappMessage = null;

    if (notificationsRaw?.valueJson) {
      try {
        const parsed = JSON.parse(notificationsRaw.valueJson);
        whatsappNumber = parsed.whatsappNumber || null;
        whatsappMessage = parsed.whatsappMessage || null;
      } catch (e) {
        console.error("Error parsing notifications settings:", e);
      }
    }

    if (!row) return { ...DEFAULTS, whatsappNumber, whatsappMessage };

    return {
      businessName: row.businessName ?? DEFAULTS.businessName,
      tradingName: row.tradingName ?? DEFAULTS.tradingName,
      tagline: row.tagline ?? DEFAULTS.tagline,
      website: row.website ?? DEFAULTS.website,
      logo: row.logo ?? null,
      favicon: row.favicon ?? null,
      primaryPhone: row.primaryPhone ?? null,
      whatsapp: row.whatsapp ?? null,
      whatsappNumber: whatsappNumber ?? row.whatsapp ?? null,
      whatsappMessage: whatsappMessage ?? null,
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
      hoursWeekdays: row.hoursWeekdays ?? null,
      hoursSaturday: row.hoursSaturday ?? null,
      hoursSunday: row.hoursSunday ?? null,
      hoursHolidays: row.hoursHolidays ?? null,
      socialFacebook: row.socialFacebook ?? null,
      socialInstagram: row.socialInstagram ?? null,
      socialTwitter: row.socialTwitter ?? null,
      socialLinkedIn: row.socialLinkedIn ?? null,
      socialTikTok: row.socialTikTok ?? null,
      socialYouTube: row.socialYouTube ?? null,
      showStatsOrders: row.showStatsOrders ?? false,
      showStatsClients: row.showStatsClients ?? false,
      showStatsExperience: row.showStatsExperience ?? false,
      showStatsMachines: row.showStatsMachines ?? false,
      showStatsStaff: row.showStatsStaff ?? false,
    };
  },
  ["business-public"],
  { revalidate: 300, tags: ["homepage", "business"] }
);

export type PublicTeamMember = {
  id: string;
  publicName: string | null;
  name: string | null;
  publicRole: string | null;
  publicBio: string | null;
  profilePhotoUrl: string | null;
  aboutPageOrder: number;
};

/** Team members shown on /about. Revalidate with tag 'team-members' when staff public profile changes. */
export const getCachedPublicTeamMembers = unstable_cache(
  async (): Promise<PublicTeamMember[]> => {
    const staff = await prisma.staff.findMany({
      where: {
        showOnAboutPage: true,
        user: { status: "ACTIVE" },
      },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { aboutPageOrder: "asc" },
    });
    return staff.map((s) => ({
      id: s.userId,
      publicName: s.publicName,
      name: s.user.name,
      publicRole: s.publicRole,
      publicBio: s.publicBio,
      profilePhotoUrl: s.profilePhotoUrl,
      aboutPageOrder: s.aboutPageOrder,
    }));
  },
  ["team-members"],
  { revalidate: 300, tags: ["team-members"] }
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
