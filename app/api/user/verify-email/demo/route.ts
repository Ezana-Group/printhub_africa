import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        emailVerified: new Date(),
      },
      select: { emailVerified: true },
    });

    return NextResponse.json({ success: true, emailVerified: updatedUser.emailVerified });
  } catch (error) {
    console.error("Demo verify error:", error);
    return NextResponse.json({ error: "Failed to verify email" }, { status: 500 });
  }
}
