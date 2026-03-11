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
  await prisma.deliveryZone.update({
    where: { id },
    data: body.data,
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
