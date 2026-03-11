import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.savedAddress.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.$transaction([
    prisma.savedAddress.updateMany({ where: { userId: session.user.id }, data: { isDefault: false } }),
    prisma.savedAddress.update({ where: { id }, data: { isDefault: true } }),
  ]);
  return NextResponse.json({ success: true });
}
