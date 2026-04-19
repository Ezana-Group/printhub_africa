import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireAdminApi({ permission: "settings_manage" });
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only SUPER_ADMIN can view the API key" }, { status: 403 });
  }

  const settings = await prisma.businessSettings.findUnique({
    where: { id: "default" },
    select: { apiSecretKey: true },
  });

  return NextResponse.json({ apiKey: settings?.apiSecretKey || null });
}
