import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const baseUrl = getRedirectBase(req);
  const { searchParams } = new URL(req.url);
  const rawToken = searchParams.get("token");
  const token = typeof rawToken === "string" ? rawToken.trim() : "";
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=MissingToken", baseUrl));
  }

  let vt;
  try {
    vt = await prisma.verificationToken.findUnique({
      where: { token },
    });
  } catch (e) {
    console.error("verify-email: token lookup failed", e);
    return NextResponse.redirect(new URL("/login?error=InvalidOrExpiredToken", baseUrl));
  }
  if (!vt || vt.expires < new Date()) {
    return NextResponse.redirect(new URL("/login?error=InvalidOrExpiredToken", baseUrl));
  }

  const identifier = vt.identifier.trim();
  // Update ALL users with this email (case-insensitive). PostgreSQL unique is case-sensitive,
  // so duplicate rows with different casing can exist; verify every matching account.
  try {
    const result = await prisma.user.updateMany({
      where: { email: { equals: identifier, mode: "insensitive" } },
      data: { emailVerified: new Date() },
    });
    if (result.count === 0) {
      return NextResponse.redirect(new URL("/login?error=InvalidOrExpiredToken", baseUrl));
    }
  } catch (e) {
    console.error("verify-email: user update failed", e);
    return NextResponse.redirect(new URL("/login?error=VerifyFailed", baseUrl));
  }

  try {
    await prisma.verificationToken.delete({ where: { token } });
  } catch {
    // Token already consumed or DB error; user is verified, continue
  }

  return NextResponse.redirect(new URL("/login?verified=1", baseUrl));
}

/** Use request host so redirect lands on the same site the user clicked (e.g. localhost vs production). */
function getRedirectBase(req: Request): string {
  try {
    const url = new URL(req.url);
    return url.origin;
  } catch {
    return process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa";
  }
}
