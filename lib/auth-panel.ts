/**
 * Auth (login/register) left panel: config + slides for carousel.
 * Used by the login page and by admin Content > Login panel.
 */

import type { PrismaClient } from "@prisma/client";

export type AuthPanelSlidePublic = {
  id: string;
  sortOrder: number;
  subtitle: string | null;
  headline: string | null;
  body: string | null;
  imagePath: string | null;
};

export type AuthPanelPublic = {
  backgroundColor: string;
  backgroundImagePath: string | null;
  carouselIntervalSeconds: number;
  slides: AuthPanelSlidePublic[];
};

const DEFAULT_BACKGROUND_COLOR = "#E84A0C";
const DEFAULT_SLIDE: AuthPanelSlidePublic = {
  id: "default",
  sortOrder: 0,
  subtitle: "PrintHub for teams & creators",
  headline: "Print experiences that get noticed.",
  body: "Upload artwork, approve proofs, and track production in one place.",
  imagePath: null,
};

/**
 * Returns auth panel config + slides for public login/register page.
 * Uses defaults when DB has no config or no slides.
 */
export async function getAuthPanelForPublic(
  prisma: PrismaClient
): Promise<AuthPanelPublic> {
  const [config, slides] = await Promise.all([
    prisma.authPanelConfig.findUnique({ where: { id: "default" } }),
    prisma.authPanelSlide.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, sortOrder: true, subtitle: true, headline: true, body: true, imagePath: true },
    }),
  ]);

  const backgroundColor =
    config?.backgroundColor?.trim() || DEFAULT_BACKGROUND_COLOR;
  const backgroundImagePath = config?.backgroundImagePath?.trim() || null;
  const carouselIntervalSeconds =
    config?.carouselIntervalSeconds != null && config.carouselIntervalSeconds >= 0
      ? config.carouselIntervalSeconds
      : 5;

  const slideList: AuthPanelSlidePublic[] =
    slides.length > 0
      ? slides.map((s) => ({
          id: s.id,
          sortOrder: s.sortOrder,
          subtitle: s.subtitle ?? null,
          headline: s.headline ?? null,
          body: s.body ?? null,
          imagePath: s.imagePath ?? null,
        }))
      : [DEFAULT_SLIDE];

  return {
    backgroundColor,
    backgroundImagePath,
    carouselIntervalSeconds,
    slides: slideList,
  };
}
