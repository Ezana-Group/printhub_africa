import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { z } from "zod";
import { CatalogueLicense } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_view" });
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const item = await prisma.catalogueItem.findUnique({
    where: { id },
    include: {
      category: true,
      designer: true,
      photos: { orderBy: { sortOrder: "asc" } },
      availableMaterials: true,
    },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

const updateSchema = z.object({
  name: z.string().min(1).max(300).optional(),
  slug: z.string().max(300).optional(),
  shortDescription: z.string().max(500).optional().nullable(),
  description: z.string().optional(),
  categoryId: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  designerId: z.string().optional().nullable(),
  sourceUrl: z.string().url().optional().nullable(),
  licenseType: z.enum(["CC0", "CC_BY", "CC_BY_SA", "PARTNERSHIP", "ORIGINAL"]).optional(),
  designerCredit: z.string().max(500).optional().nullable(),
  basePriceKes: z.number().min(0).optional().nullable(),
  priceOverrideKes: z.number().min(0).optional().nullable(),
  minQuantity: z.number().int().min(1).optional(),
  maxQuantity: z.number().int().min(1).optional(),
  weightGrams: z.number().min(0).optional().nullable(),
  printTimeHours: z.number().min(0).optional().nullable(),
  supportsRequired: z.boolean().optional(),
  printDifficulty: z.enum(["STANDARD", "MODERATE", "ADVANCED"]).optional(),
  buildVolumeX: z.number().optional().nullable(),
  buildVolumeY: z.number().optional().nullable(),
  buildVolumeZ: z.number().optional().nullable(),
  isFeatured: z.boolean().optional(),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "LIVE", "PAUSED", "RETIRED"]).optional(),
  isNewArrival: z.boolean().optional(),
  isStaffPick: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  metaTitle: z.string().max(200).optional().nullable(),
  metaDescription: z.string().max(500).optional().nullable(),
  internalNotes: z.string().optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) update[k] = v;
  }
  if (update.licenseType) update.licenseType = update.licenseType as CatalogueLicense;
  if (update.printDifficulty) update.printDifficulty = update.printDifficulty;

  try {
    const item = await prisma.catalogueItem.update({
      where: { id },
      data: update as Parameters<typeof prisma.catalogueItem.update>[0]["data"],
    });
    return NextResponse.json(item);
  } catch (e) {
    if ((e as { code?: string })?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error("Update catalogue item error:", e);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    await prisma.catalogueItem.delete({
      where: { id },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if ((e as { code?: string })?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error("Delete catalogue item error:", e);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
