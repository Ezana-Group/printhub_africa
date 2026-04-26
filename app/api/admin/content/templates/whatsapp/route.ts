import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSettings } from "@/lib/auth-guard";

export async function GET() {
  try {
    await requireAdminSettings();
    const templates = await prisma.whatsAppTemplate.findMany({
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
    const { name, slug, description, category, bodyText } = await req.json();

    if (!name || !slug || !bodyText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const template = await prisma.whatsAppTemplate.create({
      data: {
        name,
        slug,
        description,
        category: category || "UTILITY",
        bodyText,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("[WHATSAPP_TEMPLATES_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdminSettings();
    const { slug, name, description, bodyText, status } = await req.json();

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const template = await prisma.whatsAppTemplate.update({
      where: { slug },
      data: {
        name,
        description,
        bodyText,
        ...(status ? { status } : {}),
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("[WHATSAPP_TEMPLATES_PATCH]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
