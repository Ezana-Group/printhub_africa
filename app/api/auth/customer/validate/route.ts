import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        passwordHash: true,
        role: true,
        status: true,
      },
    });

    if (!user || user.status === "DEACTIVATED" || user.role !== "CUSTOMER") {
       // If staff tries to login here, show error
       if (user && ["STAFF", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
          return NextResponse.json({ error: "Staff accounts must log in at admin.printhub.africa" }, { status: 403 });
       }
       return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash || "");
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Customer validation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
