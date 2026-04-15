import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { validateDangerFromBody, type DangerConfirmBody } from "@/lib/danger";
import { writeAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;

  // Read the request body ONCE. validateDangerFromBody receives the parsed
  // object so the stream is never consumed a second time (fixes CRIT-001).
  let body: DangerConfirmBody & { userId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { userId } = body;
  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    try {
      await validateDangerFromBody(body, "ANONYMISE CUSTOMER");
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Confirmation failed" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await prisma.user.update({
      where: { id: userId },
      data: {
        name: "Anonymised Customer",
        email: `anon-${userId.slice(0, 8)}@printhub-anon.com`,
        phone: null,
        passwordHash: null,
        isAnonymised: true,
        anonymisedAt: new Date(),
        dateOfBirth: null,
        stripeCustomerId: null,
        totpSecret: null,
        profileImage: null,
        addresses: {
          deleteMany: {},
        },
      },
    });

    await writeAudit({
      userId: auth.userId,
      action: "CUSTOMER_ANONYMISED",
      category: "DANGER",
      entity: "USER",
      entityId: userId,
      details: `Anonymised user ${userId}`,
      request: req,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Anonymise failed:", error);
    return NextResponse.json({ error: "Failed to anonymise customer data" }, { status: 500 });
  }
}
