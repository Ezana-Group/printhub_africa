import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  county: z.string().min(1).optional(),
  street: z.string().min(1).optional(),
  postalCode: z.string().optional(),
  instructions: z.string().optional(),
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
  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await prisma.pickupLocation.update({
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
  await prisma.pickupLocation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
