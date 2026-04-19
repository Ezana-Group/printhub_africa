import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function POST() {
  const auth = await requireAdminApi({ permission: "settings_manage" });
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only SUPER_ADMIN can regenerate the API key" }, { status: 403 });
  }

  const newKey = "ph_live_" + randomBytes(24).toString("hex");

  const updated = await prisma.businessSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      apiSecretKey: newKey,
    },
    update: {
      apiSecretKey: newKey,
    },
  });

  return NextResponse.json({ apiKey: newKey });
}
