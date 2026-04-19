import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  dateOfBirth: z.union([z.string(), z.date()]).nullable().optional(),
  profileImage: z.string().url().nullable().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true, dateOfBirth: true, profileImage: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = profileSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const data: { name?: string; phone?: string | null; dateOfBirth?: Date | null; profileImage?: string | null } = {};
  if (body.data.name != null) data.name = body.data.name;
  if (body.data.phone !== undefined) data.phone = body.data.phone;
  if (body.data.dateOfBirth !== undefined) data.dateOfBirth = body.data.dateOfBirth ? new Date(body.data.dateOfBirth) : null;
  if (body.data.profileImage !== undefined) data.profileImage = body.data.profileImage;
  await prisma.user.update({
    where: { id: session.user.id },
    data,
  });
  return NextResponse.json({ success: true });
}
