import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const pendingMockups = await prisma.productMockup.findMany({
      where: { status: "PENDING_REVIEW" },
      include: { product: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const pendingVideos = await prisma.productVideo.findMany({
      where: { status: "PENDING_REVIEW" },
      include: { product: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const pendingAdCopy = await prisma.adCopyVariation.findMany({
      where: { isApproved: false },
      include: { product: true },
      orderBy: { generatedAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      pendingMockups,
      pendingVideos,
      pendingAdCopy,
    });
  } catch (err) {
    console.error("[content-approval-get]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { type, id, status } = await req.json();
    const adminId = (session.user as { id?: string }).id ?? "unknown";
    const now = new Date();
    
    const isApproved = status === "APPROVED";

    if (type === "mockup") {
      await prisma.productMockup.update({
        where: { id },
        data: {
          status,
          approvedAt: isApproved ? now : null,
          approvedBy: isApproved ? adminId : null,
        },
      });
    } else if (type === "video") {
      await prisma.productVideo.update({
        where: { id },
        data: { status, approvedAt: isApproved ? now : null },
      });
    } else if (type === "ad-copy") {
      await prisma.adCopyVariation.update({
        where: { id },
        data: {
          isApproved,
          approvedAt: isApproved ? now : null,
          approvedBy: isApproved ? adminId : null,
        },
      });
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[content-approval-patch]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
