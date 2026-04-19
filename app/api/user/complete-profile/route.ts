import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptionsCustomer);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const { firstName, lastName, displayName, phone } = json;

    const fullName = `${firstName ?? ""} ${lastName ?? ""}`.trim();

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: fullName || undefined,
        displayName: displayName || undefined,
        phone: phone || undefined,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Profile completion error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
