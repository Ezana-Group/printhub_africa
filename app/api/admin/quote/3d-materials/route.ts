import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

export async function GET() {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const materials = await prisma.printMaterial.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(materials);
}

const updateSchema = z.object({
  id: z.string(),
  pricePerGram: z.number().min(0).optional(),
  colorOptions: z.array(z.string()).optional(),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { id, pricePerGram, colorOptions } = parsed.data;
    const data: { pricePerGram?: number; colorOptions?: string[] } = {};
    if (pricePerGram !== undefined) data.pricePerGram = pricePerGram;
    if (colorOptions !== undefined) data.colorOptions = colorOptions;
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }
    await prisma.printMaterial.update({
      where: { id },
      data,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Update 3D material error:", e);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
