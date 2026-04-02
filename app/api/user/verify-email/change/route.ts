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

    const { newEmail } = await req.json();
    if (!newEmail || typeof newEmail !== "string" || !newEmail.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    
    const lowerEmail = newEmail.trim().toLowerCase();

    // Check if email is taken
    const existing = await prisma.user.findUnique({
      where: { email: lowerEmail },
      select: { id: true }
    });
    
    if (existing && existing.id !== session.user.id) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        email: lowerEmail,
        emailVerified: null, // Reset verification because email changed
      },
      select: { email: true, emailVerified: true },
    });
    
    // In a real app, trigger the resend webhook here

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Change email error:", error);
    return NextResponse.json({ error: "Failed to change email" }, { status: 500 });
  }
}
