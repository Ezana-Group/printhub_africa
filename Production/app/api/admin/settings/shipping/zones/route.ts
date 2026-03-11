import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { z } from "zod";

export async function GET(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;
  const zones = await prisma.deliveryZone.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(zones);
}

const zoneSchema = z.object({
  name: z.string(),
  counties: z.array(z.string()),
  feeKes: z.number(),
  minDays: z.number().optional(),
  maxDays: z.number().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export async function POST(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;
  const body = zoneSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const zone = await prisma.deliveryZone.create({
    data: {
      ...body.data,
      minDays: body.data.minDays ?? 3,
      maxDays: body.data.maxDays ?? 5,
      isActive: body.data.isActive ?? true,
      sortOrder: body.data.sortOrder ?? 0,
    },
  });
  return NextResponse.json(zone);
}
