import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import Link from "next/link";
import { SupportTicketDetailClient } from "./support-ticket-detail-client";

export default async function AdminSupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSection("/admin/orders");
  const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, name: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!ticket) notFound();
  const fromEmail = ticket.guestEmail ?? ticket.user?.email ?? "—";
  const fromName = ticket.guestName ?? ticket.user?.name ?? "User";

  const serialized = {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    status: ticket.status,
    priority: ticket.priority,
    messages: ticket.messages.map((m) => ({
      id: m.id,
      senderType: m.senderType,
      message: m.message,
      isInternal: m.isInternal,
      createdAt: m.createdAt.toISOString(),
    })),
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/admin/support" className="text-sm text-primary hover:underline">← Back to tickets</Link>
      <div className="mt-4 rounded-xl border p-6">
        <span className="font-mono text-sm text-muted-foreground">{ticket.ticketNumber}</span>
        <h1 className="text-xl font-bold mt-1">{ticket.subject}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {fromName} · {fromEmail} · Status: {ticket.status}
        </p>
      </div>
      <SupportTicketDetailClient ticket={serialized} />
    </div>
  );
}
