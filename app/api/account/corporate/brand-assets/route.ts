import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const assetSchema = z.object({
  logoImageUrl: z.string().url().nullable().optional(),
  brandGuidelineUrl: z.string().url().nullable().optional(),
  brandNotes: z.string().max(1000).nullable().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  // Find membership to get corporateId
  const membership = await prisma.corporateTeamMember.findFirst({
    where: { userId, isActive: true },
    include: { corporate: true }
  });

  if (!membership?.corporate) {
    return NextResponse.json({ error: "Not a member of a corporate account" }, { status: 403 });
  }

  const { corporate } = membership;

  return NextResponse.json({
    logoImageUrl: corporate.logoImageUrl,
    brandGuidelineUrl: corporate.brandGuidelineUrl,
    brandNotes: corporate.brandNotes,
    status: corporate.status,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const body = await req.json().catch(() => ({}));
  const parsed = assetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Check membership and role
  const membership = await prisma.corporateTeamMember.findFirst({
    where: { 
      userId, 
      isActive: true,
      role: { in: ["OWNER", "ADMIN"] }
    }
  });

  if (!membership) {
    return NextResponse.json({ error: "Unauthorized: Only OWNER or ADMIN can update brand assets" }, { status: 403 });
  }

  const updated = await prisma.corporateAccount.update({
    where: { id: membership.corporateId },
    data: parsed.data,
  });

  return NextResponse.json({
    logoImageUrl: updated.logoImageUrl,
    brandGuidelineUrl: updated.brandGuidelineUrl,
    brandNotes: updated.brandNotes,
  });
}
