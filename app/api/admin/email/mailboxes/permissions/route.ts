import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import { canAccessRoute } from "@/lib/admin-permissions";
import { z } from "zod";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

const permissionSchema = z.object({
  mailboxId: z.string().min(1),
  userId: z.string().min(1),
  allowed: z.boolean(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  const permissions = (session?.user as { permissions?: string[] })?.permissions;
  const currentUserId = session?.user?.id as string | undefined;

  if (!currentUserId || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessRoute("/admin/email/settings", role, permissions ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = permissionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { mailboxId, userId, allowed } = parsed.data;

  // Only allow toggling for existing mailboxes and staff users.
  const [mailbox, staff] = await Promise.all([
    prisma.emailAddress.findUnique({
      where: { id: mailboxId },
      select: { id: true, isActive: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    }),
  ]);

  if (!mailbox || !mailbox.isActive) {
    return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
  }
  if (!staff || staff.role !== "STAFF") {
    return NextResponse.json({ error: "Staff user not found" }, { status: 404 });
  }

  try {
    if (allowed) {
      await prisma.emailMailboxViewer.upsert({
        where: {
          mailboxId_userId: { mailboxId, userId },
        },
        update: {},
        create: {
          mailboxId,
          userId,
        },
      });
    } else {
      await prisma.emailMailboxViewer.deleteMany({
        where: { mailboxId, userId },
      });
    }
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to update mailbox access", details: String(e) },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

