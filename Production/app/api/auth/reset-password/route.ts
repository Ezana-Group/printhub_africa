import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "At least 8 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { token, password } = parsed.data;

    const vt = await prisma.verificationToken.findUnique({
      where: { token },
    });
    if (!vt || vt.expires < new Date()) {
      return NextResponse.json(
        { error: "Link invalid or expired. Please request a new reset link." },
        { status: 400 }
      );
    }

    if (!vt.identifier.startsWith("reset:")) {
      return NextResponse.json({ error: "Invalid reset token." }, { status: 400 });
    }
    const email = vt.identifier.replace("reset:", "");

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });
    await prisma.verificationToken.delete({ where: { token } });

    return NextResponse.json({ message: "Password updated. You can now sign in." });
  } catch (e) {
    console.error("Reset password error:", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
