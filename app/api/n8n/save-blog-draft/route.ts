import { NextRequest, NextResponse } from "next/server";
import { n8nGuard } from "@/lib/n8n-verify";
import { prisma } from "@/lib/prisma";

function toSlug(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-');    // Replace multiple - with single -
}

export async function POST(req: NextRequest) {
  const guard = await n8nGuard(req);
  if (guard) return guard;

  try {
    const { title, excerpt, bodyHtml, tags, targetKeyword, aiGenerated } = await req.json();

    const slug = toSlug(title);

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt,
        bodyHtml,
        tags: tags || [],
        targetKeyword,
        aiGenerated: aiGenerated ?? true,
        status: "DRAFT",
      },
    });

    return NextResponse.json(post);
  } catch (err) {
    console.error("[save-blog-draft]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
