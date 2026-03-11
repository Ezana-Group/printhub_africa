import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

const LEGAL_SLUGS = ["privacy-policy", "terms-of-service", "cookie-policy", "refund-policy"] as const;

function requireContentAdmin(auth: { role: string }) {
  if (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAdminApi({ permission: "orders_view" });
  if (auth instanceof NextResponse) return auth;
  const forbidden = requireContentAdmin(auth);
  if (forbidden) return forbidden;

  const { slug } = await params;
  if (!LEGAL_SLUGS.includes(slug as (typeof LEGAL_SLUGS)[number])) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const page = await prisma.legalPage.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const history = await prisma.legalPageHistory.findMany({
    where: { legalPageId: page.id },
    orderBy: { savedAt: "desc" },
  });

  return NextResponse.json({ history });
}
