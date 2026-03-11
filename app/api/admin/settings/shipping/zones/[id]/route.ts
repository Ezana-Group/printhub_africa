import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { z } from "zod";

const zoneSchema = z.object({
  name: z.string().optional(),
  counties: z.array(z.string()).optional(),
  feeKes: z.number().optional(),
  minDays: z.number().optional(),
  maxDays: z.number().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = zoneSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const raw = body.data;
  const data: Parameters<typeof prisma.deliveryZone.update>[0]["data"] = {
    ...(raw.name !== undefined && { name: raw.name }),
    ...(raw.counties !== undefined && { counties: Array.isArray(raw.counties) ? raw.counties.join(",") : raw.counties }),
    ...(raw.feeKes !== undefined && { feeKes: raw.feeKes }),
    ...(raw.minDays !== undefined && { minDays: raw.minDays }),
    ...(raw.maxDays !== undefined && { maxDays: raw.maxDays }),
    ...(raw.isActive !== undefined && { isActive: raw.isActive }),
    ...(raw.sortOrder !== undefined && { sortOrder: raw.sortOrder }),
  };
  await prisma.deliveryZone.update({
    where: { id },
    data,
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(_req, "ADMIN");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  await prisma.deliveryZone.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
