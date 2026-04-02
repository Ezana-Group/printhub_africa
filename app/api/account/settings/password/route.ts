import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { getPasswordPolicy, validatePasswordAgainstPolicy } from "@/lib/password-utils";

const bodySchema = z.object({ currentPassword: z.string(), newPassword: z.string() });

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true, passwordHistory: true },
  });

  if (!user?.passwordHash || !(await bcrypt.compare(body.data.currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  // Password Policy Validation
  const policy = await getPasswordPolicy();
  const validation = validatePasswordAgainstPolicy(body.data.newPassword, policy);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.errors.join(" ") }, { status: 400 });
  }

  // Prevent Reuse Check
  if (policy.preventReuseOf > 0) {
    const history = user.passwordHistory || [];
    for (const oldHash of history.slice(-policy.preventReuseOf)) {
      if (await bcrypt.compare(body.data.newPassword, oldHash)) {
        return NextResponse.json({ error: `Cannot reuse any of your last ${policy.preventReuseOf} passwords.` }, { status: 400 });
      }
    }
  }

  const hash = await bcrypt.hash(body.data.newPassword, 12);
  const newHistory = [...(user.passwordHistory || []), hash].slice(-24); // Keep last 24 max

  await prisma.user.update({
    where: { id: session.user.id },
    data: { 
      passwordHash: hash,
      passwordChangedAt: new Date(),
      passwordExpired: false,
      passwordHistory: newHistory,
    },
  });

  return NextResponse.json({ success: true });
}
