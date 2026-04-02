import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  label: z.string().default("Home"),
  recipientName: z.string().optional(),
  phone: z.string().optional(),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  county: z.string().min(1),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const list = await prisma.savedAddress.findMany({
    where: { userId: session.user.id },
    orderBy: { isDefault: "desc" },
  });
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const count = await prisma.savedAddress.count({ where: { userId: session.user.id } });
  if (count >= 5) return NextResponse.json({ error: "Maximum 5 addresses reached" }, { status: 400 });
  const body = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const data = { ...body.data, userId: session.user.id };
  if (data.isDefault) {
    await prisma.savedAddress.updateMany({ where: { userId: session.user.id }, data: { isDefault: false } });
  }
  const created = await prisma.savedAddress.create({
    data: { ...data, isDefault: data.isDefault ?? false },
  });
  return NextResponse.json(created);
}
