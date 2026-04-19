import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSettings } from "@/lib/auth-guard";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await requireAdminSettings();
    const { bodyHtml } = await req.json();

    if (bodyHtml === undefined) {
      return NextResponse.json({ error: "Missing bodyHtml" }, { status: 400 });
    }

    const template = await prisma.pdfTemplate.update({
      where: { slug },
      data: { bodyHtml },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("[PDF_TEMPLATE_PATCH]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
