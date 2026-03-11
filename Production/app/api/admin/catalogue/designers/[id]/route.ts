import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { z } from "zod";
import { CatalogueLicense } from "@prisma/client";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  username: z.string().max(100).optional().nullable(),
  platform: z.string().max(100).optional().nullable(),
  profileUrl: z.string().url().optional().nullable(),
  licenseDefault: z.enum(["CC0", "CC_BY", "CC_BY_SA", "PARTNERSHIP", "ORIGINAL"]).optional(),
  isPartner: z.boolean().optional(),
  revenueSharePct: z.number().min(0).max(100).optional().nullable(),
  paymentMethod: z.string().max(50).optional().nullable(),
  paymentDetails: z.string().max(500).optional().nullable(),
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
  if (data.licenseDefault) data.licenseDefault = data.licenseDefault as CatalogueLicense;
  try {
    const designer = await prisma.catalogueDesigner.update({
      where: { id },
      data,
    });
    return NextResponse.json(designer);
  } catch (e) {
    if ((e as { code?: string })?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
