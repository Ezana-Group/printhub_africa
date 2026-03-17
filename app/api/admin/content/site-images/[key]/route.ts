import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import {
  SITE_IMAGE_SLOT_KEYS,
  SITE_IMAGE_DEFAULTS,
  SITE_IMAGE_SLOT_META,
  type SiteImageSlotKey,
} from "@/lib/site-images";

const patchSchema = z.object({
  imagePath: z.string().nullable().optional(),
  alt: z.string().nullable().optional(),
});

/** PATCH: Set or clear the image for a slot. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { key } = await params;
  if (!SITE_IMAGE_SLOT_KEYS.includes(key as SiteImageSlotKey)) {
    return NextResponse.json({ error: "Unknown slot key" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const imagePath =
    parsed.data.imagePath !== undefined
      ? (parsed.data.imagePath === null || parsed.data.imagePath === ""
          ? null
          : String(parsed.data.imagePath).trim())
      : undefined;
  const alt =
    parsed.data.alt !== undefined
      ? (parsed.data.alt === null || parsed.data.alt === "" ? null : String(parsed.data.alt).trim())
      : undefined;

  const meta = SITE_IMAGE_SLOT_META[key as SiteImageSlotKey];
  const slot = await prisma.siteImageSlot.upsert({
    where: { key },
    create: {
      key,
      label: meta.label,
      description: meta.description,
      imagePath: imagePath ?? undefined,
      alt: alt ?? undefined,
    },
    update: {
      ...(imagePath !== undefined && { imagePath }),
      ...(alt !== undefined && { alt }),
    },
  });

  const currentPath = slot.imagePath?.trim() || SITE_IMAGE_DEFAULTS[key as SiteImageSlotKey];
  return NextResponse.json({
    key: slot.key,
    imagePath: currentPath,
    isOverridden: !!slot.imagePath?.trim(),
    updatedAt: slot.updatedAt.toISOString(),
  });
}
