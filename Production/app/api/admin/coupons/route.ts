import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

const createSchema = z.object({
  code: z.string().min(1).max(50),
  type: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
  value: z.number().min(0),
  minOrderAmount: z.number().min(0).optional().nullable(),
  maxUses: z.number().int().min(1).optional().nullable(),
  startDate: z.string().min(1),
  expiryDate: z.string().min(1),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const coupons = await prisma.coupon.findMany({
    orderBy: { expiryDate: "desc" },
  });
  return NextResponse.json(coupons);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const startDate = new Date(data.startDate);
    const expiryDate = new Date(data.expiryDate);
    const code = data.code.trim().toUpperCase();
    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { error: "A coupon with this code already exists." },
        { status: 400 }
      );
    }
    const coupon = await prisma.coupon.create({
      data: {
        code,
        type: data.type,
        value: data.value,
        minOrderAmount: data.minOrderAmount ?? null,
        maxUses: data.maxUses ?? null,
        startDate,
        expiryDate,
        isActive: data.isActive ?? true,
      },
    });
    return NextResponse.json(coupon);
  } catch (e) {
    console.error("Create coupon error:", e);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
