import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import {
  SITE_IMAGE_SLOT_KEYS,
  SITE_IMAGE_DEFAULTS,
  SITE_IMAGE_SLOT_META,
} from "@/lib/site-images";

/** GET: List all site image slots with current path and metadata. */
export async function GET(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const slots = await prisma.siteImageSlot.findMany({
    where: { key: { in: [...SITE_IMAGE_SLOT_KEYS] } },
    select: { key: true, label: true, description: true, imagePath: true, alt: true, updatedAt: true },
  });
  const byKey = Object.fromEntries(slots.map((s) => [s.key, s]));

  const list = SITE_IMAGE_SLOT_KEYS.map((key) => {
    const meta = SITE_IMAGE_SLOT_META[key];
    const row = byKey[key];
    const imagePath = row?.imagePath?.trim() || SITE_IMAGE_DEFAULTS[key];
    return {
      key,
      label: row?.label ?? meta.label,
      description: row?.description ?? meta.description,
      imagePath,
      defaultPath: SITE_IMAGE_DEFAULTS[key],
      isOverridden: !!row?.imagePath?.trim(),
      alt: row?.alt ?? null,
      updatedAt: row?.updatedAt?.toISOString() ?? null,
    };
  });

  return NextResponse.json({ slots: list });
}
