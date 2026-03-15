/**
 * POST /api/admin/settings/my-account/pin — Set or change production floor PIN (4 digits).
 * Requires current account password. Staff/Admin only.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const bodySchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPin: z.string().length(4, "PIN must be exactly 4 digits").regex(/^\d{4}$/, "PIN must be 4 digits"),
  confirmPin: z.string().length(4, "Confirm PIN").regex(/^\d{4}$/, "Confirm PIN must be 4 digits"),
}).refine((d) => d.newPin === d.confirmPin, { message: "PIN and confirmation do not match", path: ["confirmPin"] });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user?.id || !role || !["STAFF", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    const msg = body.error.flatten().fieldErrors.currentPassword?.[0]
      ?? body.error.flatten().fieldErrors.newPin?.[0]
      ?? body.error.flatten().fieldErrors.confirmPin?.[0]
      ?? "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { currentPassword, newPin } = body.data;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const pinHash = await bcrypt.hash(newPin, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { productionPinHash: pinHash },
  });

  return NextResponse.json({ success: true });
}
