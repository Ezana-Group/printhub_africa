/**
 * Admin-managed site image slots.
 * Default paths are used when no override is stored in DB.
 */

import type { PrismaClient } from "@prisma/client";

/** Tab id for grouping in admin UI. */
export type SiteImageTabId = "services" | "about" | "homepage" | "catalogue";

export const SITE_IMAGE_SLOT_KEYS = [
  "services_page_large_format",
  "services_page_3d",
  // /services/large-format-printing
  "service_large_format_hero",
  "service_large_format_capabilities",
  "service_large_format_applications_01",
  "service_large_format_applications_02",
  "service_large_format_material_outdoor_vinyl",
  "service_large_format_material_cast_vinyl",
  "service_large_format_material_backlit_film",
  "service_large_format_material_canvas",
  "service_large_format_material_mesh",
  "service_large_format_material_fabric",
  // /services/3d-printing
  "service_3d_hero",
  "service_3d_what_is",
  "service_3d_fdm_image",
  "service_3d_resin_image",
  "service_3d_file_requirements",
  "service_3d_cta_background",
  "service_3d_material_pla",
  "service_3d_material_pla_plus",
  "service_3d_material_petg",
  "service_3d_material_abs",
  "service_3d_material_tpu",
  "service_3d_material_resin",
  "service_3d_material_nylon",
  "service_3d_application_01",
  "service_3d_application_02",
  "service_3d_application_03",
  "service_3d_application_04",
  "service_3d_application_05",
  "service_3d_application_06",
  "service_3d_application_07",
  "service_3d_application_08",
  // Catalogue categories (/catalogue)
  "catalogue_category_home_decor",
  "catalogue_category_phone_tech",
  "catalogue_category_toys_games",
  "catalogue_category_tools",
  "catalogue_category_jewellery",
  "catalogue_category_education",
  "catalogue_category_office_desk",
  "catalogue_category_kenya_collection",
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
  service_large_format_hero: "/images/services/large-format-hero.webp",
  service_large_format_capabilities: "/images/services/large-format-hero.webp",
  service_large_format_applications_01: "/images/services/event-backdrop.webp",
  service_large_format_applications_02: "/images/services/rollup-banner.webp",
  service_large_format_material_outdoor_vinyl: "/images/services/banner-outdoor.webp",
  service_large_format_material_cast_vinyl: "/images/services/vehicle-wrap.webp",
  service_large_format_material_backlit_film: "/images/services/event-backdrop.webp",
  service_large_format_material_canvas: "/images/services/large-format-hero.webp",
  service_large_format_material_mesh: "/images/services/banner-outdoor.webp",
  service_large_format_material_fabric: "/images/services/event-backdrop.webp",
  service_3d_hero: "/images/services/3d-printing-hero.webp",
  service_3d_what_is: "/images/services/3d-objects.webp",
  service_3d_fdm_image: "/images/services/3d-nozzle.webp",
  service_3d_resin_image: "/images/services/3d-objects.webp",
  service_3d_file_requirements: "/images/services/3d-nozzle.webp",
  service_3d_cta_background: "/images/services/3d-printing-hero.webp",
  service_3d_material_pla: "/images/services/3d-objects.webp",
  service_3d_material_pla_plus: "/images/services/3d-objects.webp",
  service_3d_material_petg: "/images/services/3d-nozzle.webp",
  service_3d_material_abs: "/images/services/3d-prototype.webp",
  service_3d_material_tpu: "/images/services/3d-objects.webp",
  service_3d_material_resin: "/images/services/3d-printing-hero.webp",
  service_3d_material_nylon: "/images/services/3d-objects.webp",
  service_3d_application_01: "/images/services/3d-prototype.webp",
  service_3d_application_02: "/images/services/3d-objects.webp",
  service_3d_application_03: "/images/catalogue/category-jewellery.webp",
  service_3d_application_04: "/images/catalogue/category-education.webp",
  service_3d_application_05: "/images/services/3d-objects.webp",
  service_3d_application_06: "/images/products/product-placeholder.webp",
  service_3d_application_07: "/images/services/3d-prototype.webp",
  service_3d_application_08: "/images/products/3d-figurine.webp",
  catalogue_category_home_decor: "/images/catalogue/category-home-decor.webp",
  catalogue_category_phone_tech: "/images/catalogue/category-phone-tech.webp",
  catalogue_category_toys_games: "/images/catalogue/category-toys.webp",
  catalogue_category_tools: "/images/catalogue/category-tools.webp",
  catalogue_category_jewellery: "/images/catalogue/category-jewellery.webp",
  catalogue_category_education: "/images/catalogue/category-education.webp",
  catalogue_category_office_desk: "/images/catalogue/category-office.webp",
  catalogue_category_kenya_collection: "/images/catalogue/category-kenya.webp",
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
  { label: string; description: string; tab: SiteImageTabId; group?: string }
> = {
  services_page_large_format: {
    label: "Large Format card",
    description: "Main image on the Large Format Printing card (/services)",
    tab: "services",
    group: "Overview",
  },
  services_page_3d: {
    label: "3D Printing card",
    description: "Main image on the 3D Printing card (/services)",
    tab: "services",
    group: "Overview",
  },
  service_large_format_hero: {
    label: "Hero image",
    description: "Hero image on Large Format Printing service page (/services/large-format-printing)",
    tab: "services",
    group: "Large Format Printing",
  },
  service_large_format_capabilities: {
    label: "Capabilities image",
    description: "Image in “Precision at Every Scale” section (/services/large-format-printing)",
    tab: "services",
    group: "Large Format Printing",
  },
  service_large_format_applications_01: {
    label: "Applications image 01",
    description: "First supporting image in Applications section (/services/large-format-printing)",
    tab: "services",
    group: "Large Format Printing",
  },
  service_large_format_applications_02: {
    label: "Applications image 02",
    description: "Second supporting image in Applications section (/services/large-format-printing)",
    tab: "services",
    group: "Large Format Printing",
  },
  service_large_format_material_outdoor_vinyl: {
    label: "Material — Outdoor Vinyl",
    description: "Outdoor Vinyl material card image (/services/large-format-printing)",
    tab: "services",
    group: "Large Format Printing",
  },
  service_large_format_material_cast_vinyl: {
    label: "Material — Cast Vinyl",
    description: "Cast Vinyl material card image (/services/large-format-printing)",
    tab: "services",
    group: "Large Format Printing",
  },
  service_large_format_material_backlit_film: {
    label: "Material — Backlit Film",
    description: "Backlit Film material card image (/services/large-format-printing)",
    tab: "services",
    group: "Large Format Printing",
  },
  service_large_format_material_canvas: {
    label: "Material — Canvas",
    description: "Canvas material card image (/services/large-format-printing)",
    tab: "services",
    group: "Large Format Printing",
  },
  service_large_format_material_mesh: {
    label: "Material — Mesh Banner",
    description: "Mesh Banner material card image (/services/large-format-printing)",
    tab: "services",
    group: "Large Format Printing",
  },
  service_large_format_material_fabric: {
    label: "Material — Fabric / Dye-Sub",
    description: "Fabric material card image (/services/large-format-printing)",
    tab: "services",
    group: "Large Format Printing",
  },
  service_3d_hero: {
    label: "Hero image",
    description: "Hero image on 3D Printing service page (/services/3d-printing)",
    tab: "services",
    group: "3D Printing",
  },
  service_3d_what_is: {
    label: "What is 3D Printing image",
    description: "Main image in “What is 3D Printing” section (/services/3d-printing)",
    tab: "services",
    group: "3D Printing",
  },
  service_3d_fdm_image: {
    label: "FDM card image",
    description: "Image in the FDM Printing card (/services/3d-printing)",
    tab: "services",
    group: "3D Printing",
  },
  service_3d_resin_image: {
    label: "Resin card image",
    description: "Image in the Resin (MSLA/SLA) card (/services/3d-printing)",
    tab: "services",
    group: "3D Printing",
  },
  service_3d_file_requirements: {
    label: "File requirements image",
    description: "Image in “Getting Your File Ready” section (/services/3d-printing)",
    tab: "services",
    group: "3D Printing",
  },
  service_3d_cta_background: {
    label: "CTA background image",
    description: "Background image behind the final CTA section (/services/3d-printing)",
    tab: "services",
    group: "3D Printing",
  },
  service_3d_material_pla: {
    label: "Material — PLA",
    description: "PLA material card image (/services/3d-printing)",
    tab: "services",
    group: "3D Printing",
  },
  service_3d_material_pla_plus: {
    label: "Material — PLA+",
    description: "PLA+ material card image (/services/3d-printing)",
    tab: "services",
    group: "3D Printing",
  },
  service_3d_material_petg: {
    label: "Material — PETG",
    description: "PETG material card image (/services/3d-printing)",
    tab: "services",
    group: "3D Printing",
  },
  service_3d_material_abs: {
    label: "Material — ABS",
    description: "ABS material card image (/services/3d-printing)",
    tab: "services",
    group: "3D Printing",
  },
  service_3d_material_tpu: {
    label: "Material — TPU",
    description: "TPU material card image (/services/3d-printing)",
    tab: "services",
    group: "3D Printing",
  },
  service_3d_material_resin: {
    label: "Material — Resin",
    description: "Resin material card image (/services/3d-printing)",
    tab: "services",
    group: "3D Printing",
  },
  service_3d_material_nylon: {
    label: "Material — Nylon",
    description: "Nylon material card image (/services/3d-printing)",
    tab: "services",
    group: "3D Printing",
  },
  service_3d_application_01: {
    label: "Application 01 image",
    description: "Applications section — Prototyping (/services/3d-printing)",
    tab: "services",
    group: "3D Printing",
  },
  service_3d_application_02: {
    label: "Application 02 image",
    description: "Applications section — Architecture (/services/3d-printing)",
    tab: "services",
    group: "3D Printing",
  },
  service_3d_application_03: {
    label: "Application 03 image",
    description: "Applications section — Jewellery (/services/3d-printing)",
    tab: "services",
    group: "3D Printing",
  },
  service_3d_application_04: {
    label: "Application 04 image",
    description: "Applications section — Education (/services/3d-printing)",
    tab: "services",
    group: "3D Printing",
  },
  service_3d_application_05: {
    label: "Application 05 image",
    description: "Applications section — Medical (/services/3d-printing)",
    tab: "services",
    group: "3D Printing",
  },
  service_3d_application_06: {
    label: "Application 06 image",
    description: "Applications section — Consumer products (/services/3d-printing)",
    tab: "services",
    group: "3D Printing",
  },
  service_3d_application_07: {
    label: "Application 07 image",
    description: "Applications section — Industrial (/services/3d-printing)",
    tab: "services",
    group: "3D Printing",
  },
  service_3d_application_08: {
    label: "Application 08 image",
    description: "Applications section — Art & culture (/services/3d-printing)",
    tab: "services",
    group: "3D Printing",
  },
  catalogue_category_home_decor: {
    label: "Category — Home decor",
    description: "Default image for Home decor category (/catalogue)",
    tab: "catalogue",
  },
  catalogue_category_phone_tech: {
    label: "Category — Phone & tech",
    description: "Default image for Phone & tech category (/catalogue)",
    tab: "catalogue",
  },
  catalogue_category_toys_games: {
    label: "Category — Toys & games",
    description: "Default image for Toys & games category (/catalogue)",
    tab: "catalogue",
  },
  catalogue_category_tools: {
    label: "Category — Tools",
    description: "Default image for Tools category (/catalogue)",
    tab: "catalogue",
  },
  catalogue_category_jewellery: {
    label: "Category — Jewellery",
    description: "Default image for Jewellery category (/catalogue)",
    tab: "catalogue",
  },
  catalogue_category_education: {
    label: "Category — Education",
    description: "Default image for Education category (/catalogue)",
    tab: "catalogue",
  },
  catalogue_category_office_desk: {
    label: "Category — Office & desk",
    description: "Default image for Office & desk category (/catalogue)",
    tab: "catalogue",
  },
  catalogue_category_kenya_collection: {
    label: "Category — Kenya collection",
    description: "Default image for Kenya collection category (/catalogue)",
    tab: "catalogue",
  },
  about_hero_background: {
    label: "Hero background",
    description: "Faded background behind “We Make Things That Get Noticed”",
    tab: "about",
  },
  about_story_image: {
    label: "Our Story image",
    description: "Image in “Built for Makers. Built for Eldoret.” section",
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
  try {
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
  } catch (err) {
    console.error("getSiteImageSlots parameter fetch failed, falling back to defaults:", err);
    return { ...SITE_IMAGE_DEFAULTS };
  }
}
