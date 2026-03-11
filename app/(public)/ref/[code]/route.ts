import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const REF_COOKIE = "ref_code";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const ref = await prisma.referralCode.findUnique({
    where: { code },
    select: { id: true },
  });
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa";
  const res = NextResponse.redirect(base);
  if (ref) {
    res.cookies.set(REF_COOKIE, code, {
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }
  return res;
}
