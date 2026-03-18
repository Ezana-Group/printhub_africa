import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";

const patchSchema = z.object({
  sortOrder: z.number().int().min(0).optional(),
  subtitle: z.string().nullable().optional(),
  headline: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  imagePath: z.string().nullable().optional(),
});

/** PATCH: Update a slide. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const slide = await prisma.authPanelSlide.update({
    where: { id },
    data: {
      ...(parsed.data.sortOrder !== undefined && { sortOrder: parsed.data.sortOrder }),
      ...(parsed.data.subtitle !== undefined && { subtitle: parsed.data.subtitle }),
      ...(parsed.data.headline !== undefined && { headline: parsed.data.headline }),
      ...(parsed.data.body !== undefined && { body: parsed.data.body }),
      ...(parsed.data.imagePath !== undefined && { imagePath: parsed.data.imagePath }),
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

/** DELETE: Remove a slide. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  await prisma.authPanelSlide.delete({ where: { id } });

  revalidatePath("/login");
  revalidatePath("/register");

  return new NextResponse(null, { status: 204 });
}
