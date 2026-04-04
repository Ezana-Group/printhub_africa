import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const assetSchema = z.object({
  logoImageUrl: z.string().url().nullable().optional(),
  brandGuidelineUrl: z.string().url().nullable().optional(),
  brandNotes: z.string().max(1000).nullable().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const corporate = await prisma.corporateAccount.findUnique({
    where: { primaryUserId: session.user.id },
    select: {
      logoImageUrl: true,
      brandGuidelineUrl: true,
      brandNotes: true,
      status: true,
    }
  });

  if (!corporate) return NextResponse.json({ error: "Not a corporate account" }, { status: 403 });

  return NextResponse.json(corporate);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = assetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const corporate = await prisma.corporateAccount.findUnique({
    where: { primaryUserId: session.user.id },
  });

  if (!corporate) return NextResponse.json({ error: "Not a corporate account" }, { status: 403 });

  const updated = await prisma.corporateAccount.update({
    where: { id: corporate.id },
    data: parsed.data,
  });

  return NextResponse.json({
    logoImageUrl: updated.logoImageUrl,
    brandGuidelineUrl: updated.brandGuidelineUrl,
    brandNotes: updated.brandNotes,
  });
}
