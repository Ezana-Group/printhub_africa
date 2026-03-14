import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { isLegalSlug } from "@/lib/legal";

function requireContentAdmin(auth: { role: string }) {
  if (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAdminApi({ permission: "orders_view" });
  if (auth instanceof NextResponse) return auth;
  const forbidden = requireContentAdmin(auth);
  if (forbidden) return forbidden;

  const { slug } = await params;
  if (!isLegalSlug(slug)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const content = typeof body.content === "string" ? body.content : undefined;
  const changeNote = typeof body.changeNote === "string" ? body.changeNote : null;
  const isPublished = typeof body.isPublished === "boolean" ? body.isPublished : undefined;

  if (content === undefined && isPublished === undefined) {
    return NextResponse.json({ error: "content or isPublished required" }, { status: 400 });
  }

  const page = await prisma.legalPage.findUnique({ where: { slug } });
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (content != null) {
    await prisma.legalPageHistory.create({
      data: {
        legalPageId: page.id,
        content: page.content,
        version: page.version,
        savedBy: auth.session.user?.id ?? undefined,
        changeNote: changeNote ?? undefined,
      },
    });
  }

  const updated = await prisma.legalPage.update({
    where: { slug },
    data: {
      ...(content != null && {
        content,
        version: page.version + 1,
        lastUpdated: new Date(),
        updatedBy: auth.session.user?.id ?? undefined,
      }),
      ...(isPublished !== undefined && { isPublished }),
    },
  });

  return NextResponse.json({ page: updated });
}
