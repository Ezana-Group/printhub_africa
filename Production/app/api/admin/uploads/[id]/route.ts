import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().max(1000).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "orders_edit" });
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body. Required: status (APPROVED | REJECTED)." }, { status: 400 });
  }

  const file = await prisma.uploadedFile.findUnique({ where: { id } });
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: { status: string; rejectionReason?: string; reviewedBy?: string; reviewedAt?: Date } = {
    status: body.status,
    reviewedBy: auth.session.user?.id,
    reviewedAt: new Date(),
  };
  if (body.status === "REJECTED" && body.rejectionReason != null) {
    data.rejectionReason = body.rejectionReason;
  }

  const updated = await prisma.uploadedFile.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}
