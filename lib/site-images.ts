/**
 * Admin-managed site image slots.
 * Default paths are used when no override is stored in DB.
 */

import type { PrismaClient } from "@prisma/client";

export const SITE_IMAGE_SLOT_KEYS = [
  "services_page_large_format",
  "services_page_3d",
  "about_hero_background",
  "about_card_01",
  "about_card_02",
  "about_card_03",
  "marketing_services_large_format",
  "marketing_services_3d",
] as const;

export type SiteImageSlotKey = (typeof SITE_IMAGE_SLOT_KEYS)[number];

/** Default image path per slot (used when DB has no override). */
export const SITE_IMAGE_DEFAULTS: Record<SiteImageSlotKey, string> = {
  services_page_large_format: "/images/services/large-format-hero.webp",
  services_page_3d: "/images/services/3d-printing-hero.webp",
  about_hero_background: "/images/about/production-floor.webp",
  about_card_01: "/images/services/large-format-hero.webp",
  about_card_02: "/images/services/3d-printing-hero.webp",
  about_card_03: "/images/services/3d-objects.webp",
  marketing_services_large_format: "/images/services/large-format-hero.webp",
  marketing_services_3d: "/images/services/3d-printing-hero.webp",
};

/** Labels and descriptions for admin UI. */
export const SITE_IMAGE_SLOT_META: Record<
  SiteImageSlotKey,
  { label: string; description: string }
> = {
  services_page_large_format: {
    label: "Services page — Large Format card",
    description: "Main image on the Large Format Printing card (/services)",
  },
  services_page_3d: {
    label: "Services page — 3D Printing card",
    description: "Main image on the 3D Printing card (/services)",
  },
  about_hero_background: {
    label: "About page — Hero background",
    description: "Faded background behind “We Make Things That Get Noticed”",
  },
  about_card_01: {
    label: "About page — Card 01 (Large Format)",
    description: "Image for “Large Format Printing” in “Three Ways We Can Help You”",
  },
  about_card_02: {
    label: "About page — Card 02 (3D Printing)",
    description: "Image for “3D Printing” in “Three Ways We Can Help You”",
  },
  about_card_03: {
    label: "About page — Card 03 (3D Merchandise)",
    description: "Image for “3D Printed Merchandise” in “Three Ways We Can Help You”",
  },
  marketing_services_large_format: {
    label: "Homepage — Our Services (Large Format)",
    description: "First card in “Our Services” on the homepage",
  },
  marketing_services_3d: {
    label: "Homepage — Our Services (3D Printing)",
    description: "Second card in “Our Services” on the homepage",
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
