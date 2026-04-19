import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSettings } from "@/lib/auth-guard";

export async function GET() {
  try {
    await requireAdminSettings();
    const templates = await prisma.emailTemplate.findMany({
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
    const { name, slug, description, subject, bodyHtml } = await req.json();

    if (!name || !slug || !bodyHtml) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        slug,
        description,
        subject,
        bodyHtml,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("[EMAIL_TEMPLATES_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
