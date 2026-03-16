import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const page = await prisma.legalPage.findUnique({
    where: { slug, isPublished: true },
    select: { title: true, content: true, lastUpdated: true, version: true },
  });

  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    title: page.title,
    content: page.content,
    lastUpdated: page.lastUpdated,
    version: page.version,
  });
}
