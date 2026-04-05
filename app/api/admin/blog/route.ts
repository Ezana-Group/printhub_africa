import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "STAFF"];

function toSlug(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-');    // Replace multiple - with single -
}

export async function GET() {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as any)?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error("[GET /api/admin/blog]", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as any)?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, excerpt, bodyHtml, tags, targetKeyword, aiGenerated = false } = body;
    let { status } = body;

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    if (!status) {
      status = aiGenerated ? "PENDING_REVIEW" : "DRAFT";
    }

    const slug = toSlug(title);
    
    // Check for slug collision
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now().toString().slice(-4)}` : slug;

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug: finalSlug,
        excerpt,
        bodyHtml,
        tags: tags || [],
        targetKeyword,
        aiGenerated,
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("[POST /api/admin/blog]", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
