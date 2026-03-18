import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { getAuthPanelForPublic } from "@/lib/auth-panel";

const patchConfigSchema = z.object({
  backgroundColor: z.string().nullable().optional(),
  backgroundImagePath: z.string().nullable().optional(),
  carouselIntervalSeconds: z.number().int().min(0).max(60).nullable().optional(),
});

/** GET: Return config + slides for admin editing. */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const panel = await getAuthPanelForPublic(prisma);
  const configRow = await prisma.authPanelConfig.findUnique({
    where: { id: "default" },
  });
  const slides = await prisma.authPanelSlide.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({
    config: {
      backgroundColor: configRow?.backgroundColor ?? panel.backgroundColor,
      backgroundImagePath: configRow?.backgroundImagePath ?? null,
      carouselIntervalSeconds:
        configRow?.carouselIntervalSeconds ?? panel.carouselIntervalSeconds,
      updatedAt: configRow?.updatedAt?.toISOString() ?? null,
    },
    slides: slides.map((s) => ({
      id: s.id,
      sortOrder: s.sortOrder,
      subtitle: s.subtitle,
      headline: s.headline,
      body: s.body,
      imagePath: s.imagePath,
      updatedAt: s.updatedAt.toISOString(),
    })),
  });
}

/** PATCH: Update panel config. */
export async function PATCH(req: NextRequest) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => ({}));
  const parsed = patchConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const config = await prisma.authPanelConfig.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      backgroundColor: (data.backgroundColor ?? "#E84A0C").trim() || "#E84A0C",
      backgroundImagePath: data.backgroundImagePath ?? undefined,
      carouselIntervalSeconds: data.carouselIntervalSeconds ?? 5,
    },
    update: {
      ...(data.backgroundColor !== undefined && {
        backgroundColor: data.backgroundColor ?? null,
      }),
      ...(data.backgroundImagePath !== undefined && {
        backgroundImagePath: data.backgroundImagePath ?? null,
      }),
      ...(data.carouselIntervalSeconds !== undefined && {
        carouselIntervalSeconds: data.carouselIntervalSeconds ?? 5,
      }),
    },
  });

  revalidatePath("/login");
  revalidatePath("/register");

  return NextResponse.json({
    backgroundColor: config.backgroundColor,
    backgroundImagePath: config.backgroundImagePath,
    carouselIntervalSeconds: config.carouselIntervalSeconds,
    updatedAt: config.updatedAt.toISOString(),
  });
}
