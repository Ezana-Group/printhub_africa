import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "STAFF"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as any)?.role;
  const userId = session?.user?.id;

  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.status === "PUBLISHED") {
      return NextResponse.json({ error: "Post is already published" }, { status: 400 });
    }

    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        status: "PUBLISHED" as any,
        publishedAt: new Date(),
        publishedBy: userId,
      },
    });

    await createAuditLog({
      userId,
      action: "PUBLISH_BLOG_POST",
      entity: "BLOG_POST",
      entityId: id,
      before: { status: post.status },
      after: { status: "PUBLISHED", publishedAt: updated.publishedAt, publishedBy: userId },
    });

    // TODO: Trigger n8n workflow for Medium/LinkedIn sync here if needed

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[POST /api/admin/blog/[id]/publish]", error);
    return NextResponse.json({ error: "Failed to publish post" }, { status: 500 });
  }
}
