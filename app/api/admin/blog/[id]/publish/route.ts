import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "STAFF"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as any)?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
    return NextResponse.json(post);
  } catch (error) {
    console.error("[POST /api/admin/blog/[id]/publish]", error);
    return NextResponse.json({ error: "Failed to publish post" }, { status: 500 });
  }
}
