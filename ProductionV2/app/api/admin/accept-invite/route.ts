import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const bodySchema = z.object({ userId: z.string(), password: z.string().min(8) });

export async function POST(req: Request) {
  const body = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const user = await prisma.user.findUnique({
    where: { id: body.data.userId },
    select: { id: true, status: true },
  });
  if (!user || user.status !== "INVITE_PENDING") {
    return NextResponse.json({ error: "Invite expired or invalid" }, { status: 400 });
  }
  const hash = await bcrypt.hash(body.data.password, 12);
  await prisma.user.update({
    where: { id: body.data.userId },
    data: {
      passwordHash: hash,
      status: "ACTIVE",
      inviteToken: null,
      inviteTokenExpiry: null,
    },
  });
  return NextResponse.json({ success: true });
}
