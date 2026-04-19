/**
 * PATCH /api/admin/support/tickets/[id] — update status/assignedTo
 * POST /api/admin/support/tickets/[id] — add staff reply (and optionally set status)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import { sendTicketRepliedEmail, sendTicketResolvedEmail } from "@/lib/email";
import { z } from "zod";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature kept for API consistency
async function requireAdmin(req: NextRequest) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user?.id || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { session, userId: session.user.id };
}

const patchSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  assignedTo: z.string().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const update: { status?: string; assignedTo?: string | null; priority?: string; resolvedAt?: Date; closedAt?: Date } = {};
  if (parsed.data.status !== undefined) {
    update.status = parsed.data.status;
    if (parsed.data.status === "RESOLVED") update.resolvedAt = new Date();
    if (parsed.data.status === "CLOSED") update.closedAt = new Date();
  }
  if (parsed.data.assignedTo !== undefined) update.assignedTo = parsed.data.assignedTo;
  if (parsed.data.priority !== undefined) update.priority = parsed.data.priority;
  await prisma.supportTicket.update({
    where: { id },
    data: update,
  });
  const customerEmail = ticket.user?.email ?? ticket.guestEmail ?? null;
  if (customerEmail && (parsed.data.status === "RESOLVED" || parsed.data.status === "CLOSED")) {
    try {
      await sendTicketResolvedEmail(customerEmail, ticket.ticketNumber, ticket.subject);
    } catch (e) {
      console.error("Ticket resolved email error:", e);
    }
  }
  return NextResponse.json({ success: true });
}

const replySchema = z.object({
  message: z.string().min(1).max(5000),
  isInternal: z.boolean().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = replySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const isInternal = parsed.data.isInternal ?? false;
  await prisma.$transaction([
    prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: userId,
        senderType: "STAFF",
        message: parsed.data.message,
        attachments: [],
        isInternal,
      },
    }),
    prisma.supportTicket.update({
      where: { id },
      data: {
        updatedAt: new Date(),
        ...(parsed.data.status && {
          status: parsed.data.status,
          ...(parsed.data.status === "RESOLVED" && { resolvedAt: new Date() }),
          ...(parsed.data.status === "CLOSED" && { closedAt: new Date() }),
        }),
      },
    }),
  ]);
  if (!isInternal) {
    const customerEmail = ticket.user?.email ?? ticket.guestEmail ?? null;
    if (customerEmail) {
      try {
        await sendTicketRepliedEmail(
          customerEmail,
          ticket.ticketNumber,
          ticket.subject,
          parsed.data.message
        );
      } catch (e) {
        console.error("Ticket replied email error:", e);
      }
    }
  }
  if (parsed.data.status === "RESOLVED" || parsed.data.status === "CLOSED") {
    const customerEmail = ticket.user?.email ?? ticket.guestEmail ?? null;
    if (customerEmail) {
      try {
        await sendTicketResolvedEmail(customerEmail, ticket.ticketNumber, ticket.subject);
      } catch (e) {
        console.error("Ticket resolved email error:", e);
      }
    }
  }
  return NextResponse.json({ success: true });
}
