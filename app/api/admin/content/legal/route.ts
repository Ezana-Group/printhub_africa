import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { isValidLegalSlugFormat } from "@/lib/legal";

function requireContentAdmin(auth: { role: string }) {
  if (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi({ permission: "orders_view" });
  if (auth instanceof NextResponse) return auth;
  const forbidden = requireContentAdmin(auth);
  if (forbidden) return forbidden;

  const body = await req.json();
  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content : "";

  if (!slug || !title) {
    return NextResponse.json(
      { error: "slug and title are required" },
      { status: 400 }
    );
  }

  if (!isValidLegalSlugFormat(slug)) {
    return NextResponse.json(
      { error: "Slug must be 2–80 characters, lowercase letters, numbers and hyphens only (e.g. my-policy)" },
      { status: 400 }
    );
  }

  const existing = await prisma.legalPage.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: "A legal page with this slug already exists" },
      { status: 409 }
    );
  }

  const page = await prisma.legalPage.create({
    data: {
      slug,
      title,
      content,
      isPublished: false,
      version: 1,
    },
  });

  return NextResponse.json({ page }, { status: 201 });
}
