/**
 * POST /api/account/data/delete — KDPA right to erasure: anonymise/delete account data
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const body = await req.json().catch(() => ({}));
  const confirm = (body as { confirm?: string }).confirm;
  if (confirm !== "DELETE MY ACCOUNT") {
    return NextResponse.json(
      { error: "Send { confirm: 'DELETE MY ACCOUNT' } to proceed" },
      { status: 400 }
    );
  }

  const deletedId = `deleted-${userId.slice(0, 8)}-${Date.now()}`;
  const deletedEmail = `${deletedId}@deleted.printhub.local`;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        name: "Deleted User",
        email: deletedEmail,
        image: null,
        loyaltyPoints: 0,
        emailVerified: null,
      },
    }),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.account.deleteMany({ where: { userId } }),
  ]);

  return NextResponse.json({
    success: true,
    message: "Account data has been anonymised. You have been signed out.",
  });
}
