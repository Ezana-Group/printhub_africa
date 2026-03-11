import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const materials = await prisma.printingMedium.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(materials);
}

const updateSchema = z.object({
  id: z.string(),
  pricePerSqm: z.number().min(0),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
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
    const { id, pricePerSqm } = parsed.data;
    await prisma.printingMedium.update({
      where: { id },
      data: { pricePerSqMeter: pricePerSqm },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Update quote material error:", e);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
