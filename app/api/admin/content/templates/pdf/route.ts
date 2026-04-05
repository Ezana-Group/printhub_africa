import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSettings } from "@/lib/auth-guard";

export async function GET() {
  try {
    await requireAdminSettings();
    const templates = await prisma.pdfTemplate.findMany({
      orderBy: { slug: "asc" },
    });
    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminSettings();
    const { name, slug, description, bodyHtml } = await req.json();

    if (!name || !slug || !bodyHtml) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const template = await prisma.pdfTemplate.create({
      data: {
        name,
        slug,
        description: description || "",
        bodyHtml,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("[PDF_TEMPLATES_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
