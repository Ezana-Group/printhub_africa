import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;

  const apiKey = await prisma.apiKey.update({
    where: { id: params.id },
    data: { revokedAt: new Date() },
  });

  await writeAudit({
    userId: auth.userId,
    action: "API_KEY_REVOKED",
    entity: "API_KEY",
    entityId: params.id,
    after: { name: apiKey.name },
    request: req,
  });

  return NextResponse.json({ success: true });
}
