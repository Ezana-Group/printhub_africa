import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const bodySchema = z.object({
  userId: z.string(),
  token: z.string().min(1, "Invite token is required"),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const body = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten().fieldErrors }, { status: 400 });
  }
  const user = await prisma.user.findUnique({
    where: { id: body.data.userId },
    select: { id: true, status: true, inviteToken: true, inviteTokenExpiry: true },
  });
  if (!user || user.status !== "INVITE_PENDING") {
    return NextResponse.json({ error: "Invite expired or invalid" }, { status: 400 });
  }
  if (!user.inviteToken || !user.inviteTokenExpiry) {
    return NextResponse.json({ error: "Invite expired or invalid" }, { status: 400 });
  }
  if (user.inviteTokenExpiry < new Date()) {
    return NextResponse.json({ error: "Invitation link has expired" }, { status: 400 });
  }
  const tokenValid = await bcrypt.compare(body.data.token, user.inviteToken);
  if (!tokenValid) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 400 });
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
