import { prisma } from "@/lib/prisma";

export type BusinessPublic = {
  businessName: string;
  tradingName: string;
  tagline: string;
  website: string;
  logo: string | null;
  favicon: string | null;
  primaryPhone: string | null;
  whatsapp: string | null;
  whatsappNumber: string | null;
  whatsappMessage: string | null;
  primaryEmail: string;
  supportEmail: string;
  financeEmail: string;
  address1: string | null;
  address2: string | null;
  city: string;
  county: string;
  country: string;
  googleMapsUrl: string | null;
  businessHours: string;
  hoursWeekdays: string | null;
  hoursSaturday: string | null;
  hoursSunday: string | null;
  hoursHolidays: string | null;
  socialFacebook: string | null;
  socialInstagram: string | null;
  socialTwitter: string | null;
  socialLinkedIn: string | null;
  socialTikTok: string | null;
  socialYouTube: string | null;
  showStatsOrders: boolean;
  showStatsClients: boolean;
  showStatsExperience: boolean;
  showStatsMachines: boolean;
  showStatsStaff: boolean;
};

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
  supportEmail: "contact@printhub.africa",
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

export async function getBusinessPublic(): Promise<BusinessPublic> {
  const [row, notificationsRaw] = await Promise.all([
    prisma.businessSettings.findUnique({
      where: { id: "default" },
    }).catch(() => null),
    prisma.pricingConfig.findUnique({
      where: { key: "adminSettings:notifications" },
    }).catch(() => null),
  ]);

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
}
