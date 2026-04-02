import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

function requireAdmin(session: { user?: { role?: string } } | null) {
  if (!session?.user || !ADMIN_ROLES.includes((session.user as { role?: string }).role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  return null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsAdmin);
  const err = requireAdmin(session);
  if (err) return err;

  const { id } = await params;
  const body = await req.json();
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (!note) {
    return NextResponse.json({ error: "Note is required" }, { status: 400 });
  }

  const application = await prisma.jobApplication.findUnique({ where: { id } });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existingNotes = application.internalNotes ?? "";
  const newNotes = existingNotes
    ? `${existingNotes}\n\n---\n${new Date().toISOString()} (${(session!.user as { name?: string })?.name ?? "Staff"}):\n${note}`
    : `${new Date().toISOString()} (${(session!.user as { name?: string })?.name ?? "Staff"}):\n${note}`;

  const updated = await prisma.jobApplication.update({
    where: { id },
    data: { internalNotes: newNotes },
  });
  return NextResponse.json(updated);
}
