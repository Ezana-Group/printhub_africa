import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { prisma } from "@/lib/prisma";

function generateCode(userId: string): string {
  const slug = userId.slice(-6) + Math.random().toString(36).slice(2, 5);
  return slug.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

export async function GET() {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const code = await prisma.referralCode.upsert({
    where: { userId: session.user.id },
    update: {},
    create: {
      userId: session.user.id,
      code: generateCode(session.user.id),
    },
  });
  const settings = await prisma.referralSettings.findUnique({ where: { id: "default" } });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa";
  return NextResponse.json({
    code,
    referralUrl: `${baseUrl}/ref/${code.code}`,
    settings,
  });
}
