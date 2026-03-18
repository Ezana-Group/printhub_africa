import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";

const postSchema = z.object({
  sortOrder: z.number().int().min(0).optional(),
  subtitle: z.string().nullable().optional(),
  headline: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  imagePath: z.string().nullable().optional(),
});

/** GET: List all slides (ordered). */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const slides = await prisma.authPanelSlide.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(
    slides.map((s) => ({
      id: s.id,
      sortOrder: s.sortOrder,
      subtitle: s.subtitle,
      headline: s.headline,
      body: s.body,
      imagePath: s.imagePath,
      updatedAt: s.updatedAt.toISOString(),
    }))
  );
}

/** POST: Create a new slide. */
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => ({}));
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const maxOrder = await prisma.authPanelSlide
    .aggregate({ _max: { sortOrder: true } })
    .then((r) => r._max.sortOrder ?? -1);
  const sortOrder = parsed.data.sortOrder ?? maxOrder + 1;

  const slide = await prisma.authPanelSlide.create({
    data: {
      sortOrder,
      subtitle: parsed.data.subtitle ?? null,
      headline: parsed.data.headline ?? null,
      body: parsed.data.body ?? null,
      imagePath: parsed.data.imagePath ?? null,
    },
  });

  revalidatePath("/login");
  revalidatePath("/register");

  return NextResponse.json({
    id: slide.id,
    sortOrder: slide.sortOrder,
    subtitle: slide.subtitle,
    headline: slide.headline,
    body: slide.body,
    imagePath: slide.imagePath,
    updatedAt: slide.updatedAt.toISOString(),
  });
}
