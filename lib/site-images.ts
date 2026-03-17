/**
 * Admin-managed site image slots.
 * Default paths are used when no override is stored in DB.
 */

import type { PrismaClient } from "@prisma/client";

/** Tab id for grouping in admin UI. */
export type SiteImageTabId = "services" | "about" | "homepage";

export const SITE_IMAGE_SLOT_KEYS = [
  "services_page_large_format",
  "services_page_3d",
  "about_hero_background",
  "about_story_image",
  "about_card_01",
  "about_card_02",
  "about_card_03",
  "about_location_background",
  "marketing_hero",
  "marketing_services_large_format",
  "marketing_services_3d",
  "how_it_works_step_01",
  "how_it_works_step_02",
  "how_it_works_step_03",
  "how_it_works_step_04",
] as const;

export type SiteImageSlotKey = (typeof SITE_IMAGE_SLOT_KEYS)[number];

/** Default image path per slot (used when DB has no override). */
export const SITE_IMAGE_DEFAULTS: Record<SiteImageSlotKey, string> = {
  services_page_large_format: "/images/services/large-format-hero.webp",
  services_page_3d: "/images/services/3d-printing-hero.webp",
  about_hero_background: "/images/about/production-floor.webp",
  about_story_image: "/images/about/production-floor.webp",
  about_card_01: "/images/services/large-format-hero.webp",
  about_card_02: "/images/services/3d-printing-hero.webp",
  about_card_03: "/images/services/3d-objects.webp",
  about_location_background: "/images/about/nairobi.webp",
  marketing_hero: "/images/hero/hero-main.webp",
  marketing_services_large_format: "/images/services/large-format-hero.webp",
  marketing_services_3d: "/images/services/3d-printing-hero.webp",
  how_it_works_step_01: "/images/how-it-works/step1-design.webp",
  how_it_works_step_02: "/images/how-it-works/step2-quote.webp",
  how_it_works_step_03: "/images/how-it-works/step3-payment.webp",
  how_it_works_step_04: "/images/how-it-works/step4-delivery.webp",
};

/** Labels, descriptions, and tab for admin UI. */
export const SITE_IMAGE_SLOT_META: Record<
  SiteImageSlotKey,
  { label: string; description: string; tab: SiteImageTabId }
> = {
  services_page_large_format: {
    label: "Large Format card",
    description: "Main image on the Large Format Printing card (/services)",
    tab: "services",
  },
  services_page_3d: {
    label: "3D Printing card",
    description: "Main image on the 3D Printing card (/services)",
    tab: "services",
  },
  about_hero_background: {
    label: "Hero background",
    description: "Faded background behind “We Make Things That Get Noticed”",
    tab: "about",
  },
  about_story_image: {
    label: "Our Story image",
    description: "Image in “Built for Makers. Built for Kenya.” section",
    tab: "about",
  },
  about_card_01: {
    label: "Card 01 (Large Format)",
    description: "“Large Format Printing” in “Three Ways We Can Help You”",
    tab: "about",
  },
  about_card_02: {
    label: "Card 02 (3D Printing)",
    description: "“3D Printing” in “Three Ways We Can Help You”",
    tab: "about",
  },
  about_card_03: {
    label: "Card 03 (3D Merchandise)",
    description: "“3D Printed Merchandise” in “Three Ways We Can Help You”",
    tab: "about",
  },
  about_location_background: {
    label: "Location section background",
    description: "Faded background in “Come See Us” section",
    tab: "about",
  },
  marketing_hero: {
    label: "Hero background",
    description: "Full-width hero image behind “Print Anything. Deliver Everywhere.”",
    tab: "homepage",
  },
  marketing_services_large_format: {
    label: "Our Services — Large Format",
    description: "First card in “Our Services” on the homepage",
    tab: "homepage",
  },
  marketing_services_3d: {
    label: "Our Services — 3D Printing",
    description: "Second card in “Our Services” on the homepage",
    tab: "homepage",
  },
  how_it_works_step_01: {
    label: "How it Works — Step 1 (Choose or upload)",
    description: "Image for “Choose or upload” in How it Works section",
    tab: "homepage",
  },
  how_it_works_step_02: {
    label: "How it Works — Step 2 (Get a quote)",
    description: "Image for “Get a quote” in How it Works section",
    tab: "homepage",
  },
  how_it_works_step_03: {
    label: "How it Works — Step 3 (Pay securely)",
    description: "Image for “Pay securely” in How it Works section",
    tab: "homepage",
  },
  how_it_works_step_04: {
    label: "How it Works — Step 4 (We print & deliver)",
    description: "Image for “We print & deliver” in How it Works section",
    tab: "homepage",
  },
};

export type SiteImageSlotsMap = Record<SiteImageSlotKey, string>;

/**
 * Returns current image path for each slot (DB override or default).
 * Use in server components / API that need to resolve slot → path.
 */
export async function getSiteImageSlots(
  prisma: PrismaClient
): Promise<SiteImageSlotsMap> {
  const rows = await prisma.siteImageSlot.findMany({
    where: { key: { in: [...SITE_IMAGE_SLOT_KEYS] } },
    select: { key: true, imagePath: true },
  });
  const overrides = Object.fromEntries(
    rows
      .filter((r) => r.imagePath != null && r.imagePath.trim() !== "")
      .map((r) => [r.key as SiteImageSlotKey, r.imagePath!])
  );
  const result = { ...SITE_IMAGE_DEFAULTS };
  for (const k of SITE_IMAGE_SLOT_KEYS) {
    if (overrides[k]) result[k] = overrides[k];
  }
  return result;
}
