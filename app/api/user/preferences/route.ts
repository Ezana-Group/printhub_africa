import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { prisma } from "@/lib/prisma";

/**
 * Handle user preference updates (e.g., SMS marketing toggle).
 */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptionsCustomer);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { smsMarketingOptIn } = await req.json();

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        smsMarketingOptIn: !!smsMarketingOptIn,
        smsUnsubscribedAt: smsMarketingOptIn ? null : new Date(),
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error("[user-preferences]", err);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
