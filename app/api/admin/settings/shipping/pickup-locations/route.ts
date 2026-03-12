import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { z } from "zod";

export async function GET(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;
  const locations = await prisma.pickupLocation.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return NextResponse.json(locations);
}

const schema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  county: z.string().min(1),
  street: z.string().min(1),
  postalCode: z.string().optional(),
  instructions: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export async function POST(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;
  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const data = body.data;
  const location = await prisma.pickupLocation.create({
    data: {
      name: data.name,
      city: data.city,
      county: data.county,
      street: data.street,
      postalCode: data.postalCode ?? null,
      instructions: data.instructions ?? null,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    },
  });
  return NextResponse.json(location);
}
