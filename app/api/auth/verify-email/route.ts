import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawToken = searchParams.get("token");
  const token = typeof rawToken === "string" ? rawToken.trim() : "";
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=MissingToken", req.url));
  }

  const vt = await prisma.verificationToken.findUnique({
    where: { token },
  });
  if (!vt || vt.expires < new Date()) {
    return NextResponse.redirect(new URL("/login?error=InvalidOrExpiredToken", req.url));
  }

  // Match user by email case-insensitively (identifier may differ in casing from User.email)
  const user = await prisma.user.findFirst({
    where: { email: { equals: vt.identifier.trim(), mode: "insensitive" } },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=InvalidOrExpiredToken", req.url));
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  });
  await prisma.verificationToken.delete({ where: { token } });

  return NextResponse.redirect(new URL("/login?verified=1", req.url));
}
