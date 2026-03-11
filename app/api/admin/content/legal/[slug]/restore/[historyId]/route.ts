import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

function requireContentAdmin(auth: { role: string }) {
  if (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; historyId: string }> }
) {
  const auth = await requireAdminApi({ permission: "orders_view" });
  if (auth instanceof NextResponse) return auth;
  const forbidden = requireContentAdmin(auth);
  if (forbidden) return forbidden;

  const { slug, historyId } = await params;

  const page = await prisma.legalPage.findUnique({ where: { slug } });
  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  const hist = await prisma.legalPageHistory.findFirst({
    where: { id: historyId, legalPageId: page.id },
  });
  if (!hist) return NextResponse.json({ error: "History not found" }, { status: 404 });

  await prisma.legalPageHistory.create({
    data: {
      legalPageId: page.id,
      content: page.content,
      version: page.version,
      savedBy: auth.session.user?.id ?? undefined,
      changeNote: `Restored from v${hist.version}`,
    },
  });

  const updated = await prisma.legalPage.update({
    where: { slug },
    data: {
      content: hist.content,
      version: page.version + 1,
      lastUpdated: new Date(),
      updatedBy: auth.session.user?.id ?? undefined,
    },
  });

  return NextResponse.json({ page: updated });
}
