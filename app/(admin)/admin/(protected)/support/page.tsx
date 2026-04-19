export const dynamic = 'force-dynamic'
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import Link from "next/link";

export default async function AdminSupportPage() {
  try {

  await requireAdminSection("/admin/orders");
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      ticketNumber: true,
      subject: true,
      status: true,
      priority: true,
      guestEmail: true,
      guestName: true,
      createdAt: true,
      userId: true,
    },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold">Support tickets</h1>
      <p className="text-muted-foreground text-sm mt-1">View and manage customer support requests.</p>
      <div className="rounded-xl border mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Ticket</th>
              <th className="text-left p-3 font-medium">Subject</th>
              <th className="text-left p-3 font-medium">From</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">No tickets yet.</td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    <Link href={`/admin/support/${t.id}`} className="font-mono text-primary hover:underline">
                      {t.ticketNumber}
                    </Link>
                  </td>
                  <td className="p-3">{t.subject}</td>
                  <td className="p-3">
                    {t.guestName ?? "User"} {t.guestEmail && <span className="text-muted-foreground">({t.guestEmail})</span>}
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs ${
                      t.status === "OPEN" ? "bg-amber-100" : t.status === "RESOLVED" || t.status === "CLOSED" ? "bg-green-100" : "bg-slate-100"
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  } catch (error) {
    console.error("Data load failed in page.tsx:", error);
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          <h2 className="font-bold text-lg mb-2">Service Temporarily Unavailable</h2>
          <p className="text-sm">We are experiencing issues connecting to our database. Please try refreshing the page in a few moments.</p>
        </div>
      </div>
    );
  }
}
