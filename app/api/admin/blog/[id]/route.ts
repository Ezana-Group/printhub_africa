import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "STAFF"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as any)?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { title, excerpt, bodyHtml, tags, targetKeyword, status, aiGenerated } = body;

    const data: any = {};
    if (title) data.title = title;
    if (excerpt !== undefined) data.excerpt = excerpt;
    if (bodyHtml) data.bodyHtml = bodyHtml;
    if (tags) data.tags = tags;
    if (targetKeyword !== undefined) data.targetKeyword = targetKeyword;
    
    // MED-2: Prevent publishing via PATCH. Must use the dedicated /publish route.
    if (status) {
      if (status === "PUBLISHED") {
        return NextResponse.json({ error: "Use the dedicated /publish route to publish posts." }, { status: 400 });
      }
      data.status = status as any;
    }
    if (aiGenerated !== undefined) data.aiGenerated = aiGenerated;

    const updated = await prisma.blogPost.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/admin/blog/[id]]", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as any)?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await prisma.blogPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/blog/[id]]", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
