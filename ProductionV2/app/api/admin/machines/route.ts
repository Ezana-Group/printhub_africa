import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

const MACHINE_TYPES = [
  "LARGE_FORMAT_PRINTER",
  "3D_PRINTER_FDM",
  "3D_PRINTER_RESIN",
] as const;

const createSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(MACHINE_TYPES),
  status: z.enum(["IDLE", "PRINTING", "MAINTENANCE"]).optional(),
  location: z.string().max(200).optional(),
  purchasePriceKes: z.number().min(0).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, type, status = "IDLE", location, purchasePriceKes } = parsed.data;

  try {
    const machine = await prisma.machine.create({
      data: {
        name,
        type,
        status,
        location: location || null,
        purchasePriceKes: purchasePriceKes ?? null,
      },
    });
    return NextResponse.json(machine);
  } catch (e) {
    console.error("Machine create error:", e);
    return NextResponse.json(
      { error: "Failed to create machine" },
      { status: 500 }
    );
  }
}
